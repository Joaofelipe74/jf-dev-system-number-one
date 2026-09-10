import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma em singleton — evita esgotar conexões durante hot-reload
 * no desenvolvimento (padrão recomendado pela própria documentação do
 * Prisma para Next.js).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
