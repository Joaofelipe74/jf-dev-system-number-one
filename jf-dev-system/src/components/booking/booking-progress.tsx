import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEP_LABELS = ['Serviço', 'Profissional', 'Data', 'Horário', 'Seus dados', 'Confirmação'];

export function BookingProgress({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex w-full items-center gap-1 sm:gap-2" aria-label="Etapas do agendamento">
      {STEP_LABELS.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                isDone && 'border-blue-electric bg-blue-electric text-white',
                isActive && !isDone && 'border-blue-electric text-blue-neon',
                !isActive && !isDone && 'border-border-soft text-ink-muted'
              )}
              aria-current={isActive ? 'step' : undefined}
            >
              {isDone ? <Check className="h-4 w-4" /> : stepNumber}
            </div>
            <span
              className={cn(
                'hidden text-center text-[11px] sm:block',
                isActive || isDone ? 'text-ink' : 'text-ink-muted'
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
