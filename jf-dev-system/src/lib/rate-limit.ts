/**
 * Rate limiting para endpoints sensíveis (login administrativo, solicitação
 * e verificação de código de acesso do cliente, criação pública de
 * agendamento).
 *
 * Implementação: janela deslizante em memória do processo (sem
 * dependência nova, sem precisar de Redis). Isso é suficiente para uma
 * instância única (o cenário deste projeto — 1 servidor Next.js) e para o
 * ambiente de demonstração.
 *
 * LIMITAÇÃO HONESTA: em produção com múltiplas instâncias/réplicas (ex.:
 * várias funções serverless ou vários pods atrás de um load balancer),
 * cada instância tem seu próprio contador em memória — um atacante
 * distribuído entre instâncias contornaria o limite combinado. Para esse
 * cenário, troque este módulo por um limitador com estado compartilhado
 * (ex.: Upstash Redis, `@upstash/ratelimit`, ou uma tabela no Postgres).
 * A interface abaixo (`consumeRateLimit`) foi desenhada para ser trocada
 * sem alterar quem a chama.
 */

interface Bucket {
  count: number;
  windowStartedAt: number;
}

const buckets = new Map<string, Bucket>();

// Evita crescimento ilimitado do Map em processos de vida longa.
const MAX_TRACKED_KEYS = 20_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimitOptions {
  /** Identificador único do limite (ex.: "login", "client-lookup"). */
  key: string;
  /** Quantas tentativas permitir por janela. */
  limit: number;
  /** Duração da janela, em segundos. */
  windowSeconds: number;
}

export function consumeRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const compositeKey = options.key;

  if (buckets.size > MAX_TRACKED_KEYS) {
    // Limpeza defensiva: remove entradas já expiradas antes de crescer mais.
    for (const [k, b] of buckets) {
      if (now - b.windowStartedAt > windowMs) buckets.delete(k);
    }
  }

  const existing = buckets.get(compositeKey);

  if (!existing || now - existing.windowStartedAt > windowMs) {
    buckets.set(compositeKey, { count: 1, windowStartedAt: now });
    return { allowed: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= options.limit) {
    const retryAfterSeconds = Math.ceil((existing.windowStartedAt + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, remaining: options.limit - existing.count, retryAfterSeconds: 0 };
}

/** Extrai um identificador razoável do requisitante a partir dos cabeçalhos padrão de proxy. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || 'unknown';
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}
