'use client';

import { useEffect, useState } from 'react';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { apiFetch, ApiRequestError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toISODateString } from '@/utils/dates';
import { CalendarX2 } from 'lucide-react';
import type { AppointmentDTO } from '@/types';

interface Slot {
  iso: string;
  label: string;
}

interface RescheduleFormProps {
  appointment: AppointmentDTO;
  onRescheduled: () => void;
  onCancel: () => void;
}

/**
 * Interface real de reagendamento — antes desta correção não existia
 * nenhuma tela para reagendar um agendamento pelo painel (apenas cancelar
 * e recriar manualmente). Reaproveita a mesma rota pública de
 * disponibilidade (`/api/availability`), então nunca oferece um horário
 * que a validação central do servidor recusaria.
 */
export function RescheduleForm({ appointment, onRescheduled, onCancel }: RescheduleFormProps) {
  const [date, setDate] = useState(toISODateString(new Date(appointment.startsAt)));
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotIso, setSlotIso] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSlots(null);
    setSlotIso('');
    apiFetch<{ slots: Slot[] }>(
      `/api/availability?serviceId=${appointment.serviceId}&professionalId=${appointment.professionalId}&date=${date}`
    )
      .then((data) => setSlots(data.slots))
      .catch(() => setSlots([]));
  }, [date, appointment.serviceId, appointment.professionalId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!slotIso) {
      setError('Selecione um novo horário.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ startsAt: slotIso }),
      });
      onRescheduled();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Não foi possível reagendar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="rounded-lg border border-border-soft bg-surface-elevated/40 p-3 text-sm">
        <p className="text-ink">
          {appointment.clientName} · {appointment.serviceName}
        </p>
        <p className="text-xs text-ink-muted">Profissional: {appointment.professionalName}</p>
      </div>

      <div>
        <Label htmlFor="reschedule-date">Nova data</Label>
        <Input id="reschedule-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div>
        <Label>Novo horário</Label>
        {slots === null ? (
          <p className="text-xs text-ink-muted">Carregando horários...</p>
        ) : slots.length === 0 ? (
          <EmptyState icon={CalendarX2} title="Sem horários disponíveis nesta data" />
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <button
                type="button"
                key={slot.iso}
                onClick={() => setSlotIso(slot.iso)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  slotIso === slot.iso
                    ? 'border-blue-electric bg-blue-electric text-white'
                    : 'border-border-soft bg-surface text-ink hover:border-blue-electric/40'
                )}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-2.5 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" isLoading={isSubmitting}>
          Confirmar novo horário
        </Button>
      </div>
    </form>
  );
}
