import { forwardRef } from 'react';
import type { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-xl border bg-surface-elevated px-4 text-sm text-ink placeholder:text-ink-muted/60 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-electric/40',
          error ? 'border-rose-500/60' : 'border-border-soft focus:border-blue-electric/50',
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-rose-300">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <textarea
        ref={ref}
        className={cn(
          'min-h-[100px] w-full rounded-xl border bg-surface-elevated px-4 py-3 text-sm text-ink placeholder:text-ink-muted/60 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-electric/40',
          error ? 'border-rose-500/60' : 'border-border-soft focus:border-blue-electric/50',
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-rose-300">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1.5 block text-sm font-medium text-ink-muted', className)}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="w-full">
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'h-11 w-full appearance-none rounded-xl border bg-surface-elevated px-4 pr-9 text-sm text-ink transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-electric/40',
            error ? 'border-rose-500/60' : 'border-border-soft focus:border-blue-electric/50',
            className
          )}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-300">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';
