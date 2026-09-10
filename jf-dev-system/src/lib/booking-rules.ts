import type { Prisma } from '@prisma/client';
import { BLOCKING_APPOINTMENT_STATUSES } from '@/lib/availability';
import {
  getZonedParts,
  timeStringToMinutes,
  weekdayOf,
  zonedDateAndMinutesToUtc,
} from '@/lib/timezone';

/**
 * Motor ÚNICO de validação de regras de agendamento — a peça central desta
 * correção.
 *
 * ANTES: cada fluxo (disponibilidade, criação, reagendamento) reimplementava
 * pedaços da regra, e um caminho — trocar o STATUS de um agendamento
 * existente (ex.: reativar um cancelado para "confirmado") — não passava
 * por NENHUMA validação de conflito. Isso permitia exatamente o cenário
 * descrito na auditoria: cancelar A, criar B no mesmo horário, e então
 * reativar A — resultando em dois agendamentos simultâneos para o mesmo
 * profissional.
 *
 * AGORA: toda transição que faz um agendamento OCUPAR a agenda de um
 * profissional (criar, reagendar, ou mudar o status para um status que
 * "bloqueia" o horário) passa por `assertBookableSlot()`, que valida, nesta
 * ordem, dentro da MESMA transação de banco que fará a escrita:
 *
 *   1. negócio e configurações existem;
 *   2. profissional está ativo;
 *   3. profissional realmente atende esse serviço (vínculo profissional↔serviço);
 *   4. serviço está ativo, e a duração usada é a duração REAL do serviço no
 *      banco (nunca um valor vindo do cliente/frontend);
 *   5. horário de funcionamento do negócio cobre o intervalo, no FUSO
 *      HORÁRIO DO NEGÓCIO (não do servidor — ver `src/lib/timezone.ts`);
 *   6. horário de trabalho do profissional cobre o intervalo;
 *   7. o horário não está no passado (comparado ao "agora" no fuso do
 *      negócio);
 *   8. o horário não ultrapassa `bookingWindowDays`;
 *   9. não há bloqueio manual (`BlockedTime`) sobrepondo o intervalo;
 *  10. não há outro agendamento "ativo" (pending/confirmed/completed)
 *      sobrepondo o intervalo para o mesmo profissional (excluindo o
 *      próprio agendamento, no caso de reagendar/reativar).
 *
 * A checagem de conflito (passo 10) ainda não é, sozinha, suficiente contra
 * duas requisições verdadeiramente simultâneas — por isso ela roda dentro
 * de uma transação SERIALIZABLE com retry (ver `runSerializable` em
 * `src/services/appointments.service.ts`) E existe uma constraint de
 * exclusão no próprio Postgres (`prisma/migrations/.../add_exclusion_constraint`)
 * como barreira final, no nível do banco, que nenhuma race condition de
 * aplicação consegue burlar.
 */

export class BookingRuleViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingRuleViolationError';
  }
}

type Tx = Prisma.TransactionClient;

export interface AssertBookableSlotParams {
  tx: Tx;
  businessId: string;
  professionalId: string;
  serviceId: string;
  /** Instante UTC real do início do agendamento. */
  startsAt: Date;
  /** Ao reagendar ou reativar um agendamento existente, exclui-o da checagem de conflito consigo mesmo. */
  excludeAppointmentId?: string;
  /** Injetável para testes determinísticos. */
  now?: Date;
  /**
   * Quando `false`, pula as checagens de "horário no passado" e
   * "bookingWindowDays" — usado apenas ao marcar um agendamento já
   * existente como "concluído" ou "não compareceu", operações
   * inerentemente retrospectivas (o horário já aconteceu). Todas as
   * demais checagens (profissional ativo, vínculo com o serviço,
   * bloqueios, conflito com outro agendamento) continuam valendo mesmo
   * com `checkTiming: false`. Para CRIAR, REAGENDAR ou REATIVAR
   * (transicionar de cancelado/não-compareceu de volta para
   * pendente/confirmado) o padrão `true` deve ser mantido — é exatamente
   * essa checagem que impede reativar um agendamento cujo horário já foi
   * ocupado por outro cliente ou que já ficou no passado.
   */
  checkTiming?: boolean;
}

export interface BookableSlotResult {
  endsAt: Date;
  durationMinutes: number;
  priceCents: number;
  timeZone: string;
}

function toDateOnlyString(instant: Date, timeZone: string): string {
  const zoned = getZonedParts(instant, timeZone);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${zoned.year}-${pad(zoned.month)}-${pad(zoned.day)}`;
}

/**
 * Valida TODAS as regras de negócio para um agendamento em `startsAt` e
 * devolve os dados derivados no servidor (duração, preço, fuso) que devem
 * ser usados para a escrita — nunca os valores que o cliente possa ter
 * enviado.
 *
 * Lança `BookingRuleViolationError` com uma mensagem em português adequada
 * para ser exibida ao usuário quando qualquer regra falhar.
 */
export async function assertBookableSlot(params: AssertBookableSlotParams): Promise<BookableSlotResult> {
  const { tx, businessId, professionalId, serviceId, startsAt, excludeAppointmentId } = params;
  const now = params.now ?? new Date();
  const checkTiming = params.checkTiming ?? true;

  const business = await tx.business.findUnique({ where: { id: businessId } });
  if (!business) {
    throw new BookingRuleViolationError('Negócio não encontrado.');
  }
  const timeZone = business.timezone || 'America/Sao_Paulo';

  const [professional, service, settings] = await Promise.all([
    tx.professional.findFirst({
      where: { id: professionalId, businessId },
      include: { professionalServices: { where: { serviceId }, select: { serviceId: true } } },
    }),
    tx.service.findFirst({ where: { id: serviceId, businessId } }),
    tx.setting.findUnique({ where: { businessId } }),
  ]);

  if (!professional || !professional.isActive) {
    throw new BookingRuleViolationError('Este profissional não está mais disponível.');
  }
  if (!service || !service.isActive) {
    throw new BookingRuleViolationError('Este serviço não está mais disponível.');
  }
  if (professional.professionalServices.length === 0) {
    throw new BookingRuleViolationError('Este profissional não atende este serviço.');
  }

  // A duração e o preço usados daqui em diante SEMPRE vêm do banco — nunca
  // de um valor que o cliente possa ter enviado na requisição.
  const durationMinutes = service.durationMinutes;
  const priceCents = service.priceCents;
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  if (checkTiming && startsAt.getTime() < now.getTime() - 60_000) {
    throw new BookingRuleViolationError('Não é possível agendar em um horário no passado.');
  }

  if (checkTiming) {
    const bookingWindowDays = settings?.bookingWindowDays ?? 30;
    const maxDate = new Date(now.getTime() + bookingWindowDays * 24 * 60 * 60_000);
    if (startsAt.getTime() > maxDate.getTime()) {
      throw new BookingRuleViolationError(
        `Só é possível agendar com até ${bookingWindowDays} dia(s) de antecedência.`
      );
    }
  }

  const dateStr = toDateOnlyString(startsAt, timeZone);
  const weekday = weekdayOf(dateStr, timeZone);

  const [businessHour, workingHour] = await Promise.all([
    tx.businessHour.findUnique({ where: { businessId_weekday: { businessId, weekday } } }),
    tx.professionalWorkingHour.findUnique({
      where: { professionalId_weekday: { professionalId, weekday } },
    }),
  ]);

  if (!businessHour || !businessHour.isOpen) {
    throw new BookingRuleViolationError('O negócio está fechado nesse dia.');
  }
  if (!workingHour) {
    throw new BookingRuleViolationError('O profissional não trabalha nesse dia.');
  }

  const businessStart = timeStringToMinutes(businessHour.startTime);
  const businessEnd = timeStringToMinutes(businessHour.endTime);
  const workStart = Math.max(businessStart, timeStringToMinutes(workingHour.startTime));
  const workEnd = Math.min(businessEnd, timeStringToMinutes(workingHour.endTime));

  const slotStartMinutes = getZonedParts(startsAt, timeZone).hour * 60 + getZonedParts(startsAt, timeZone).minute;
  const slotEndMinutes = slotStartMinutes + durationMinutes;

  if (slotStartMinutes < workStart || slotEndMinutes > workEnd) {
    throw new BookingRuleViolationError('Horário fora do expediente do negócio ou do profissional.');
  }

  // Confere que o instante calculado a partir de "dateStr + slotStartMinutes"
  // no fuso do negócio bate com o `startsAt` recebido — protege contra um
  // horário que não corresponde a um slot alinhado ao fuso configurado.
  const recomputedStart = zonedDateAndMinutesToUtc(dateStr, slotStartMinutes, timeZone);
  if (Math.abs(recomputedStart.getTime() - startsAt.getTime()) > 1000) {
    throw new BookingRuleViolationError('Horário inválido.');
  }

  const blocked = await tx.blockedTime.findFirst({
    where: {
      businessId,
      OR: [{ professionalId }, { professionalId: null }],
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true },
  });
  if (blocked) {
    throw new BookingRuleViolationError('Este horário está bloqueado na agenda.');
  }

  const overlapping = await tx.appointment.findFirst({
    where: {
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      professionalId,
      status: { in: [...BLOCKING_APPOINTMENT_STATUSES] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true },
  });
  if (overlapping) {
    throw new BookingRuleViolationError(
      'Este profissional já possui um agendamento nesse horário. Escolha outro horário.'
    );
  }

  return { endsAt, durationMinutes, priceCents, timeZone };
}
