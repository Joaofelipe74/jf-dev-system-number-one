'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { SkeletonRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarX2 } from 'lucide-react';

interface Slot {
  iso: string;
  label: string;
}

interface StepTimeProps {
  serviceId: string;
  professionalId: string;
  date: string;
  selectedSlotIso: string | null;
  onSelect: (slot: Slot) => void;
}

export function StepTime({ serviceId, professionalId, date, selectedSlotIso, onSelect }: StepTimeProps) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSlots(null);
    setError(null);
    apiFetch<{ slots: Slot[] }>(
      `/api/availability?serviceId=${serviceId}&professionalId=${professionalId}&date=${date}`
    )
      .then((data) => setSlots(data.slots))
      .catch(() => setError('Não foi possível carregar os horários disponíveis.'));
  }, [serviceId, professionalId, date]);

  if (error) return <EmptyState title="Ops, algo deu errado" description={error} />;
  if (!slots) return <SkeletonRows rows={2} />;

  if (slots.length === 0) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="Sem horários disponíveis nesta data"
        description="Escolha outra data ou outro profissional para ver mais opções."
      />
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
      {slots.map((slot) => {
        const isSelected = slot.iso === selectedSlotIso;
        return (
          <button
            key={slot.iso}
            type="button"
            onClick={() => onSelect(slot)}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isSelected
                ? 'border-blue-electric bg-blue-electric text-white shadow-glow-blue-sm'
                : 'border-border-soft bg-surface text-ink hover:border-blue-electric/40 hover:bg-white/5'
            )}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}
