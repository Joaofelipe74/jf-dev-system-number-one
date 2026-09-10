'use client';

import { toISODateString, addDays } from '@/utils/dates';
import { cn } from '@/lib/utils';

interface StepDateProps {
  selectedDate: string | null;
  onSelect: (isoDate: string) => void;
  /**
   * Janela de agendamento configurada pelo negócio (`Setting.bookingWindowDays`,
   * vinda de `/api/public/business-info`). CORREÇÃO: este valor era antes
   * fixo em 30 dias no componente, ignorando o que o administrador
   * configurasse em Configurações — o valor configurado nunca tinha
   * efeito real na tela pública. `undefined` (ainda carregando) usa 30
   * como fallback temporário só para não deixar a tela vazia.
   */
  windowDays?: number;
}

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function StepDate({ selectedDate, onSelect, windowDays }: StepDateProps) {
  const effectiveWindowDays = windowDays ?? 30;
  const today = new Date();
  const days = Array.from({ length: effectiveWindowDays }, (_, i) => addDays(today, i));

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
      {days.map((day) => {
        const iso = toISODateString(day);
        const isSelected = iso === selectedDate;
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelect(iso)}
            className={cn(
              'flex flex-col items-center rounded-xl border px-2 py-3 transition-all duration-200',
              isSelected
                ? 'border-blue-electric bg-blue-electric/10 shadow-glow-blue-sm'
                : 'border-border-soft bg-surface hover:border-blue-electric/40 hover:bg-white/5'
            )}
          >
            <span className="text-[11px] uppercase tracking-wide text-ink-muted">
              {WEEKDAY_SHORT[day.getDay()]}
            </span>
            <span className="mt-1 font-display text-lg font-bold text-ink">{day.getDate()}</span>
            <span className="text-[10px] text-ink-muted">
              {day.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
