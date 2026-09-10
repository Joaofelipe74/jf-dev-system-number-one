import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getDefaultBusinessId } from '@/services/business.service';
import { AppointmentConflictError, createAppointment, listAppointments } from '@/services/appointments.service';
import { createAppointmentSchema, flattenZodErrors } from '@/lib/validation';
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit';
import type { AppointmentStatus } from '@/types';

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const businessId = await getDefaultBusinessId();
  const params = request.nextUrl.searchParams;
  const from = params.get('from');
  const to = params.get('to');
  const professionalId = params.get('professionalId') ?? undefined;
  const status = (params.get('status') as AppointmentStatus | null) ?? undefined;

  const appointments = await listAppointments(businessId, {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    professionalId,
    status,
  });

  return NextResponse.json({ appointments });
}

/**
 * Criação pública de agendamento (fluxo do site). TODA a validação de
 * negócio — horário de funcionamento, expediente do profissional, vínculo
 * profissional↔serviço, duração REAL do serviço (nunca um valor vindo do
 * corpo da requisição), bloqueios, conflito com outros agendamentos,
 * horário no passado e janela de agendamento — acontece dentro de
 * `createAppointment()` (`src/services/appointments.service.ts`), em uma
 * transação serializável com retry, mesmo que o horário tenha vindo da
 * lista retornada por `/api/availability`.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = consumeRateLimit({ key: `create-appointment:${ip}`, limit: 12, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: 'Muitas tentativas. Aguarde um momento e tente novamente.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const businessId = await getDefaultBusinessId();
  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ message: 'Horário inválido.' }, { status: 400 });
  }

  try {
    const appointment = await createAppointment({
      businessId,
      professionalId: parsed.data.professionalId,
      serviceId: parsed.data.serviceId,
      startsAt,
      client: parsed.data.client,
    });
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    throw error;
  }
}
