import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getDefaultBusinessId } from '@/services/business.service';
import { getSettings, updateSettings } from '@/services/settings.service';
import { settingsSchema, flattenZodErrors } from '@/lib/validation';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const businessId = await getDefaultBusinessId();
  return NextResponse.json({ settings: await getSettings(businessId) });
}

export async function PUT(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const businessId = await getDefaultBusinessId();
  const settings = await updateSettings(businessId, parsed.data);
  return NextResponse.json({ settings });
}
