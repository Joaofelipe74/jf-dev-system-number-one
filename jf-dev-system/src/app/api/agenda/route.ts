import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getDefaultBusinessId } from '@/services/business.service';
import { listAppointments } from '@/services/appointments.service';
import { listBlockedTimes } from '@/services/blocked-times.service';

/** Carrega agendamentos e bloqueios da agenda em uma única função HTTP. */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const fromParam = request.nextUrl.searchParams.get('from');
  const toParam = request.nextUrl.searchParams.get('to');
  if (!fromParam || !toParam) {
    return NextResponse.json({ message: 'Informe o período da agenda.' }, { status: 400 });
  }

  const from = new Date(fromParam);
  const to = new Date(toParam);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ message: 'Período inválido.' }, { status: 400 });
  }

  const businessId = await getDefaultBusinessId();
  const [appointments, blockedTimes] = await Promise.all([
    listAppointments(businessId, { from, to }),
    listBlockedTimes(businessId, { from, to }),
  ]);

  return NextResponse.json(
    { appointments, blockedTimes },
    { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
  );
}
