import type { Metadata } from 'next';
import { getDefaultBusinessId } from '@/services/business.service';
import { getDashboardSummary } from '@/services/reports.service';
import { listAppointments } from '@/services/appointments.service';
import { ReportsView } from '@/components/dashboard/reports-view';

export const metadata: Metadata = { title: 'Relatórios' };
export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const businessId = await getDefaultBusinessId();
  const from = new Date();
  from.setMonth(from.getMonth() - 6);

  const [summary, appointments] = await Promise.all([
    getDashboardSummary(businessId),
    listAppointments(businessId, { from, to: new Date() }),
  ]);

  return <ReportsView summary={summary} appointments={appointments} />;
}
