import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { updateAppointmentStatusSchema, flattenZodErrors } from '@/lib/validation';
import {
  AppointmentConflictError,
  deleteAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
} from '@/services/appointments.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Reagenda (`startsAt`) OU muda o status de um agendamento — em ambos os
 * casos, a validação completa de disponibilidade roda de novo no servidor
 * (`src/services/appointments.service.ts`), inclusive para REATIVAR um
 * agendamento cancelado de volta para pendente/confirmado. A duração
 * usada no reagendamento é sempre re-derivada do serviço no banco, nunca
 * de um valor enviado pelo cliente.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (body && typeof body.startsAt === 'string') {
    const startsAt = new Date(body.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ message: 'Horário inválido.' }, { status: 400 });
    }
    try {
      const appointment = await rescheduleAppointment(id, startsAt);
      return NextResponse.json({ appointment });
    } catch (error) {
      if (error instanceof AppointmentConflictError) {
        return NextResponse.json({ message: error.message }, { status: 409 });
      }
      throw error;
    }
  }

  const parsed = updateAppointmentStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const appointment = await updateAppointmentStatus(id, parsed.data.status);
    return NextResponse.json({ appointment });
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  await deleteAppointment(id);
  return NextResponse.json({ ok: true });
}
