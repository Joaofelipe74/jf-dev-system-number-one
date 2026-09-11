import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDefaultBusinessIdentity } from '@/services/business.service';
import type { BookingBootstrapDTO } from '@/types';

/**
 * Carrega em uma chamada os dados pequenos e públicos necessários às três
 * primeiras etapas do agendamento. Antes, cada clique aguardava uma função e
 * novas consultas ao banco. Horários ocupados NÃO entram neste cache: eles
 * continuam sendo consultados ao escolher a data e revalidados ao confirmar.
 */
export async function GET() {
  const business = await getDefaultBusinessIdentity();

  const [settings, services, professionals] = await Promise.all([
    prisma.setting.findUnique({
      where: { businessId: business.id },
      select: { whatsappNumber: true, bookingWindowDays: true },
    }),
    prisma.service.findMany({
      where: { businessId: business.id, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        durationMinutes: true,
        professionalServices: { select: { professionalId: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.professional.findMany({
      where: { businessId: business.id, isActive: true },
      select: {
        id: true,
        name: true,
        specialty: true,
        avatarColor: true,
        professionalServices: { select: { serviceId: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  const payload: BookingBootstrapDTO = {
    businessName: business.name,
    whatsappNumber: settings?.whatsappNumber || null,
    bookingWindowDays: settings?.bookingWindowDays ?? 30,
    services: services.map(({ professionalServices, ...service }) => ({
      ...service,
      professionalIds: professionalServices.map((item) => item.professionalId),
    })),
    professionals: professionals.map(({ professionalServices, ...professional }) => ({
      ...professional,
      serviceIds: professionalServices.map((item) => item.serviceId),
    })),
  };

  return NextResponse.json(payload, {
    headers: {
      // Dados cadastrais públicos podem ser reaproveitados por pouco tempo.
      // A confirmação do horário continua sem cache e protegida no banco.
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
    },
  });
}
