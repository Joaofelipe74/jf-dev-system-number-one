'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-blue-main to-blue-neon text-white shadow-glow-blue-sm hover:shadow-glow-blue hover:brightness-110 active:brightness-95',
  secondary:
    'bg-surface-elevated text-ink border border-border-soft hover:border-blue-electric/40 hover:bg-surface-elevated/80',
  outline:
    'bg-transparent border border-border-soft text-ink hover:border-blue-electric/50 hover:text-blue-neon',
  ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-white/5',
  danger: 'bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-14 px-8 text-base rounded-2xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
