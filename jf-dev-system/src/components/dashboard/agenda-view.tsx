'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Ban, CalendarDays, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonRows } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api-client';
import { getInitials, cn } from '@/lib/utils';
import {
  addDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  getMonthGridDays,
  toISODateString,
  formatLongDate,
  formatTime,
  isSameDay,
} from '@/utils/dates';
import { AdminAppointmentForm } from '@/components/dashboard/admin-appointment-form';
import { BlockTimeForm } from '@/components/dashboard/block-time-form';
import type { AppointmentDTO, BlockedTimeDTO, ProfessionalDTO, ServiceDTO } from '@/types';

type ViewMode = 'day' | 'week' | 'month';

interface AgendaViewProps {
  professionals: ProfessionalDTO[];
  services: ServiceDTO[];
}

/** Um bloqueio "toca" um dia se os dois intervalos se sobrepõem — não apenas se o bloqueio COMEÇA naquele dia. */
function blockTouchesDay(block: BlockedTimeDTO, day: Date): boolean {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const blockStart = new Date(block.startsAt);
  const blockEnd = new Date(block.endsAt);
  return blockStart < dayEnd && blockEnd > dayStart;
}

export function AgendaView({ professionals, services }: AgendaViewProps) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<ViewMode>('day');
  const [refDate, setRefDate] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentDTO[] | null>(null);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTimeDTO[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  // Contador incrementado manualmente sempre que os dados precisam ser
  // recarregados (criar agendamento, criar/remover bloqueio). CORREÇÃO: a
  // versão anterior tentava forçar um novo carregamento chamando
  // `setRefDate((d) => new Date(d))` — mas como o `useEffect` de busca
  // dependia de `range.from.getTime()`/`range.to.getTime()`, e um `Date`
  // novo com o MESMO valor em milissegundos produz o mesmo `getTime()`, o
  // efeito nunca era re-executado: a tela ficava presa no skeleton de
  // carregamento (`appointments`/`blockedTimes` setados para `null` e
  // nunca preenchidos de novo). Este contador garante que o efeito sempre
  // rode quando pedimos explicitamente um recarregamento.
  const [refreshToken, setRefreshToken] = useState(0);

  const range = useMemo(() => {
    if (mode === 'day') return { from: refDate, to: addDays(refDate, 1) };
    if (mode === 'week') {
      const start = startOfWeek(refDate);
      return { from: start, to: addDays(start, 7) };
    }
    return { from: startOfMonth(refDate), to: endOfMonth(refDate) };
  }, [mode, refDate]);

  const loadAgenda = useCallback(() => {
    setAppointments(null);
    setBlockedTimes(null);
    const from = range.from.toISOString();
    const to = range.to.toISOString();
    Promise.all([
      apiFetch<{ appointments: AppointmentDTO[] }>(`/api/appointments?from=${from}&to=${to}`),
      apiFetch<{ blockedTimes: BlockedTimeDTO[] }>(`/api/blocked-times?from=${from}&to=${to}`),
    ])
      .then(([a, b]) => {
        setAppointments(a.appointments);
        setBlockedTimes(b.blockedTimes);
      })
      .catch(() => showToast('error', 'Não foi possível carregar a agenda.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from.getTime(), range.to.getTime()]);

  useEffect(() => {
    loadAgenda();
  }, [loadAgenda, refreshToken]);

  function navigate(direction: 1 | -1) {
    if (mode === 'day') setRefDate((d) => addDays(d, direction));
    else if (mode === 'week') setRefDate((d) => addDays(d, 7 * direction));
    else setRefDate((d) => new Date(d.getFullYear(), d.getMonth() + direction, 1));
  }

  function handleCreated() {
    setCreateOpen(false);
    showToast('success', 'Agendamento criado com sucesso.');
    setRefreshToken((t) => t + 1);
  }

  function handleBlocked() {
    setBlockOpen(false);
    showToast('success', 'Horário bloqueado com sucesso.');
    setRefreshToken((t) => t + 1);
  }

  async function handleDeleteBlock(id: string) {
    try {
      await apiFetch(`/api/blocked-times/${id}`, { method: 'DELETE' });
      setBlockedTimes((prev) => (prev ? prev.filter((b) => b.id !== id) : prev));
      showToast('success', 'Bloqueio removido.');
    } catch {
      showToast('error', 'Não foi possível remover o bloqueio.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Agenda</h1>
          <p className="text-sm text-ink-muted">Visualize e gerencie os horários da equipe.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBlockOpen(true)}>
            <Ban className="h-4 w-4" /> Bloquear horário
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Novo agendamento
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            aria-label="Período anterior"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-soft text-ink-muted hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[180px] text-center text-sm font-medium capitalize text-ink">
            {mode === 'month'
              ? refDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
              : formatLongDate(refDate)}
          </span>
          <button
            onClick={() => navigate(1)}
            aria-label="Próximo período"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-soft text-ink-muted hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => setRefDate(new Date())}>
            Hoje
          </Button>
        </div>

        <div className="flex rounded-xl border border-border-soft p-1">
          {(['day', 'week', 'month'] as ViewMode[]).map((option) => (
            <button
              key={option}
              onClick={() => setMode(option)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
                mode === option ? 'bg-blue-electric/15 text-blue-neon' : 'text-ink-muted hover:text-ink'
              )}
            >
              {option === 'day' ? 'Dia' : option === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {!appointments || !blockedTimes ? (
        <SkeletonRows rows={5} />
      ) : mode === 'day' ? (
        <DayView
          date={refDate}
          professionals={professionals}
          appointments={appointments}
          blockedTimes={blockedTimes}
          onDeleteBlock={handleDeleteBlock}
        />
      ) : mode === 'week' ? (
        <WeekView
          refDate={refDate}
          appointments={appointments}
          blockedTimes={blockedTimes}
          onSelectDay={(day) => {
            setRefDate(day);
            setMode('day');
          }}
        />
      ) : (
        <MonthView
          refDate={refDate}
          appointments={appointments}
          blockedTimes={blockedTimes}
          onSelectDay={(day) => {
            setRefDate(day);
            setMode('day');
          }}
        />
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo agendamento" size="lg">
        <AdminAppointmentForm
          services={services}
          professionals={professionals}
          defaultDate={refDate}
          onCreated={handleCreated}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal open={blockOpen} onClose={() => setBlockOpen(false)} title="Bloquear horário">
        <BlockTimeForm
          professionals={professionals}
          defaultDate={toISODateString(refDate)}
          onCreated={handleBlocked}
          onCancel={() => setBlockOpen(false)}
        />
      </Modal>
    </div>
  );
}

/**
 * Visão de DIA: mostra o dia inteiro (todos os agendamentos e bloqueios do
 * dia, independentemente do horário atual) — nunca recorta a partir da
 * hora corrente. Os itens já vêm ordenados cronologicamente do início ao
 * fim do expediente, então o comportamento é o mesmo de manhã ou à noite.
 */
function DayView({
  date,
  professionals,
  appointments,
  blockedTimes,
  onDeleteBlock,
}: {
  date: Date;
  professionals: ProfessionalDTO[];
  appointments: AppointmentDTO[];
  blockedTimes: BlockedTimeDTO[];
  onDeleteBlock: (id: string) => void;
}) {
  const dayAppointments = appointments.filter((a) => isSameDay(new Date(a.startsAt), date));
  // CORREÇÃO: bloqueios de múltiplos dias (ex.: férias de uma semana)
  // ficavam invisíveis em todos os dias exceto o do início, porque o
  // filtro comparava apenas `isSameDay(block.startsAt, date)`. Agora
  // qualquer bloqueio cujo intervalo TOQUE o dia aparece nele.
  const dayBlocks = blockedTimes.filter((b) => blockTouchesDay(b, date));

  if (professionals.length === 0) {
    return <EmptyState icon={CalendarDays} title="Nenhum profissional ativo" description="Cadastre profissionais para visualizar a agenda." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {professionals.map((professional) => {
        const items = dayAppointments
          .filter((a) => a.professionalId === professional.id)
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        const blocks = dayBlocks.filter(
          (b) => b.professionalId === professional.id || b.professionalId === null
        );

        return (
          <Card key={professional.id} className="p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: professional.avatarColor }}
              >
                {getInitials(professional.name)}
              </span>
              <span className="text-sm font-semibold text-ink">{professional.name}</span>
            </div>

            {items.length === 0 && blocks.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-muted">Nenhum compromisso neste dia.</p>
            ) : (
              <ul className="space-y-2">
                {[...items, ...blocks]
                  .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
                  .map((item) => {
                    const isBlock = !('serviceName' in item);
                    const isMultiDayBlock =
                      isBlock &&
                      !isSameDay(new Date((item as BlockedTimeDTO).startsAt), new Date((item as BlockedTimeDTO).endsAt));
                    return (
                      <li
                        key={item.id}
                        className={cn(
                          'rounded-lg border p-2.5 text-xs',
                          isBlock ? 'border-dashed border-border-soft bg-surface-elevated/50 text-ink-muted' : 'border-border-soft bg-surface'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-ink">
                            {isBlock && !isSameDay(new Date((item as BlockedTimeDTO).startsAt), date)
                              ? 'Dia inteiro (continuação)'
                              : `${formatTime(item.startsAt)}–${isMultiDayBlock ? 'fim do bloqueio' : formatTime(item.endsAt)}`}
                          </span>
                          {isBlock ? (
                            <button
                              onClick={() => onDeleteBlock(item.id)}
                              aria-label="Remover bloqueio"
                              className="text-ink-muted hover:text-rose-300"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <StatusBadge status={(item as AppointmentDTO).status} />
                          )}
                        </div>
                        <p className="mt-1 text-ink-muted">
                          {isBlock
                            ? `Bloqueado: ${(item as BlockedTimeDTO).title}`
                            : `${(item as AppointmentDTO).clientName} · ${(item as AppointmentDTO).serviceName}`}
                        </p>
                      </li>
                    );
                  })}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function WeekView({
  refDate,
  appointments,
  blockedTimes,
  onSelectDay,
}: {
  refDate: Date;
  appointments: AppointmentDTO[];
  blockedTimes: BlockedTimeDTO[];
  onSelectDay: (day: Date) => void;
}) {
  const start = startOfWeek(refDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {days.map((day) => {
        const dayAppointments = appointments
          .filter((a) => isSameDay(new Date(a.startsAt), day))
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        // CORREÇÃO: bloqueios de múltiplos dias agora também aparecem na
        // visão de semana (antes, esta visão nem sequer recebia os
        // bloqueios).
        const dayBlocks = blockedTimes.filter((b) => blockTouchesDay(b, day));
        const isToday = isSameDay(day, new Date());

        return (
          <button key={day.toISOString()} onClick={() => onSelectDay(day)} className="text-left">
            <Card
              className={cn(
                'h-full p-3.5 transition-colors hover:border-blue-electric/40',
                isToday && 'border-blue-electric/50'
              )}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              </p>
              <p className="font-display text-lg font-bold text-ink">{day.getDate()}</p>
              <div className="mt-2 space-y-1">
                {dayBlocks.slice(0, 1).map((b) => (
                  <p key={b.id} className="truncate text-[11px] text-amber-300">
                    Bloqueado: {b.title}
                  </p>
                ))}
                {dayAppointments.slice(0, dayBlocks.length > 0 ? 3 : 4).map((a) => (
                  <p key={a.id} className="truncate text-[11px] text-ink-muted">
                    {formatTime(a.startsAt)} · {a.clientName}
                  </p>
                ))}
                {dayAppointments.length > 4 && (
                  <p className="text-[11px] text-blue-neon">+{dayAppointments.length - 4} mais</p>
                )}
                {dayAppointments.length === 0 && dayBlocks.length === 0 && (
                  <p className="text-[11px] text-ink-muted/60">Livre</p>
                )}
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

function MonthView({
  refDate,
  appointments,
  blockedTimes,
  onSelectDay,
}: {
  refDate: Date;
  appointments: AppointmentDTO[];
  blockedTimes: BlockedTimeDTO[];
  onSelectDay: (day: Date) => void;
}) {
  const days = getMonthGridDays(refDate);
  const currentMonth = refDate.getMonth();

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-border-soft text-center text-[11px] font-medium uppercase text-ink-muted">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label) => (
          <div key={label} className="py-2.5">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const count = appointments.filter((a) => isSameDay(new Date(a.startsAt), day)).length;
          // CORREÇÃO: bloqueios de múltiplos dias agora também aparecem na
          // visão de mês (antes, esta visão nem sequer recebia os
          // bloqueios).
          const hasBlock = blockedTimes.some((b) => blockTouchesDay(b, day));
          const inMonth = day.getMonth() === currentMonth;
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={cn(
                'flex min-h-[86px] flex-col items-start gap-1.5 border-b border-r border-border-soft p-2 text-left transition-colors hover:bg-white/[0.03]',
                !inMonth && 'opacity-40'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  isToday ? 'bg-blue-electric text-white' : 'text-ink-muted'
                )}
              >
                {day.getDate()}
              </span>
              <div className="flex flex-wrap gap-1">
                {count > 0 && (
                  <span className="rounded-full bg-blue-electric/10 px-2 py-0.5 text-[10px] font-medium text-blue-neon">
                    {count} agendamento{count > 1 ? 's' : ''}
                  </span>
                )}
                {hasBlock && (
                  <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                    Bloqueado
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
