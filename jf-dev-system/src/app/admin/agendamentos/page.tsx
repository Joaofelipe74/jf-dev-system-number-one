import type { Metadata } from 'next';
import { getDefaultBusinessId } from '@/services/business.service';
import { listAppointments } from '@/services/appointments.service';
import { listServices } from '@/services/services.service';
import { listProfessionals } from '@/services/professionals.service';
import { AppointmentsManager } from '@/components/dashboard/appointments-manager';

export const metadata: Metadata = { title: 'Agendamentos' };
export const dynamic = 'force-dynamic';

export default async function AdminAppointmentsPage() {
  const businessId = await getDefaultBusinessId();
  const from = new Date();
  from.setMonth(from.getMonth() - 2);
  const to = new Date();
  to.setMonth(to.getMonth() + 2);

  const [appointments, services, professionals] = await Promise.all([
    listAppointments(businessId, { from, to }),
    listServices(businessId),
    listProfessionals(businessId),
  ]);

  return (
    <AppointmentsManager
      initialAppointments={appointments}
      services={services.filter((s) => s.isActive)}
      professionals={professionals}
    />
  );
}
