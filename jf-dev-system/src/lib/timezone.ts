/**
 * Utilitários de fuso horário do NEGÓCIO (não do servidor).
 *
 * Bug corrigido nesta correção: o motor de disponibilidade original usava
 * `Date.prototype.setHours()` / `getDay()`, que operam sempre no fuso
 * horário do **processo do servidor** (`TZ` do ambiente Node). Se o
 * servidor de produção rodar em UTC (comum em Vercel/Railway/containers) e
 * o negócio configurado for `America/Sao_Paulo` (UTC-3), um agendamento às
 * 09:00 podia ser calculado/exibido como 06:00 ou 12:00 dependendo de onde
 * o processo roda — um bug silencioso e grave.
 *
 * A correção usa `Intl.DateTimeFormat` (nativo, sem nova dependência) para
 * converter entre "data/hora local do negócio" e o instante UTC real
 * (`Date`), independente do fuso do servidor.
 */

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = domingo ... 6 = sábado, calculado no fuso do negócio. */
  weekday: number;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Lê os componentes de um instante (Date/UTC) como aparecem no fuso do negócio. */
export function getZonedParts(instant: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '0';

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: WEEKDAY_INDEX[get('weekday')] ?? 0,
  };
}

/**
 * Calcula o deslocamento (em minutos) do fuso `timeZone` em relação ao UTC,
 * no instante `instant` (varia com horário de verão quando aplicável).
 */
function getTimeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const zoned = getZonedParts(instant, timeZone);
  // Reconstrói o instante "como se" os componentes lidos no fuso fossem UTC,
  // e compara com o instante real — a diferença é o deslocamento do fuso.
  const asUtc = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second
  );
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/**
 * Converte uma data/hora "local ao negócio" (ano, mês, dia, hora, minuto)
 * para o instante UTC real (`Date`) correspondente.
 */
export function zonedTimeToUtc(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string
): Date {
  // Primeira aproximação: trata os componentes como se já fossem UTC.
  const naiveUtc = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0)
  );
  // Descobre o deslocamento real do fuso nesse instante aproximado e corrige.
  const offsetMinutes = getTimeZoneOffsetMinutes(naiveUtc, timeZone);
  return new Date(naiveUtc.getTime() - offsetMinutes * 60_000);
}

/** "YYYY-MM-DD" → meia-noite local do negócio, como instante UTC real. */
export function startOfBusinessDayUtc(dateStr: string, timeZone: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return zonedTimeToUtc({ year: year ?? 1970, month: month ?? 1, day: day ?? 1, hour: 0, minute: 0 }, timeZone);
}

/** Dia da semana (0-6) de uma string "YYYY-MM-DD" interpretada no fuso do negócio. */
export function weekdayOf(dateStr: string, timeZone: string): number {
  const startOfDay = startOfBusinessDayUtc(dateStr, timeZone);
  return getZonedParts(startOfDay, timeZone).weekday;
}

/** "HH:mm" → minutos desde a meia-noite. */
export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Converte "YYYY-MM-DD" + minutos-desde-meia-noite (fuso do negócio) em instante UTC. */
export function zonedDateAndMinutesToUtc(
  dateStr: string,
  minutes: number,
  timeZone: string
): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return zonedTimeToUtc(
    { year: year ?? 1970, month: month ?? 1, day: day ?? 1, hour, minute },
    timeZone
  );
}

/** Formata um instante como "HH:mm" no fuso do negócio (não no fuso do servidor/navegador). */
export function formatInZone(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(instant);
}

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';
