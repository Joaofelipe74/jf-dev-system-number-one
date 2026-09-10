import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { loginSchema, flattenZodErrors } from '@/lib/validation';
import { createSessionToken, setSessionCookie, verifyPassword } from '@/lib/auth';
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const body = await request.json().catch(() => null);
  const emailForLimit = typeof body?.email === 'string' ? body.email.toLowerCase() : 'unknown';

  // Limita por IP E por e-mail tentado — evita tanto um único IP
  // martelando várias contas quanto uma conta sendo atacada por vários IPs
  // (dentro do que um limitador em memória de instância única consegue).
  const ipLimit = consumeRateLimit({ key: `login-ip:${ip}`, limit: 10, windowSeconds: 60 });
  const emailLimit = consumeRateLimit({ key: `login-email:${emailForLimit}`, limit: 5, windowSeconds: 60 });
  if (!ipLimit.allowed || !emailLimit.allowed) {
    const retryAfterSeconds = Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds);
    return NextResponse.json(
      { message: 'Muitas tentativas de login. Aguarde um momento e tente novamente.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const profile = await prisma.profile.findUnique({ where: { email: email.toLowerCase() } });

  // Mensagem genérica proposital — nunca revelamos se o e-mail existe ou não.
  const invalidCredentials = NextResponse.json(
    { message: 'E-mail ou senha incorretos.' },
    { status: 401 }
  );

  if (!profile) return invalidCredentials;

  const isValid = await verifyPassword(password, profile.passwordHash);
  if (!isValid) return invalidCredentials;

  const token = await createSessionToken({
    sub: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role },
  });
}
