import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/authz';
import type { BusinessHourDTO } from '@/types';

/**
 * Horário de funcionamento é informação pública e inofensiva (útil, em
 * tese, também para a própria vitrine pública) — a rota GET
 * correspondente já é intencionalmente pública, então esta função não
 * exige sessão. As operações de ESCRITA abaixo (`upsertBusinessHour`,
 * `updateSettings`) exigem, sim.
 */
export async function getBusinessHours(businessId: string): Promise<BusinessHourDTO[]> {
  const hours = await prisma.businessHour.findMany({
    where: { businessId },
    orderBy: { weekday: 'asc' },
  });
  return hours.map((h) => ({
    weekday: h.weekday,
    isOpen: h.isOpen,
    startTime: h.startTime,
    endTime: h.endTime,
  }));
}

export async function upsertBusinessHour(
  businessId: string,
  data: { weekday: number; isOpen: boolean; startTime: string; endTime: string }
): Promise<BusinessHourDTO> {
  await requireAdminSession();
  const hour = await prisma.businessHour.upsert({
    where: { businessId_weekday: { businessId, weekday: data.weekday } },
    update: { isOpen: data.isOpen, startTime: data.startTime, endTime: data.endTime },
    create: {
      businessId,
      weekday: data.weekday,
      isOpen: data.isOpen,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });
  return {
    weekday: hour.weekday,
    isOpen: hour.isOpen,
    startTime: hour.startTime,
    endTime: hour.endTime,
  };
}

export async function getSettings(businessId: string) {
  await requireAdminSession();
  const settings = await prisma.setting.findUnique({ where: { businessId } });
  return settings;
}

export async function updateSettings(
  businessId: string,
  data: {
    slotIntervalMinutes: number;
    bookingWindowDays: number;
    cancellationWindowHours: number;
    whatsappNumber?: string;
  }
) {
  await requireAdminSession();
  return prisma.setting.upsert({
    where: { businessId },
    update: data,
    create: { businessId, ...data },
  });
}
