import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getDefaultBusinessId } from '@/services/business.service';
import { createClient, listClients } from '@/services/clients.service';
import { clientSchema, flattenZodErrors } from '@/lib/validation';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const businessId = await getDefaultBusinessId();
  return NextResponse.json({ clients: await listClients(businessId) });
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const businessId = await getDefaultBusinessId();
  const client = await createClient(businessId, parsed.data);
  return NextResponse.json({ client }, { status: 201 });
}
