'use client';

import { CheckCircle2 } from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';
import type { BookingProfessionalDTO } from '@/types';
import { EmptyState } from '@/components/ui/empty-state';

interface StepProfessionalProps {
  professionals: BookingProfessionalDTO[];
  selectedProfessionalId: string | null;
  onSelect: (professional: BookingProfessionalDTO) => void;
}

export function StepProfessional({ professionals, selectedProfessionalId, onSelect }: StepProfessionalProps) {
  if (professionals.length === 0) {
    return (
      <EmptyState
        title="Nenhum profissional disponível para este serviço"
        description="Escolha outro serviço ou volte em breve."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {professionals.map((professional) => {
        const isSelected = professional.id === selectedProfessionalId;
        return (
          <button
            key={professional.id}
            type="button"
            onClick={() => onSelect(professional)}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200',
              isSelected
                ? 'border-blue-electric bg-blue-electric/10 shadow-glow-blue-sm'
                : 'border-border-soft bg-surface hover:border-blue-electric/40 hover:bg-white/5'
            )}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: professional.avatarColor }}
            >
              {getInitials(professional.name)}
            </span>
            <span className="flex-1">
              <span className="block font-display text-sm font-semibold text-ink">{professional.name}</span>
              <span className="block text-xs text-ink-muted">{professional.specialty}</span>
            </span>
            {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-neon" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
