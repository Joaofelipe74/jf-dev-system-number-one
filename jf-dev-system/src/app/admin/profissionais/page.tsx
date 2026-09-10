import type { Metadata } from 'next';
import { getDefaultBusinessId } from '@/services/business.service';
import { listProfessionals } from '@/services/professionals.service';
import { listServices } from '@/services/services.service';
import { ProfessionalsManager } from '@/components/dashboard/professionals-manager';

export const metadata: Metadata = { title: 'Profissionais' };
export const dynamic = 'force-dynamic';

export default async function AdminProfessionalsPage() {
  const businessId = await getDefaultBusinessId();
  const [professionals, services] = await Promise.all([
    listProfessionals(businessId),
    listServices(businessId),
  ]);

  return <ProfessionalsManager initialProfessionals={professionals} services={services} />;
}
