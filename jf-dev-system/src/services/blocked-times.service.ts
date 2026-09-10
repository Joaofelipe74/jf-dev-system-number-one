import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/authz';
import type { BlockedTimeDTO } from '@/types';

function toDTO(item: {
  id: string;
  professionalId: string | null;
  title: string;
  startsAt: Date;
  endsAt: Date;
}): BlockedTimeDTO {
  return {
    id: item.id,
    professionalId: item.professionalId,
    title: item.title,
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt.toISOString(),
  };
}

export async function listBlockedTimes(
  businessId: string,
  range?: { from: Date; to: Date }
): Promise<BlockedTimeDTO[]> {
  await requireAdminSession();
  const items = await prisma.blockedTime.findMany({
    where: {
      businessId,
      startsAt: range ? { lte: range.to } : undefined,
      endsAt: range ? { gte: range.from } : undefined,
    },
    orderBy: { startsAt: 'asc' },
  });
  return items.map(toDTO);
}

export async function createBlockedTime(
  businessId: string,
  data: { professionalId: string | null; title: string; startsAt: Date; endsAt: Date }
): Promise<BlockedTimeDTO> {
  await requireAdminSession();
  const item = await prisma.blockedTime.create({
    data: {
      businessId,
      professionalId: data.professionalId,
      title: data.title,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    },
  });
  return toDTO(item);
}

export async function deleteBlockedTime(id: string): Promise<void> {
  await requireAdminSession();
  await prisma.blockedTime.delete({ where: { id } });
}
