import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { deleteBlockedTime } from '@/services/blocked-times.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  await deleteBlockedTime(id);
  return NextResponse.json({ ok: true });
}
