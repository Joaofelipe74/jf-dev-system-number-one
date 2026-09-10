import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getDefaultBusinessId } from '@/services/business.service';
import { getDashboardSummary } from '@/services/reports.service';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const businessId = await getDefaultBusinessId();
  const summary = await getDashboardSummary(businessId);
  return NextResponse.json({ summary });
}
