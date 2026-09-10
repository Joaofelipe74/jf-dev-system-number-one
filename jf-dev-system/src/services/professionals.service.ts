import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/authz';
import type { ProfessionalInput } from '@/lib/validation';
import type { ProfessionalDTO } from '@/types';

type ProfessionalRecord = {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  isActive: boolean;
  avatarColor: string;
  professionalServices: { serviceId: string }[];
  workingHours: { weekday: number; startTime: string; endTime: string }[];
};

function toDTO(professional: ProfessionalRecord): ProfessionalDTO {
  return {
    id: professional.id,
    name: professional.name,
    specialty: professional.specialty,
    phone: professional.phone,
    email: professional.email,
    isActive: professional.isActive,
    avatarColor: professional.avatarColor,
    serviceIds: professional.professionalServices.map((p) => p.serviceId),
    workingHours: professional.workingHours.map((w) => ({
      weekday: w.weekday,
      startTime: w.startTime,
      endTime: w.endTime,
    })),
  };
}

const includeRelations = {
  professionalServices: { select: { serviceId: true } as const },
  workingHours: { select: { weekday: true, startTime: true, endTime: true } as const },
} as const;

export async function listProfessionals(businessId: string): Promise<ProfessionalDTO[]> {
  await requireAdminSession();
  const professionals = await prisma.professional.findMany({
    where: { businessId },
    include: includeRelations,
    orderBy: { createdAt: 'desc' },
  });
  return professionals.map(toDTO);
}

/** Usado pelo fluxo PÚBLICO de agendamento — não exige sessão administrativa. */
export async function listActiveProfessionalsForService(
  businessId: string,
  serviceId: string
): Promise<ProfessionalDTO[]> {
  const professionals = await prisma.professional.findMany({
    where: {
      businessId,
      isActive: true,
      professionalServices: { some: { serviceId } },
    },
    include: includeRelations,
    orderBy: { name: 'asc' },
  });
  return professionals.map(toDTO);
}

export async function getProfessionalById(id: string): Promise<ProfessionalDTO | null> {
  await requireAdminSession();
  const professional = await prisma.professional.findUnique({
    where: { id },
    include: includeRelations,
  });
  return professional ? toDTO(professional) : null;
}

export async function createProfessional(
  businessId: string,
  data: ProfessionalInput
): Promise<ProfessionalDTO> {
  await requireAdminSession();
  const professional = await prisma.professional.create({
    data: {
      businessId,
      name: data.name,
      specialty: data.specialty,
      phone: data.phone,
      email: data.email,
      isActive: data.isActive,
      avatarColor: data.avatarColor,
      professionalServices: {
        create: data.serviceIds.map((serviceId) => ({ serviceId })),
      },
      workingHours: {
        create: data.workingHours.map((wh) => ({
          weekday: wh.weekday,
          startTime: wh.startTime,
          endTime: wh.endTime,
        })),
      },
    },
    include: includeRelations,
  });
  return toDTO(professional);
}

/**
 * Atualiza um profissional, incluindo os vínculos com serviços e os
 * horários de trabalho.
 *
 * CORREÇÃO: a versão anterior apagava os vínculos/horários antigos em uma
 * transação separada e SÓ DEPOIS atualizava o profissional com os novos
 * dados fora dessa transação. Se a segunda etapa falhasse (ex.: violação
 * de validação no banco, timeout, queda de conexão), o profissional ficava
 * sem NENHUM vínculo de serviço e sem NENHUM horário de trabalho — uma
 * exclusão parcial sem o dado novo para substituí-la. Agora tudo acontece
 * em uma única transação: ou tudo é aplicado, ou nada é.
 */
export async function updateProfessional(
  id: string,
  data: ProfessionalInput
): Promise<ProfessionalDTO> {
  await requireAdminSession();

  const professional = await prisma.$transaction(async (tx) => {
    await tx.professionalService.deleteMany({ where: { professionalId: id } });
    await tx.professionalWorkingHour.deleteMany({ where: { professionalId: id } });

    return tx.professional.update({
      where: { id },
      data: {
        name: data.name,
        specialty: data.specialty,
        phone: data.phone,
        email: data.email,
        isActive: data.isActive,
        avatarColor: data.avatarColor,
        professionalServices: {
          create: data.serviceIds.map((serviceId) => ({ serviceId })),
        },
        workingHours: {
          create: data.workingHours.map((wh) => ({
            weekday: wh.weekday,
            startTime: wh.startTime,
            endTime: wh.endTime,
          })),
        },
      },
      include: includeRelations,
    });
  });

  return toDTO(professional);
}

export async function toggleProfessionalActive(
  id: string,
  isActive: boolean
): Promise<ProfessionalDTO> {
  await requireAdminSession();
  const professional = await prisma.professional.update({
    where: { id },
    data: { isActive },
    include: includeRelations,
  });
  return toDTO(professional);
}

/**
 * Exclui um profissional. Se ele tiver agendamentos (histórico), o banco
 * RECUSA a exclusão (`Appointment.professional` usa `onDelete: Restrict`)
 * em vez de apagar o histórico em cascata — prefira desativar
 * (`toggleProfessionalActive`) um profissional com histórico.
 */
export async function deleteProfessional(id: string): Promise<void> {
  await requireAdminSession();
  await prisma.professional.delete({ where: { id } });
}
