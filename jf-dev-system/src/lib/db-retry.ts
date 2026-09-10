import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * Executa `fn` dentro de uma transação Postgres SERIALIZABLE, com retry
 * automático quando o próprio banco detecta um conflito de escrita
 * concorrente (SQLSTATE 40001 — Prisma expõe isso como o código conhecido
 * `P2034`).
 *
 * Por que isso importa: uma checagem "SELECT para ver se já existe
 * conflito, depois INSERT" dentro de uma transação comum (READ COMMITTED,
 * o padrão do Postgres) NÃO impede duas transações concorrentes de
 * passarem pelo SELECT ao mesmo tempo, cada uma vendo "nenhum conflito", e
 * as duas inserirem — resultando em dois agendamentos sobrepostos. Isso é
 * exatamente o que a auditoria aponta: "uma consulta antes do INSERT,
 * sozinha, não basta".
 *
 * Com isolamento SERIALIZABLE, o Postgres detecta esse tipo de conflito e
 * força uma das duas transações a abortar com erro 40001 — cabe à
 * aplicação repetir a transação (o que geralmente resolve, pois na
 * segunda tentativa a transação vencedora já terá sido commitada e o
 * conflito será detectado normalmente pela checagem de sobreposição).
 *
 * Como barreira FINAL, independente de qualquer lógica de aplicação, o
 * banco também tem uma constraint de exclusão (`EXCLUDE USING gist`, via
 * `btree_gist`) na tabela `appointments` — ver
 * `prisma/migrations/20260101000200_add_appointment_exclusion_constraint/migration.sql`.
 * Uma violação dessa constraint (SQLSTATE 23P01) NÃO é retentável (o
 * conflito é real, não um artefato de concorrência) e é traduzida para
 * `AppointmentConflictError` por quem chama este helper.
 */
export async function runSerializable<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      });
    } catch (error) {
      lastError = error;
      if (isSerializationFailure(error) && attempt < attempts) {
        // Pequeno backoff antes de tentar de novo, para reduzir a chance
        // de colidir de novo com a mesma transação concorrente.
        await new Promise((resolve) => setTimeout(resolve, 25 * attempt));
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

/** Detecta o erro de conflito de serialização do Postgres (SQLSTATE 40001 / Prisma P2034). */
export function isSerializationFailure(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2034';
  }
  return false;
}

/** Detecta a violação da constraint de exclusão do Postgres (SQLSTATE 23P01). */
export function isExclusionConstraintViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('23P01') || message.toLowerCase().includes('exclusion constraint');
}
