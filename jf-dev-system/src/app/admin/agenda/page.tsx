import type { Metadata } from 'next';
import { getDefaultBusinessId } from '@/services/business.service';
import { listProfessionals } from '@/services/professionals.service';
import { listServices } from '@/services/services.service';
import { AgendaView } from '@/components/dashboard/agenda-view';

export const metadata: Metadata = { title: 'Agenda' };
export const dynamic = 'force-dynamic';

export default async function AdminAgendaPage() {
  const businessId = await getDefaultBusinessId();
  const [professionals, services] = await Promise.all([
    listProfessionals(businessId),
    listServices(businessId),
  ]);

  return (
    <AgendaView
      professionals={professionals.filter((p) => p.isActive)}
      services={services.filter((s) => s.isActive)}
    />
  );
}
