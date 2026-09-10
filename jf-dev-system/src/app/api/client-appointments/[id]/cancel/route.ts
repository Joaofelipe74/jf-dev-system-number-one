import { NextRequest, NextResponse } from 'next/server';
import { getClientAccessFromRequest } from '@/lib/auth';
import { cancelAppointmentAsClient, SelfServiceCancellationError } from '@/services/appointments.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Permite que o PRÓPRIO cliente cancele um agendamento futuro, sem acesso
 * ao painel administrativo — exige o token de acesso emitido depois da
 * verificação por código de uso único (`/api/client-lookup/verify`), nunca
 * uma sessão administrativa. Aplica de verdade `cancellationWindowHours`.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const access = await getClientAccessFromRequest(request);
  if (!access) {
    return NextResponse.json({ message: 'Sessão de verificação expirada. Verifique seu contato novamente.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const appointment = await cancelAppointmentAsClient(access.clientId, access.businessId, id);
    return NextResponse.json({ appointment });
  } catch (error) {
    if (error instanceof SelfServiceCancellationError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    throw error;
  }
}
