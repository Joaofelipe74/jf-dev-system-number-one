import { NextRequest, NextResponse } from 'next/server';
import { getDefaultBusinessId } from '@/services/business.service';
import { verifyAccessCode, InvalidAccessCodeError } from '@/services/client-access.service';
import { listAppointmentsByClient } from '@/services/appointments.service';
import { createClientAccessToken } from '@/lib/auth';
import { clientAccessVerifySchema, flattenZodErrors } from '@/lib/validation';
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * SEGUNDO PASSO do fluxo seguro de Área do Cliente: verifica o código de
 * uso único enviado ao contato exato informado. Só depois de o código
 * bater é que os agendamentos do cliente são devolvidos — nunca antes, e
 * nunca por correspondência parcial de telefone/e-mail.
 *
 * Também devolve um token de acesso de vida curta (15 min), usado pelo
 * frontend para permitir que o próprio cliente cancele um agendamento
 * futuro (respeitando `cancellationWindowHours`) sem precisar reenviar o
 * código a cada ação.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = consumeRateLimit({ key: `client-lookup-verify:${ip}`, limit: 10, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: 'Muitas tentativas. Aguarde um momento e tente novamente.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = clientAccessVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const businessId = await getDefaultBusinessId();

  try {
    const client = await verifyAccessCode(businessId, parsed.data.contact, parsed.data.code);
    const appointments = await listAppointmentsByClient(client.id);
    const accessToken = await createClientAccessToken(client.id, businessId);

    return NextResponse.json({ clientName: client.name, appointments, accessToken });
  } catch (error) {
    if (error instanceof InvalidAccessCodeError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    throw error;
  }
}
