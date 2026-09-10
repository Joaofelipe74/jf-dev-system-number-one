import type { Metadata } from 'next';
import { CalendarCheck2, Users, Wallet, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { getDefaultBusinessId } from '@/services/business.service';
import { getDashboardSummary } from '@/services/reports.service';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency } from '@/lib/utils';
import {
  RevenueChart,
  AppointmentsChart,
  TopServicesChart,
  ProfessionalsChart,
  MonthlyEvolutionChart,
} from '@/components/dashboard/charts';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const businessId = await getDefaultBusinessId();
  const summary = await getDashboardSummary(businessId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">Visão geral da operação.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Agendamentos hoje" value={String(summary.appointmentsToday)} icon={CalendarCheck2} accent="blue" />
        <StatCard label="Clientes cadastrados" value={String(summary.totalClients)} icon={Users} accent="violet" />
        <StatCard label="Receita (6 meses)" value={formatCurrency(summary.estimatedRevenueCents)} icon={Wallet} accent="emerald" />
        <StatCard label="Concluídos (6 meses)" value={String(summary.completedAppointments)} icon={CheckCircle2} accent="emerald" />
        <StatCard label="Próximos (6 meses)" value={String(summary.upcomingAppointments)} icon={Clock3} accent="blue" />
        <StatCard label="Cancelamentos (6 meses)" value={String(summary.cancelledAppointments)} icon={XCircle} accent="rose" />
      </div>
      <p className="text-xs text-ink-muted">
        &ldquo;Agendamentos hoje&rdquo; e &ldquo;Clientes cadastrados&rdquo; refletem o total atual. Os demais números
        consideram os últimos 6 meses (mesmo período usado em Relatórios).
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={summary.revenueBySeries} />
        <AppointmentsChart data={summary.appointmentsBySeries} />
        <TopServicesChart data={summary.topServices} />
        <ProfessionalsChart data={summary.byProfessional} />
        <MonthlyEvolutionChart data={summary.monthlyEvolution} />
      </div>
    </div>
  );
}
