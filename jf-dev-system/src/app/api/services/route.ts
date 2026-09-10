import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getDefaultBusinessId } from '@/services/business.service';
import { createService, listActiveServicesForBooking, listServices } from '@/services/services.service';
import { serviceSchema, flattenZodErrors } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const businessId = await getDefaultBusinessId();
  const publicOnly = request.nextUrl.searchParams.get('scope') === 'public';

  if (!publicOnly) {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }
    return NextResponse.json({ services: await listServices(businessId) });
  }

  return NextResponse.json({ services: await listActiveServicesForBooking(businessId) });
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const businessId = await getDefaultBusinessId();
  const service = await createService(businessId, parsed.data);
  return NextResponse.json({ service }, { status: 201 });
}
