import type { Metadata } from 'next';
import { getDefaultBusinessId } from '@/services/business.service';
import { listClients } from '@/services/clients.service';
import { ClientsManager } from '@/components/dashboard/clients-manager';

export const metadata: Metadata = { title: 'Clientes' };
export const dynamic = 'force-dynamic';

export default async function AdminClientsPage() {
  const businessId = await getDefaultBusinessId();
  const clients = await listClients(businessId);
  return <ClientsManager initialClients={clients} />;
}
