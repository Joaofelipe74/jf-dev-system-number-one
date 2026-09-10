import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDefaultBusinessId } from '@/services/business.service';
import { onlyDigits } from '@/lib/utils';

/**
 * Busca global real do painel administrativo.
 *
 * CORREÇÃO: o campo de busca na barra superior era puramente decorativo
 * (nenhum `onChange`, nenhuma chamada de API) — digitar nele não fazia
 * nada. Esta rota faz uma busca de verdade no banco (clientes por
 * nome/telefone, agendamentos por cliente/serviço) e o componente
 * `Topbar` exibe os resultados reais.
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ clients: [], appointments: [] });
  }

  const businessId = await getDefaultBusinessId();
  const digits = onlyDigits(q);

  const [clients, appointments] = await Promise.all([
    prisma.client.findMany({
      where: {
        businessId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
        ],
      },
      select: { id: true, name: true, phone: true },
      take: 5,
    }),
    prisma.appointment.findMany({
      where: {
        businessId,
        OR: [
          { client: { name: { contains: q, mode: 'insensitive' } } },
          { service: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        startsAt: true,
        status: true,
        client: { select: { name: true } },
        service: { select: { name: true } },
      },
      orderBy: { startsAt: 'desc' },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    clients,
    appointments: appointments.map((a) => ({
      id: a.id,
      clientName: a.client.name,
      serviceName: a.service.name,
      startsAt: a.startsAt.toISOString(),
      status: a.status,
    })),
  });
}
