import type { AppointmentStatus } from '@/types';

export const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const;

export const WEEKDAY_SHORT_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

export const STATUS_BADGE_STYLES: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  confirmed: 'bg-blue-electric/10 text-blue-neon border-blue-electric/30',
  completed: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
  cancelled: 'bg-rose-400/10 text-rose-300 border-rose-400/30',
  no_show: 'bg-slate-400/10 text-slate-300 border-slate-400/30',
};

export const AUTH_COOKIE_NAME = 'jfdev_session';

export const DEMO_ADMIN_EMAIL = 'admin@studionovaera.com.br';
