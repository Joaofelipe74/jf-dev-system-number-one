import { NextRequest, NextResponse } from 'next/server';
import { getDefaultBusinessId } from '@/services/business.service';
import { requestAccessCode } from '@/services/client-access.service';
import { clientAccessRequestSchema, flattenZodErrors } from '@/lib/validation';
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Endpoint público (sem autenticação) usado pela Área do Cliente — PRIMEIRO
 * PASSO do fluxo seguro que substitui a antiga busca por correspondência
 * parcial de telefone/e-mail (que vazava dados de outros clientes).
 *
 * A resposta é SEMPRE genérica, exista ou não um cliente com esse contato —
 * isso evita que o formulário seja usado para descobrir quais contatos
 * estão cadastrados (enumeração de usuários).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = consumeRateLimit({ key: `client-lookup-request:${ip}`, limit: 5, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: 'Muitas tentativas. Aguarde um momento e tente novamente.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = clientAccessRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const businessId = await getDefaultBusinessId();
  await requestAccessCode(businessId, parsed.data.contact);

  return NextResponse.json({
    message: 'Se este contato estiver cadastrado, um código de acesso de uso único foi gerado.',
  });
}
