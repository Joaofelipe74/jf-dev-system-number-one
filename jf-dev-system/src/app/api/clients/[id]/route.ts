import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { clientSchema, flattenZodErrors } from '@/lib/validation';
import { deleteClient, updateClient } from '@/services/clients.service';
import { listAppointmentsByClient } from '@/services/appointments.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  const appointments = await listAppointmentsByClient(id);
  return NextResponse.json({ appointments });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const client = await updateClient(id, parsed.data);
  return NextResponse.json({ client });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  try {
    await deleteClient(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível excluir: existem agendamentos vinculados a este cliente.' },
      { status: 409 }
    );
  }
}
