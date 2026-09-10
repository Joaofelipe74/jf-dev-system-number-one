import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { onlyDigits } from '@/lib/utils';
import { notificationSender } from '@/lib/notifications';

/**
 * Substitui a busca pública insegura de histórico de cliente
 * (`phone: { contains }` / `email: { contains }`, removida nesta
 * correção) por um fluxo de duas etapas:
 *
 *   1. `requestAccessCode(contact)` — encontra o cliente por
 *      correspondência EXATA (nunca parcial) de telefone ou e-mail
 *      normalizado, gera um código numérico de 6 dígitos de uso único,
 *      guarda apenas o HASH do código (nunca o código em si) com
 *      expiração curta, e o entrega através de `NotificationSender`.
 *   2. `verifyAccessCode(contact, code)` — só devolve a identidade do
 *      cliente se o código bater exatamente e ainda estiver válido
 *      (não expirado, não usado, dentro do limite de tentativas).
 *
 * Em NENHUM momento este serviço devolve dados de outro cliente, e a
 * resposta de `requestAccessCode` é sempre genérica no chamador (a rota),
 * independentemente de o contato existir ou não — evita que alguém use o
 * formulário para descobrir quais contatos estão cadastrados.
 */

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return crypto.randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, '0');
}

function hashCode(code: string): string {
  // HMAC com o mesmo segredo de autenticação da aplicação — nunca
  // versionado, sempre vindo de variável de ambiente (AUTH_SECRET).
  const pepper = process.env.AUTH_SECRET ?? '';
  return crypto.createHmac('sha256', pepper).update(code).digest('hex');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function normalizeContact(contact: string): { phoneDigits: string | null; email: string | null } {
  const trimmed = contact.trim();
  if (trimmed.includes('@')) {
    return { phoneDigits: null, email: trimmed.toLowerCase() };
  }
  const digits = onlyDigits(trimmed);
  return { phoneDigits: digits.length >= 10 ? digits : null, email: null };
}

async function findClientByExactContact(businessId: string, contact: string) {
  const { phoneDigits, email } = normalizeContact(contact);
  if (!phoneDigits && !email) return null;

  return prisma.client.findFirst({
    where: {
      businessId,
      OR: [...(phoneDigits ? [{ phone: phoneDigits }] : []), ...(email ? [{ email }] : [])],
    },
  });
}

export async function requestAccessCode(businessId: string, contact: string): Promise<void> {
  const client = await findClientByExactContact(businessId, contact);
  if (!client) return; // resposta genérica é responsabilidade da rota — não revela existência

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

  await prisma.$transaction([
    prisma.clientAccessCode.updateMany({
      where: { clientId: client.id, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.clientAccessCode.create({
      data: { clientId: client.id, codeHash, expiresAt },
    }),
  ]);

  await notificationSender.sendAccessCode({ phone: client.phone, email: client.email }, code);
}

export class InvalidAccessCodeError extends Error {
  constructor(message = 'Código inválido ou expirado.') {
    super(message);
    this.name = 'InvalidAccessCodeError';
  }
}

export async function verifyAccessCode(
  businessId: string,
  contact: string,
  code: string
): Promise<{ id: string; name: string }> {
  const client = await findClientByExactContact(businessId, contact);
  if (!client) throw new InvalidAccessCodeError();

  const record = await prisma.clientAccessCode.findFirst({
    where: { clientId: client.id, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) throw new InvalidAccessCodeError();
  if (record.expiresAt.getTime() < Date.now()) throw new InvalidAccessCodeError();
  if (record.attempts >= MAX_ATTEMPTS) {
    throw new InvalidAccessCodeError('Muitas tentativas. Solicite um novo código.');
  }

  const providedHash = hashCode(code);
  const matches = timingSafeEqualHex(providedHash, record.codeHash);

  if (!matches) {
    await prisma.clientAccessCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new InvalidAccessCodeError();
  }

  await prisma.clientAccessCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return { id: client.id, name: client.name };
}
