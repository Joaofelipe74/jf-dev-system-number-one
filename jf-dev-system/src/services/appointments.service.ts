import { prisma } from '@/lib/db';
import { BLOCKING_APPOINTMENT_STATUSES, hasConflict } from '@/lib/availability';
import { assertBookableSlot, BookingRuleViolationError } from '@/lib/booking-rules';
import { runSerializable, isExclusionConstraintViolation } from '@/lib/db-retry';
import { requireAdminSession } from '@/lib/authz';
import type { AppointmentDTO, AppointmentStatus } from '@/types';
import { findOrCreateClient } from '@/services/clients.service';

type AppointmentRecord = {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  priceCents: number;
  notes: string | null;
  createdAt: Date;
  client: { name: string; phone: string };
  professional: { name: string };
  service: { name: string };
};

function toDTO(appointment: AppointmentRecord): AppointmentDTO {
  return {
    id: appointment.id,
    clientId: appointment.clientId,
    clientName: appointment.client.name,
    clientPhone: appointment.client.phone,
    professionalId: appointment.professionalId,
    professionalName: appointment.professional.name,
    serviceId: appointment.serviceId,
    serviceName: appointment.service.name,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    status: appointment.status as AppointmentStatus,
    priceCents: appointment.priceCents,
    notes: appointment.notes,
    createdAt: appointment.createdAt.toISOString(),
  };
}

const includeRelations = {
  client: { select: { name: true, phone: true } as const },
  professional: { select: { name: true } as const },
  service: { select: { name: true } as const },
} as const;

/** Lista agendamentos (uso administrativo — agenda, relatórios, filtros). */
export async function listAppointments(
  businessId: string,
  filters: { from?: Date; to?: Date; professionalId?: string; status?: AppointmentStatus } = {}
): Promise<AppointmentDTO[]> {
  await requireAdminSession();
  const appointments = await prisma.appointment.findMany({
    where: {
      businessId,
      professionalId: filters.professionalId || undefined,
      status: filters.status || undefined,
      startsAt: {
        gte: filters.from,
        lte: filters.to,
      },
    },
    include: includeRelations,
    orderBy: { startsAt: 'asc' },
  });
  return appointments.map(toDTO);
}

/**
 * Lista os agendamentos de UM cliente específico. Usada tanto pelo painel
 * administrativo (rota já protegida por sessão) quanto pelo fluxo público
 * de "Área do cliente" — SOMENTE depois que a identidade do cliente já foi
 * verificada por código de acesso de uso único (ver
 * `src/services/client-access.service.ts`). Esta função em si não checa
 * sessão porque o controle de acesso, nesse segundo caso, já aconteceu
 * antes de chegar aqui — nunca é chamada com um `clientId` que o
 * requisitante não comprovou ser dono.
 */
export async function listAppointmentsByClient(clientId: string): Promise<AppointmentDTO[]> {
  const appointments = await prisma.appointment.findMany({
    where: { clientId },
    include: includeRelations,
    orderBy: { startsAt: 'desc' },
  });
  return appointments.map(toDTO);
}

export class AppointmentConflictError extends Error {
  constructor(message?: string) {
    super(message ?? 'Este profissional já possui um agendamento nesse horário. Escolha outro horário.');
    this.name = 'AppointmentConflictError';
  }
}

/**
 * Cria um agendamento.
 *
 * Todas as regras de negócio (horário de funcionamento, expediente do
 * profissional, vínculo profissional↔serviço, duração real do serviço,
 * bloqueios, conflito com outros agendamentos, horário no passado, janela
 * de agendamento, fuso horário do negócio) são validadas por
 * `assertBookableSlot()` — a MESMA função usada por disponibilidade,
 * reagendamento e reativação.
 *
 * A validação + a busca/criação do cliente + a escrita do agendamento
 * acontecem em UMA ÚNICA transação SERIALIZABLE, com retry automático em
 * caso de conflito de concorrência detectado pelo Postgres (ver
 * `src/lib/db-retry.ts`) — uma consulta de disponibilidade antes do INSERT,
 * sozinha, NÃO seria suficiente para impedir duas reservas simultâneas do
 * mesmo horário; é a transação serializável (mais a constraint de exclusão
 * do banco, como barreira final) que garante isso de verdade.
 */
export async function createAppointment(params: {
  businessId: string;
  professionalId: string;
  serviceId: string;
  startsAt: Date;
  client: { name: string; phone: string; email?: string; notes?: string };
  status?: AppointmentStatus;
}): Promise<AppointmentDTO> {
  try {
    const appointment = await runSerializable(async (tx) => {
      const { endsAt, priceCents } = await assertBookableSlot({
        tx,
        businessId: params.businessId,
        professionalId: params.professionalId,
        serviceId: params.serviceId,
        startsAt: params.startsAt,
      });

      // Cria (ou reaproveita) o cliente DENTRO da mesma transação que
      // valida e grava o agendamento — se qualquer etapa falhar, nada é
      // persistido (nem um cliente "órfão" sem agendamento).
      const client = await findOrCreateClient(tx, params.businessId, params.client);

      return tx.appointment.create({
        data: {
          businessId: params.businessId,
          clientId: client.id,
          professionalId: params.professionalId,
          serviceId: params.serviceId,
          startsAt: params.startsAt,
          endsAt,
          priceCents,
          status: params.status ?? 'pending',
          notes: params.client.notes || null,
        },
        include: includeRelations,
      });
    });

    return toDTO(appointment);
  } catch (error) {
    if (error instanceof BookingRuleViolationError) {
      throw new AppointmentConflictError(error.message);
    }
    if (isExclusionConstraintViolation(error)) {
      throw new AppointmentConflictError();
    }
    throw error;
  }
}

/**
 * Atualiza o status de um agendamento.
 *
 * CORREÇÃO CRÍTICA desta auditoria: transicionar para um status que ocupa
 * a agenda (`pending`, `confirmed`, `completed`) — o que inclui REATIVAR
 * um agendamento cancelado — agora passa pela MESMA validação central de
 * `createAppointment`. Antes, esta função fazia um `update` direto, sem
 * nenhuma checagem de conflito: era possível cancelar o agendamento A,
 * criar o agendamento B no mesmo horário, e então "confirmar" A de volta —
 * criando dois agendamentos simultâneos para o mesmo profissional. Agora
 * essa sequência é bloqueada com `AppointmentConflictError`.
 *
 * Para `completed`/`no_show` (operações retrospectivas — o horário já
 * aconteceu), a checagem de "horário no passado"/"janela de agendamento" é
 * pulada (`checkTiming: false`), mas o conflito com outro agendamento e as
 * demais regras continuam sendo verificados.
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<AppointmentDTO> {
  await requireAdminSession();

  const willOccupySlot = (BLOCKING_APPOINTMENT_STATUSES as readonly string[]).includes(status);

  try {
    const appointment = await runSerializable(async (tx) => {
      const current = await tx.appointment.findUniqueOrThrow({ where: { id } });

      if (willOccupySlot) {
        await assertBookableSlot({
          tx,
          businessId: current.businessId,
          professionalId: current.professionalId,
          serviceId: current.serviceId,
          startsAt: current.startsAt,
          excludeAppointmentId: id,
          checkTiming: status !== 'completed' && status !== 'no_show',
        });
      }

      return tx.appointment.update({
        where: { id },
        data: { status },
        include: includeRelations,
      });
    });

    return toDTO(appointment);
  } catch (error) {
    if (error instanceof BookingRuleViolationError) {
      throw new AppointmentConflictError(error.message);
    }
    if (isExclusionConstraintViolation(error)) {
      throw new AppointmentConflictError();
    }
    throw error;
  }
}

/**
 * Reagenda um agendamento para um novo horário.
 *
 * A duração usada é SEMPRE re-derivada do serviço no banco (nunca um valor
 * vindo do cliente) — evita que um reagendamento use uma duração
 * desatualizada ou manipulada. Passa pela mesma validação central.
 */
export async function rescheduleAppointment(id: string, startsAt: Date): Promise<AppointmentDTO> {
  await requireAdminSession();

  try {
    const appointment = await runSerializable(async (tx) => {
      const current = await tx.appointment.findUniqueOrThrow({ where: { id } });

      const { endsAt } = await assertBookableSlot({
        tx,
        businessId: current.businessId,
        professionalId: current.professionalId,
        serviceId: current.serviceId,
        startsAt,
        excludeAppointmentId: id,
      });

      return tx.appointment.update({
        where: { id },
        data: { startsAt, endsAt },
        include: includeRelations,
      });
    });

    return toDTO(appointment);
  } catch (error) {
    if (error instanceof BookingRuleViolationError) {
      throw new AppointmentConflictError(error.message);
    }
    if (isExclusionConstraintViolation(error)) {
      throw new AppointmentConflictError();
    }
    throw error;
  }
}

export class SelfServiceCancellationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SelfServiceCancellationError';
  }
}

/**
 * Cancelamento feito pelo PRÓPRIO cliente (Área do Cliente), depois de
 * verificação por código de acesso — não usa `requireAdminSession()`
 * porque a autorização aqui é outra: o cliente comprova ser dono do
 * agendamento através do token de acesso de curta duração (ver
 * `src/lib/auth.ts#createClientAccessToken`), verificado na rota antes de
 * chamar esta função. Esta função ainda faz sua própria checagem de posse
 * (`appointment.clientId === clientId`) — nunca confia apenas na rota.
 *
 * Aplica de verdade o `cancellationWindowHours` configurado (ver
 * auditoria: esse parâmetro existia no banco mas não era usado em lugar
 * nenhum) — o cliente não pode cancelar dentro da janela mínima de
 * antecedência definida pelo negócio.
 */
export async function cancelAppointmentAsClient(
  clientId: string,
  businessId: string,
  appointmentId: string
): Promise<AppointmentDTO> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: includeRelations,
  });

  if (!appointment || appointment.clientId !== clientId || appointment.businessId !== businessId) {
    throw new SelfServiceCancellationError('Agendamento não encontrado.');
  }
  if (appointment.status === 'cancelled') {
    throw new SelfServiceCancellationError('Este agendamento já está cancelado.');
  }
  if (appointment.status === 'completed' || appointment.status === 'no_show') {
    throw new SelfServiceCancellationError('Não é possível cancelar um atendimento já finalizado.');
  }

  const settings = await prisma.setting.findUnique({ where: { businessId } });
  const cancellationWindowHours = settings?.cancellationWindowHours ?? 2;
  const minimumNoticeMs = cancellationWindowHours * 60 * 60_000;

  if (appointment.startsAt.getTime() - Date.now() < minimumNoticeMs) {
    throw new SelfServiceCancellationError(
      cancellationWindowHours > 0
        ? `Este agendamento só pode ser cancelado com pelo menos ${cancellationWindowHours}h de antecedência. Entre em contato diretamente para cancelar.`
        : 'Não é mais possível cancelar este agendamento pelo site.'
    );
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'cancelled' },
    include: includeRelations,
  });

  return toDTO(updated);
}

export async function deleteAppointment(id: string): Promise<void> {
  await requireAdminSession();
  await prisma.appointment.delete({ where: { id } });
}

/** Reexporta utilitários puros, úteis para checagens rápidas fora do banco (ex.: componentes de UI). */
export { hasConflict };
