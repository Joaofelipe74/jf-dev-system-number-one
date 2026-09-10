/**
 * Motor de disponibilidade de horários.
 *
 * Funções puras e testáveis isoladamente (sem depender do Next.js ou do
 * Prisma) — recebem os dados já carregados do banco e devolvem os horários
 * realmente disponíveis, considerando:
 *   1. horário de funcionamento do negócio no dia da semana (no FUSO
 *      HORÁRIO DO NEGÓCIO, não no fuso do processo do servidor);
 *   2. horário de trabalho do profissional no dia da semana;
 *   3. duração do serviço escolhido;
 *   4. agendamentos já existentes daquele profissional;
 *   5. bloqueios manuais (folga, feriado, compromisso);
 *   6. intervalo entre horários (slotIntervalMinutes).
 *
 * CORREÇÃO DESTA AUDITORIA: a versão anterior usava `Date.setHours()` /
 * `Date.getDay()`, que dependem do fuso horário do PROCESSO do servidor
 * (variável de ambiente `TZ`), não do fuso configurado para o negócio
 * (`Business.timezone`, ex.: "America/Sao_Paulo"). Em produção, se o
 * servidor rodar em UTC (o padrão da maioria das plataformas), os horários
 * calculados ficavam deslocados em relação ao horário real do negócio. A
 * função agora recebe `dateStr` ("YYYY-MM-DD") + `timeZone` e usa
 * `src/lib/timezone.ts` (baseado em `Intl.DateTimeFormat`, sem dependência
 * nova) para fazer a conversão corretamente, em qualquer fuso do servidor.
 *
 * A MESMA lógica de conflito (`hasConflict`) é reaproveitada pelo motor de
 * regras central (`src/lib/booking-rules.ts`), usado por disponibilidade,
 * criação, reagendamento E reativação de agendamento — garantindo que a
 * regra "nunca dois agendamentos do mesmo profissional no mesmo intervalo"
 * seja sempre aplicada da mesma forma, em todo lugar.
 */

import { timeStringToMinutes, zonedDateAndMinutesToUtc, formatInZone } from '@/lib/timezone';

export interface Interval {
  start: Date;
  end: Date;
}

export interface AvailabilityInput {
  /** Dia para o qual calcular os horários, no formato "YYYY-MM-DD", interpretado no fuso do negócio. */
  dateStr: string;
  /** Fuso horário do negócio (ex.: "America/Sao_Paulo"). */
  timeZone: string;
  /** Duração do serviço selecionado, em minutos. */
  serviceDurationMinutes: number;
  /** Horário de funcionamento do negócio nesse dia da semana. */
  businessHour: { isOpen: boolean; startTime: string; endTime: string } | null;
  /** Horário de trabalho do profissional nesse dia da semana (se houver folga, é null). */
  workingHour: { startTime: string; endTime: string } | null;
  /** Agendamentos já existentes do profissional (qualquer status "ativo"). */
  existingAppointments: Interval[];
  /** Bloqueios manuais que afetam o profissional (ou o negócio inteiro) nesse dia. */
  blockedTimes: Interval[];
  /** Intervalo entre horários oferecidos, em minutos (ex.: 30). */
  slotIntervalMinutes: number;
  /** Quantos dias no futuro o agendamento pode ser feito (a partir de "agora"). */
  bookingWindowDays?: number;
  /** Instante atual — horários no passado nunca são oferecidos. */
  now?: Date;
}

/** Status de agendamento que efetivamente ocupam a agenda do profissional. */
export const BLOCKING_APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed'] as const;

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * REGRA CRÍTICA: verifica se um novo intervalo colide com algum intervalo
 * já ocupado. Usada tanto para filtrar os horários exibidos quanto,
 * principalmente, como barreira de segurança no backend (ver
 * `src/lib/booking-rules.ts`) antes de gravar um agendamento.
 */
export function hasConflict(candidate: Interval, occupied: Interval[]): boolean {
  return occupied.some((interval) =>
    intervalsOverlap(candidate.start, candidate.end, interval.start, interval.end)
  );
}

/** Calcula todos os horários de início disponíveis para um dia específico, no fuso do negócio. */
export function computeAvailableSlots(input: AvailabilityInput): Date[] {
  const {
    dateStr,
    timeZone,
    serviceDurationMinutes,
    businessHour,
    workingHour,
    existingAppointments,
    blockedTimes,
    slotIntervalMinutes,
    bookingWindowDays,
    now = new Date(),
  } = input;

  if (!businessHour || !businessHour.isOpen || !workingHour) {
    return [];
  }

  const businessStart = timeStringToMinutes(businessHour.startTime);
  const businessEnd = timeStringToMinutes(businessHour.endTime);
  const workStart = Math.max(businessStart, timeStringToMinutes(workingHour.startTime));
  const workEnd = Math.min(businessEnd, timeStringToMinutes(workingHour.endTime));

  if (workEnd - workStart < serviceDurationMinutes) {
    return [];
  }

  const maxDate = bookingWindowDays
    ? new Date(now.getTime() + bookingWindowDays * 24 * 60 * 60_000)
    : null;

  const occupied = [...existingAppointments, ...blockedTimes];
  const slots: Date[] = [];

  for (
    let minutes = workStart;
    minutes + serviceDurationMinutes <= workEnd;
    minutes += slotIntervalMinutes
  ) {
    const slotStart = zonedDateAndMinutesToUtc(dateStr, minutes, timeZone);
    const slotEnd = new Date(slotStart.getTime() + serviceDurationMinutes * 60_000);

    if (slotStart.getTime() < now.getTime()) continue;
    if (maxDate && slotStart.getTime() > maxDate.getTime()) continue;
    if (hasConflict({ start: slotStart, end: slotEnd }, occupied)) continue;

    slots.push(slotStart);
  }

  return slots;
}

/** Formata um horário (Date) como "HH:mm" no fuso do NEGÓCIO (não no fuso do navegador/servidor). */
export function formatSlotLabel(date: Date, timeZone: string): string {
  return formatInZone(date, timeZone);
}
