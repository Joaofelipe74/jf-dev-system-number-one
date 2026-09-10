import type { Metadata } from 'next';
import { getDefaultBusinessId } from '@/services/business.service';
import { getBusinessHours, getSettings } from '@/services/settings.service';
import { SettingsView } from '@/components/dashboard/settings-view';

export const metadata: Metadata = { title: 'Configurações' };
export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const businessId = await getDefaultBusinessId();
  const [businessHours, settings] = await Promise.all([
    getBusinessHours(businessId),
    getSettings(businessId),
  ]);

  return (
    <SettingsView
      initialBusinessHours={businessHours}
      initialSettings={{
        slotIntervalMinutes: settings?.slotIntervalMinutes ?? 30,
        bookingWindowDays: settings?.bookingWindowDays ?? 30,
        cancellationWindowHours: settings?.cancellationWindowHours ?? 2,
        whatsappNumber: settings?.whatsappNumber ?? '',
      }}
    />
  );
}
