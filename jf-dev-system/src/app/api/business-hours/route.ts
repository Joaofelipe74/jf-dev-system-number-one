import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getDefaultBusinessId } from '@/services/business.service';
import { getBusinessHours, upsertBusinessHour } from '@/services/settings.service';
import { businessHourSchema, flattenZodErrors } from '@/lib/validation';

export async function GET() {
  const businessId = await getDefaultBusinessId();
  return NextResponse.json({ businessHours: await getBusinessHours(businessId) });
}

export async function PUT(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = businessHourSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const businessId = await getDefaultBusinessId();
  const businessHour = await upsertBusinessHour(businessId, parsed.data);
  return NextResponse.json({ businessHour });
}
