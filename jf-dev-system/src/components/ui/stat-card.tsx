import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: 'blue' | 'violet' | 'emerald' | 'rose';
}

const accentClasses = {
  blue: 'text-blue-neon bg-blue-electric/10',
  violet: 'text-violet-neon bg-violet-neon/10',
  emerald: 'text-emerald-300 bg-emerald-400/10',
  rose: 'text-rose-300 bg-rose-400/10',
};

export function StatCard({ label, value, icon: Icon, trend, accent = 'blue' }: StatCardProps) {
  return (
    <Card className="p-5 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">{label}</span>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', accentClasses[accent])}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <p className="font-display text-2xl font-bold text-ink">{value}</p>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.positive ? 'text-emerald-300' : 'text-rose-300'
            )}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </Card>
  );
}
