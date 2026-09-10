import { getCurrentSession, type SessionPayload } from '@/lib/auth';

/**
 * Autorização de defesa em profundidade.
 *
 * Antes desta correção, TODA a verificação de sessão administrativa vivia
 * apenas nos route handlers (`src/app/api/**\/route.ts`). Isso funciona
 * enquanto todo handler lembrar de chamar `getCurrentSession()`, mas é
 * frágil: basta UM handler novo esquecer a checagem (ou uma rota futura
 * chamar a função de serviço diretamente, fora de uma rota HTTP — por
 * exemplo, em uma Server Action ou em um script) para abrir uma falha de
 * autorização silenciosa.
 *
 * `requireAdminSession()` é chamada DENTRO da camada de serviço
 * (`src/services/*.service.ts`) para todas as operações administrativas —
 * ou seja, mesmo que uma rota esqueça de checar a sessão, o serviço que
 * fala com o banco recusa a operação. As rotas continuam checando a sessão
 * também (para devolver 401 cedo, sem tocar no banco), então a checagem
 * acontece nos DOIS níveis.
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Não autenticado.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}
