import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/authz';
import type { ServiceInput } from '@/lib/validation';
import type { ServiceDTO } from '@/types';

/**
 * Camada de acesso a dados de "Serviços". As rotas de API chamam estas
 * funções em vez de falar diretamente com o Prisma — mantém a lógica de
 * negócio em um lugar só e facilita trocar o banco no futuro.
 */

function toDTO(service: {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  professionalServices: { professionalId: string }[];
}): ServiceDTO {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    priceCents: service.priceCents,
    durationMinutes: service.durationMinutes,
    isActive: service.isActive,
    createdAt: service.createdAt.toISOString(),
    professionalIds: service.professionalServices.map((p) => p.professionalId),
  };
}

export async function listServices(businessId: string): Promise<ServiceDTO[]> {
  await requireAdminSession();
  const services = await prisma.service.findMany({
    where: { businessId },
    include: { professionalServices: { select: { professionalId: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return services.map(toDTO);
}

/** Usado pelo fluxo PÚBLICO de agendamento — não exige sessão administrativa. */
export async function listActiveServicesForBooking(businessId: string): Promise<ServiceDTO[]> {
  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
    include: { professionalServices: { select: { professionalId: true } } },
    orderBy: { name: 'asc' },
  });
  return services.map(toDTO);
}

export async function getServiceById(id: string): Promise<ServiceDTO | null> {
  const service = await prisma.service.findUnique({
    where: { id },
    include: { professionalServices: { select: { professionalId: true } } },
  });
  return service ? toDTO(service) : null;
}

export async function createService(businessId: string, data: ServiceInput): Promise<ServiceDTO> {
  await requireAdminSession();
  const service = await prisma.service.create({
    data: {
      businessId,
      name: data.name,
      description: data.description || null,
      priceCents: data.priceCents,
      durationMinutes: data.durationMinutes,
      isActive: data.isActive,
      professionalServices: {
        create: data.professionalIds.map((professionalId) => ({ professionalId })),
      },
    },
    include: { professionalServices: { select: { professionalId: true } } },
  });
  return toDTO(service);
}

/**
 * Atualiza um serviço, incluindo os vínculos com profissionais.
 *
 * CORREÇÃO: assim como em `professionals.service.ts`, o vínculo antigo era
 * apagado em uma chamada separada da atualização do serviço — uma falha
 * entre as duas etapas deixava o serviço sem NENHUM profissional
 * vinculado. Agora as duas etapas acontecem em uma única transação.
 */
export async function updateService(id: string, data: ServiceInput): Promise<ServiceDTO> {
  await requireAdminSession();

  const service = await prisma.$transaction(async (tx) => {
    await tx.professionalService.deleteMany({ where: { serviceId: id } });
    return tx.service.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        priceCents: data.priceCents,
        durationMinutes: data.durationMinutes,
        isActive: data.isActive,
        professionalServices: {
          create: data.professionalIds.map((professionalId) => ({ professionalId })),
        },
      },
      include: { professionalServices: { select: { professionalId: true } } },
    });
  });

  return toDTO(service);
}

export async function toggleServiceActive(id: string, isActive: boolean): Promise<ServiceDTO> {
  await requireAdminSession();
  const service = await prisma.service.update({
    where: { id },
    data: { isActive },
    include: { professionalServices: { select: { professionalId: true } } },
  });
  return toDTO(service);
}

/**
 * Exclui um serviço. Se ele tiver agendamentos (histórico), o banco
 * RECUSA a exclusão (`Appointment.service` usa `onDelete: Restrict`) em
 * vez de apagar o histórico em cascata — prefira desativar
 * (`toggleServiceActive`) um serviço com histórico.
 */
export async function deleteService(id: string): Promise<void> {
  await requireAdminSession();
  await prisma.service.delete({ where: { id } });
}
