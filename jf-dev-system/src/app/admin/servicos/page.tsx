import type { Metadata } from 'next';
import { getDefaultBusinessId } from '@/services/business.service';
import { listServices } from '@/services/services.service';
import { listProfessionals } from '@/services/professionals.service';
import { ServicesManager } from '@/components/dashboard/services-manager';

export const metadata: Metadata = { title: 'Serviços' };
export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  const businessId = await getDefaultBusinessId();
  const [services, professionals] = await Promise.all([
    listServices(businessId),
    listProfessionals(businessId),
  ]);

  return <ServicesManager initialServices={services} professionals={professionals} />;
}
