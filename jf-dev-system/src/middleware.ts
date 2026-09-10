import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

/**
 * Protege todas as rotas administrativas no nível de middleware (Edge) —
 * a proteção NÃO depende apenas de esconder botões no frontend. Qualquer
 * requisição para /admin/* (exceto a própria tela de login) sem um cookie
 * de sessão válido é redirecionada para /admin/login.
 *
 * O middleware roda no Edge Runtime, por isso a verificação usa apenas
 * `jose` (Web Crypto), sem tocar no Prisma/bcrypt aqui.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET;

  if (!token || !secret) {
    return redirectToLogin(request);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
