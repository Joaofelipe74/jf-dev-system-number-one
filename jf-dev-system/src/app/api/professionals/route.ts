import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getDefaultBusinessId } from '@/services/business.service';
import {
  createProfessional,
  listActiveProfessionalsForService,
  listProfessionals,
} from '@/services/professionals.service';
import { professionalSchema, flattenZodErrors } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const businessId = await getDefaultBusinessId();
  const serviceId = request.nextUrl.searchParams.get('serviceId');
  const publicOnly = request.nextUrl.searchParams.get('scope') === 'public';

  if (publicOnly && serviceId) {
    const professionals = await listActiveProfessionalsForService(businessId, serviceId);
    return NextResponse.json({
      // A rota pública não expõe telefone nem e-mail dos profissionais.
      professionals: professionals.map(({ id, name, specialty, avatarColor, serviceIds }) => ({
        id,
        name,
        specialty,
        avatarColor,
        serviceIds,
      })),
    });
  }

  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  return NextResponse.json({ professionals: await listProfessionals(businessId) });
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = professionalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Dados inválidos.', fieldErrors: flattenZodErrors(parsed.error) },
      { status: 400 }
    );
  }

  const businessId = await getDefaultBusinessId();
  const professional = await createProfessional(businessId, parsed.data);
  return NextResponse.json({ professional }, { status: 201 });
}
