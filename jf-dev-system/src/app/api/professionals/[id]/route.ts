import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { professionalSchema, flattenZodErrors } from '@/lib/validation';
import {
  deleteProfessional,
  toggleProfessionalActive,
  updateProfessional,
} from '@/services/professionals.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (body && typeof body.isActive === 'boolean' && Object.keys(body).length === 1) {
    const professional = await toggleProfessionalActive(id, body.isActive);
    return NextResponse.json({ professional });
  }

  const parsed = professionalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const professional = await updateProfessional(id, parsed.data);
  return NextResponse.json({ professional });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;

  try {
    await deleteProfessional(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível excluir: existem agendamentos vinculados a este profissional.' },
      { status: 409 }
    );
  }
}
