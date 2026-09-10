import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/authz';
import type { ClientInput } from '@/lib/validation';
import type { ClientDTO } from '@/types';
import { onlyDigits } from '@/lib/utils';

type ClientRecord = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: Date;
  appointments: { startsAt: Date; status: string }[];
};

function toDTO(client: ClientRecord): ClientDTO {
  const relevant = client.appointments.filter((a) => a.status !== 'cancelled');
  const last = relevant
    .filter((a) => a.startsAt.getTime() <= Date.now())
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0];

  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    notes: client.notes,
    createdAt: client.createdAt.toISOString(),
    appointmentsCount: relevant.length,
    lastAppointmentAt: last ? last.startsAt.toISOString() : null,
  };
}

const includeAppointments = {
  appointments: { select: { startsAt: true, status: true } as const },
} as const;

export async function listClients(businessId: string): Promise<ClientDTO[]> {
  await requireAdminSession();
  const clients = await prisma.client.findMany({
    where: { businessId },
    include: includeAppointments,
    orderBy: { createdAt: 'desc' },
  });
  return clients.map(toDTO);
}

export async function getClientById(id: string): Promise<ClientDTO | null> {
  await requireAdminSession();
  const client = await prisma.client.findUnique({ where: { id }, include: includeAppointments });
  return client ? toDTO(client) : null;
}

/**
 * Busca um cliente pelo TELEFONE, com correspondência EXATA (após
 * normalizar para apenas dígitos) — usada internamente para reaproveitar
 * o cadastro de um cliente que já agendou antes com o mesmo telefone.
 *
 * Isto NÃO é o endpoint de "Área do cliente": para a busca pública de
 * histórico por contato do próprio cliente, veja
 * `src/services/client-access.service.ts`, que exige verificação por
 * código de uso único antes de devolver qualquer dado.
 */
export async function findClientByPhone(
  tx: Prisma.TransactionClient | typeof prisma,
  businessId: string,
  phone: string
) {
  return tx.client.findFirst({
    where: { businessId, phone: onlyDigits(phone) },
  });
}

export async function createClient(businessId: string, data: ClientInput): Promise<ClientDTO> {
  await requireAdminSession();
  const client = await prisma.client.create({
    data: {
      businessId,
      name: data.name,
      phone: onlyDigits(data.phone),
      email: data.email || null,
      notes: data.notes || null,
    },
    include: includeAppointments,
  });
  return toDTO(client);
}

export async function updateClient(id: string, data: ClientInput): Promise<ClientDTO> {
  await requireAdminSession();
  const client = await prisma.client.update({
    where: { id },
    data: {
      name: data.name,
      phone: onlyDigits(data.phone),
      email: data.email || null,
      notes: data.notes || null,
    },
    include: includeAppointments,
  });
  return toDTO(client);
}

/**
 * Exclui um cliente. Se o cliente tiver agendamentos (histórico), o banco
 * RECUSA a exclusão (a relação `Appointment.client` usa `onDelete:
 * Restrict` — ver `prisma/schema.prisma`) em vez de apagar o histórico em
 * cascata. A rota de API já trata essa recusa como um erro 409 amigável
 * ("existem agendamentos vinculados").
 */
export async function deleteClient(id: string): Promise<void> {
  await requireAdminSession();
  await prisma.client.delete({ where: { id } });
}

/**
 * Cria o cliente se ainda não existir (pelo telefone), ou retorna o
 * existente. Recebe o cliente de transação (`tx`) para que a
 * busca-ou-criação aconteça DENTRO da mesma transação que valida e grava
 * o agendamento (ver `src/services/appointments.service.ts`) — assim, uma
 * falha em qualquer etapa desfaz tudo, nunca deixando um cliente "órfão"
 * criado sem o agendamento correspondente.
 */
export async function findOrCreateClient(
  tx: Prisma.TransactionClient,
  businessId: string,
  data: { name: string; phone: string; email?: string; notes?: string }
) {
  const existing = await findClientByPhone(tx, businessId, data.phone);
  if (existing) return existing;
  return tx.client.create({
    data: {
      businessId,
      name: data.name,
      phone: onlyDigits(data.phone),
      email: data.email || null,
      notes: data.notes || null,
    },
  });
}
