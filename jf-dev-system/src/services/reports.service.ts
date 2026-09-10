import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/authz';
import type { DashboardSummary } from '@/types';

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getDashboardSummary(businessId: string): Promise<DashboardSummary> {
  await requireAdminSession();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [appointmentsToday, totalClients, allAppointments] = await Promise.all([
    prisma.appointment.count({
      where: { businessId, startsAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.client.count({ where: { businessId } }),
    prisma.appointment.findMany({
      where: { businessId, startsAt: { gte: sixMonthsAgo } },
      select: {
        startsAt: true,
        status: true,
        priceCents: true,
        service: { select: { name: true } },
        professional: { select: { name: true } },
      },
    }),
  ]);

  const completed = allAppointments.filter((a) => a.status === 'completed');
  const cancelled = allAppointments.filter((a) => a.status === 'cancelled' || a.status === 'no_show');
  const upcoming = allAppointments.filter(
    (a) => a.startsAt.getTime() >= now.getTime() && a.status !== 'cancelled'
  );

  const estimatedRevenueCents = completed.reduce((sum, a) => sum + a.priceCents, 0);

  // Faturamento e agendamentos dos últimos 7 dias
  const revenueBySeries: { label: string; valueCents: number }[] = [];
  const appointmentsBySeries: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const dayAppointments = allAppointments.filter(
      (a) => a.startsAt >= dayStart && a.startsAt <= dayEnd
    );
    const label = day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    revenueBySeries.push({
      label,
      valueCents: dayAppointments
        .filter((a) => a.status === 'completed')
        .reduce((sum, a) => sum + a.priceCents, 0),
    });
    appointmentsBySeries.push({ label, value: dayAppointments.length });
  }

  // Serviços mais utilizados
  const serviceCounts = new Map<string, number>();
  for (const a of allAppointments) {
    serviceCounts.set(a.service.name, (serviceCounts.get(a.service.name) ?? 0) + 1);
  }
  const topServices = [...serviceCounts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Distribuição por profissional
  const professionalCounts = new Map<string, number>();
  for (const a of allAppointments) {
    professionalCounts.set(a.professional.name, (professionalCounts.get(a.professional.name) ?? 0) + 1);
  }
  const byProfessional = [...professionalCounts.entries()].map(([name, value]) => ({ name, value }));

  // Evolução mensal (últimos 6 meses)
  const monthlyEvolution: { label: string; revenueCents: number; appointments: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const refDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthAppointments = allAppointments.filter(
      (a) => a.startsAt.getFullYear() === refDate.getFullYear() && a.startsAt.getMonth() === refDate.getMonth()
    );
    monthlyEvolution.push({
      label: MONTH_LABELS[refDate.getMonth()] ?? '',
      revenueCents: monthAppointments
        .filter((a) => a.status === 'completed')
        .reduce((sum, a) => sum + a.priceCents, 0),
      appointments: monthAppointments.length,
    });
  }

  return {
    appointmentsToday,
    totalClients,
    estimatedRevenueCents,
    completedAppointments: completed.length,
    upcomingAppointments: upcoming.length,
    cancelledAppointments: cancelled.length,
    revenueBySeries,
    appointmentsBySeries,
    topServices,
    byProfessional,
    monthlyEvolution,
  };
}
