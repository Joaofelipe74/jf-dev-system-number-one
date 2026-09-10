/**
 * Testes de lógica pura, sem Prisma/Next.js — executáveis com `tsx` sem
 * precisar instalar nenhuma dependência do projeto (só usam
 * `src/lib/timezone.ts` e `src/lib/availability.ts`, que não importam
 * nada externo).
 *
 * Rodar: npx tsx scripts/test-pure-logic.ts
 *
 * Por que este arquivo existe: o sandbox usado para esta correção não tem
 * acesso à internet para instalar `node_modules` (nem `@prisma/client`,
 * nem `next`, nem um test runner) — então não é possível rodar `npm test`,
 * `next build` ou os testes de integração completos aqui. Isso NÃO
 * significa que a lógica central não foi testada: este script verifica de
 * verdade, executando o código real de `src/lib/`, os pontos mais
 * arriscados desta correção (fuso horário e cálculo de disponibilidade).
 * Veja "RELATORIO_DE_TESTES.md" para o resultado real desta execução.
 */
import assert from 'node:assert/strict';
import {
  getZonedParts,
  zonedTimeToUtc,
  zonedDateAndMinutesToUtc,
  weekdayOf,
  formatInZone,
} from '../src/lib/timezone';
import { computeAvailableSlots, hasConflict } from '../src/lib/availability';

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK   - ${name}`);
    passed++;
  } catch (error) {
    console.error(`FAIL - ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

// --------------------------------------------------------------------------
// Fuso horário: America/Sao_Paulo é UTC-3 (Brasil aboliu o horário de
// verão em 2019, então não há variação sazonal a considerar).
// --------------------------------------------------------------------------

test('zonedTimeToUtc: 09:00 em São Paulo é 12:00 UTC', () => {
  const utc = zonedTimeToUtc({ year: 2026, month: 9, day: 15, hour: 9, minute: 0 }, 'America/Sao_Paulo');
  assert.equal(utc.toISOString(), '2026-09-15T12:00:00.000Z');
});

test('getZonedParts: converte um instante UTC de volta para os componentes locais corretos', () => {
  const instant = new Date('2026-09-15T12:00:00.000Z');
  const parts = getZonedParts(instant, 'America/Sao_Paulo');
  assert.equal(parts.hour, 9);
  assert.equal(parts.minute, 0);
  assert.equal(parts.day, 15);
  assert.equal(parts.month, 9);
  assert.equal(parts.year, 2026);
});

test('weekdayOf: 15/09/2026 é uma terça-feira (weekday 2) no fuso do negócio', () => {
  // Confirmado externamente: 15 de setembro de 2026 cai numa terça-feira.
  assert.equal(weekdayOf('2026-09-15', 'America/Sao_Paulo'), 2);
});

test('zonedDateAndMinutesToUtc + formatInZone fazem o caminho de ida e volta corretamente', () => {
  const utc = zonedDateAndMinutesToUtc('2026-09-15', 9 * 60 + 30, 'America/Sao_Paulo'); // 09:30 local
  assert.equal(formatInZone(utc, 'America/Sao_Paulo'), '09:30');
});

test('REGRESSÃO: o mesmo horário local produz instantes UTC DIFERENTES em fusos diferentes', () => {
  // Este é o bug corrigido nesta auditoria: antes, o motor de
  // disponibilidade usava Date.setHours() (fuso do SERVIDOR), então
  // "09:00" sempre virava o mesmo instante UTC independente do fuso do
  // negócio configurado. Agora, o mesmo "09:00" em fusos diferentes
  // corretamente produz instantes UTC diferentes.
  const spUtc = zonedTimeToUtc({ year: 2026, month: 9, day: 15, hour: 9, minute: 0 }, 'America/Sao_Paulo');
  const utcUtc = zonedTimeToUtc({ year: 2026, month: 9, day: 15, hour: 9, minute: 0 }, 'UTC');
  assert.notEqual(spUtc.getTime(), utcUtc.getTime());
  assert.equal((spUtc.getTime() - utcUtc.getTime()) / (60 * 60_000), 3); // SP está 3h atrás de UTC
});

// --------------------------------------------------------------------------
// computeAvailableSlots — motor de disponibilidade
// --------------------------------------------------------------------------

const timeZone = 'America/Sao_Paulo';
const businessHour = { isOpen: true, startTime: '09:00', endTime: '12:00' };
const workingHour = { startTime: '09:00', endTime: '12:00' };

test('gera slots de 30 em 30 min respeitando o expediente (09:00-12:00, serviço de 30min)', () => {
  const slots = computeAvailableSlots({
    dateStr: '2026-09-15',
    timeZone,
    serviceDurationMinutes: 30,
    businessHour,
    workingHour,
    existingAppointments: [],
    blockedTimes: [],
    slotIntervalMinutes: 30,
    now: new Date('2026-09-01T00:00:00.000Z'),
  });
  // 09:00, 09:30, 10:00, 10:30, 11:00, 11:30 = 6 slots (11:30+30min=12:00, cabe exatamente)
  assert.equal(slots.length, 6);
  assert.equal(formatInZone(slots[0]!, timeZone), '09:00');
  assert.equal(formatInZone(slots[slots.length - 1]!, timeZone), '11:30');
});

test('remove slots que colidem com um agendamento existente', () => {
  const existingStart = zonedDateAndMinutesToUtc('2026-09-15', 9 * 60 + 30, timeZone);
  const existingEnd = zonedDateAndMinutesToUtc('2026-09-15', 10 * 60, timeZone);
  const slots = computeAvailableSlots({
    dateStr: '2026-09-15',
    timeZone,
    serviceDurationMinutes: 30,
    businessHour,
    workingHour,
    existingAppointments: [{ start: existingStart, end: existingEnd }],
    blockedTimes: [],
    slotIntervalMinutes: 30,
    now: new Date('2026-09-01T00:00:00.000Z'),
  });
  const labels = slots.map((s) => formatInZone(s, timeZone));
  assert.ok(!labels.includes('09:30'), '09:30 deveria estar ocupado');
  assert.ok(labels.includes('09:00'));
  assert.ok(labels.includes('10:00'));
});

test('remove slots que colidem com um bloqueio manual', () => {
  const blockStart = zonedDateAndMinutesToUtc('2026-09-15', 10 * 60, timeZone);
  const blockEnd = zonedDateAndMinutesToUtc('2026-09-15', 11 * 60, timeZone);
  const slots = computeAvailableSlots({
    dateStr: '2026-09-15',
    timeZone,
    serviceDurationMinutes: 30,
    businessHour,
    workingHour,
    existingAppointments: [],
    blockedTimes: [{ start: blockStart, end: blockEnd }],
    slotIntervalMinutes: 30,
    now: new Date('2026-09-01T00:00:00.000Z'),
  });
  const labels = slots.map((s) => formatInZone(s, timeZone));
  assert.ok(!labels.includes('10:00') && !labels.includes('10:30'));
});

test('nunca oferece um horário no passado', () => {
  // "agora" é 09:45 no dia — só 10:00, 10:30, 11:00, 11:30 devem sobrar.
  const now = zonedDateAndMinutesToUtc('2026-09-15', 9 * 60 + 45, timeZone);
  const slots = computeAvailableSlots({
    dateStr: '2026-09-15',
    timeZone,
    serviceDurationMinutes: 30,
    businessHour,
    workingHour,
    existingAppointments: [],
    blockedTimes: [],
    slotIntervalMinutes: 30,
    now,
  });
  assert.equal(slots.length, 4);
});

test('respeita bookingWindowDays — não oferece slots além da janela configurada', () => {
  const now = new Date('2026-09-01T00:00:00.000Z');
  const slots = computeAvailableSlots({
    dateStr: '2026-09-15', // 14 dias no futuro a partir de 01/09
    timeZone,
    serviceDurationMinutes: 30,
    businessHour,
    workingHour,
    existingAppointments: [],
    blockedTimes: [],
    slotIntervalMinutes: 30,
    bookingWindowDays: 10, // janela menor que a distância até 15/09
    now,
  });
  assert.equal(slots.length, 0);
});

test('negócio fechado no dia => nenhum slot', () => {
  const slots = computeAvailableSlots({
    dateStr: '2026-09-15',
    timeZone,
    serviceDurationMinutes: 30,
    businessHour: { isOpen: false, startTime: '09:00', endTime: '12:00' },
    workingHour,
    existingAppointments: [],
    blockedTimes: [],
    slotIntervalMinutes: 30,
  });
  assert.equal(slots.length, 0);
});

test('hasConflict: detecta sobreposição parcial e não detecta intervalos adjacentes', () => {
  const occupied = [{ start: new Date('2026-01-01T10:00:00Z'), end: new Date('2026-01-01T10:30:00Z') }];
  assert.equal(
    hasConflict({ start: new Date('2026-01-01T10:15:00Z'), end: new Date('2026-01-01T10:45:00Z') }, occupied),
    true
  );
  assert.equal(
    hasConflict({ start: new Date('2026-01-01T10:30:00Z'), end: new Date('2026-01-01T11:00:00Z') }, occupied),
    false
  );
});

console.log(`\n${passed} teste(s) passaram.`);
if (process.exitCode) {
  console.error('Há falhas acima.');
} else {
  console.log('Todos os testes de lógica pura passaram.');
}
