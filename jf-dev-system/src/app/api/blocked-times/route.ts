import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getDefaultBusinessId } from '@/services/business.service';
import { createBlockedTime, listBlockedTimes } from '@/services/blocked-times.service';
import { blockedTimeSchema, flattenZodErrors } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const businessId = await getDefaultBusinessId();
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');

  const blockedTimes = await listBlockedTimes(
    businessId,
    from && to ? { from: new Date(from), to: new Date(to) } : undefined
  );
  return NextResponse.json({ blockedTimes });
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = blockedTimeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const businessId = await getDefaultBusinessId();
  const blockedTime = await createBlockedTime(businessId, {
    professionalId: parsed.data.professionalId,
    title: parsed.data.title,
    startsAt: new Date(parsed.data.startsAt),
    endsAt: new Date(parsed.data.endsAt),
  });
  return NextResponse.json({ blockedTime }, { status: 201 });
}
