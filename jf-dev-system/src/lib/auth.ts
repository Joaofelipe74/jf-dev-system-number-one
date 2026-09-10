import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

/**
 * Autenticação administrativa real:
 * - Senhas nunca são armazenadas em texto puro — apenas o hash bcrypt.
 * - A sessão é um JWT assinado (HS256) guardado em cookie httpOnly,
 *   verificado no middleware e nas rotas protegidas.
 * - O segredo de assinatura vem exclusivamente de variável de ambiente
 *   (AUTH_SECRET) — nunca fica hardcoded no código.
 */

export interface SessionPayload {
  sub: string; // id do profile
  email: string;
  name: string;
  role: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'AUTH_SECRET não configurado. Defina uma string aleatória forte em .env (ex.: openssl rand -base64 32).'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 12);
}

export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

function getSessionDurationSeconds(): number {
  const raw = process.env.AUTH_SESSION_DURATION;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8 * 60 * 60;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const durationSeconds = getSessionDurationSeconds();
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + durationSeconds)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || typeof payload.email !== 'string') return null;
    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === 'string' ? payload.name : '',
      role: typeof payload.role === 'string' ? payload.role : 'admin',
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getSessionDurationSeconds(),
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(AUTH_COOKIE_NAME);
}

/** Lê e valida a sessão atual a partir do cookie (uso em server components/rotas). */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Token de acesso do CLIENTE (não confundir com a sessão administrativa
 * acima). Emitido pela Área do Cliente somente depois que o contato foi
 * verificado por código de uso único (ver
 * `src/services/client-access.service.ts`). É um JWT de vida curta,
 * devolvido no corpo da resposta (não em cookie) e enviado pelo frontend
 * via cabeçalho `Authorization: Bearer` nas chamadas seguintes (ex.:
 * cancelar o próprio agendamento). O campo `scope` evita que este token
 * seja confundido com uma sessão administrativa mesmo que assinado com o
 * mesmo segredo.
 */
export interface ClientAccessTokenPayload {
  scope: 'client-access';
  clientId: string;
  businessId: string;
}

const CLIENT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export async function createClientAccessToken(clientId: string, businessId: string): Promise<string> {
  return new SignJWT({ scope: 'client-access', clientId, businessId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + CLIENT_ACCESS_TOKEN_TTL_SECONDS)
    .sign(getSecretKey());
}

export async function verifyClientAccessToken(token: string): Promise<ClientAccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.scope !== 'client-access' || typeof payload.clientId !== 'string' || typeof payload.businessId !== 'string') {
      return null;
    }
    return { scope: 'client-access', clientId: payload.clientId, businessId: payload.businessId };
  } catch {
    return null;
  }
}

/** Lê e valida o token de acesso do cliente a partir do cabeçalho `Authorization: Bearer <token>`. */
export async function getClientAccessFromRequest(request: Request): Promise<ClientAccessTokenPayload | null> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return verifyClientAccessToken(header.slice('Bearer '.length));
}
