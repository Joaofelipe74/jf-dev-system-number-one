import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDefaultBusinessId } from '@/services/business.service';
import { BLOCKING_APPOINTMENT_STATUSES, computeAvailableSlots, formatSlotLabel } from '@/lib/availability';
import { weekdayOf, startOfBusinessDayUtc } from '@/lib/timezone';

/**
 * GET /api/availability?serviceId=...&professionalId=...&date=2026-09-14
 *
 * Rota pública que devolve SOMENTE os horários realmente disponíveis para
 * aquele serviço + profissional + dia, já considerando expediente do
 * negócio, expediente do profissional, agendamentos existentes, bloqueios
 * manuais e a janela de agendamento (`bookingWindowDays`) — tudo calculado
 * no FUSO HORÁRIO DO NEGÓCIO (`Business.timezone`), não no fuso do
 * processo do servidor (correção desta auditoria — ver `src/lib/timezone.ts`).
 *
 * Esta é a mesma lógica reaplicada no momento de confirmar o agendamento
 * (`src/lib/booking-rules.ts`), então a UI nunca consegue oferecer — nem
 * confirmar — um horário inválido.
 */
export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get('serviceId');
  const professionalId = request.nextUrl.searchParams.get('professionalId');
  const dateParam = request.nextUrl.searchParams.get('date'); // "YYYY-MM-DD"

  if (!serviceId || !professionalId || !dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json(
      { message: 'Informe serviço, profissional e data (YYYY-MM-DD).' },
      { status: 400 }
    );
  }

  const businessId = await getDefaultBusinessId();
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const timeZone = business?.timezone ?? 'America/Sao_Paulo';
  const weekday = weekdayOf(dateParam, timeZone);
  const dayStart = startOfBusinessDayUtc(dateParam, timeZone);
  const dayEnd = startOfBusinessDayUtc(dateParam, timeZone);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const [service, professional, businessHour, workingHour, existingAppointments, blockedTimes, settings] =
    await Promise.all([
      prisma.service.findFirst({ where: { id: serviceId, businessId, isActive: true } }),
      prisma.professional.findFirst({
        where: {
          id: professionalId,
          businessId,
          isActive: true,
          professionalServices: { some: { serviceId } },
        },
      }),
      prisma.businessHour.findUnique({ where: { businessId_weekday: { businessId, weekday } } }),
      prisma.professionalWorkingHour.findUnique({
        where: { professionalId_weekday: { professionalId, weekday } },
      }),
      prisma.appointment.findMany({
        where: {
          professionalId,
          status: { in: [...BLOCKING_APPOINTMENT_STATUSES] },
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
        select: { startsAt: true, endsAt: true },
      }),
      prisma.blockedTime.findMany({
        where: {
          OR: [{ professionalId }, { professionalId: null }],
          businessId,
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
        select: { startsAt: true, endsAt: true },
      }),
      prisma.setting.findUnique({ where: { businessId } }),
    ]);

  if (!service || !professional) {
    return NextResponse.json(
      { message: 'Serviço ou profissional indisponível para esta combinação.' },
      { status: 404 }
    );
  }

  const slots = computeAvailableSlots({
    dateStr: dateParam,
    timeZone,
    serviceDurationMinutes: service.durationMinutes,
    businessHour: businessHour
      ? { isOpen: businessHour.isOpen, startTime: businessHour.startTime, endTime: businessHour.endTime }
      : null,
    workingHour: workingHour
      ? { startTime: workingHour.startTime, endTime: workingHour.endTime }
      : null,
    existingAppointments: existingAppointments.map((a) => ({ start: a.startsAt, end: a.endsAt })),
    blockedTimes: blockedTimes.map((b) => ({ start: b.startsAt, end: b.endsAt })),
    slotIntervalMinutes: settings?.slotIntervalMinutes ?? 30,
    bookingWindowDays: settings?.bookingWindowDays ?? 30,
  });

  return NextResponse.json({
    slots: slots.map((slot) => ({ iso: slot.toISOString(), label: formatSlotLabel(slot, timeZone) })),
  });
}
