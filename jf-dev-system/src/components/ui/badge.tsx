import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { STATUS_BADGE_STYLES, STATUS_LABELS } from '@/lib/constants';
import type { AppointmentStatus } from '@/types';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge className={STATUS_BADGE_STYLES[status]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
