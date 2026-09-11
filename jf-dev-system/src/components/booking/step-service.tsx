'use client';

import { Clock, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/utils';
import type { BookingServiceDTO } from '@/types';
import { SkeletonRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface StepServiceProps {
  services: BookingServiceDTO[] | null;
  error: string | null;
  selectedServiceId: string | null;
  onSelect: (service: BookingServiceDTO) => void;
}

export function StepService({ services, error, selectedServiceId, onSelect }: StepServiceProps) {
  if (error) {
    return <EmptyState title="Ops, algo deu errado" description={error} />;
  }

  if (!services) return <SkeletonRows rows={4} />;

  if (services.length === 0) {
    return (
      <EmptyState
        title="Nenhum serviço disponível no momento"
        description="Volte em breve — novos serviços podem ser adicionados a qualquer momento."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((service) => {
        const isSelected = service.id === selectedServiceId;
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all duration-200',
              isSelected
                ? 'border-blue-electric bg-blue-electric/10 shadow-glow-blue-sm'
                : 'border-border-soft bg-surface hover:border-blue-electric/40 hover:bg-white/5'
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="font-display text-sm font-semibold text-ink">{service.name}</span>
              {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-neon" aria-hidden />}
            </div>
            {service.description && (
              <p className="text-xs text-ink-muted">{service.description}</p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatDuration(service.durationMinutes)}
              </span>
              <span className="font-semibold text-blue-neon">{formatCurrency(service.priceCents)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
