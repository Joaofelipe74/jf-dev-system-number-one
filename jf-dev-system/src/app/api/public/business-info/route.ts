import { NextResponse } from 'next/server';
import { getDefaultBusinessId, getPublicBusinessInfo } from '@/services/business.service';

/**
 * Endpoint público (sem autenticação) com as poucas informações do
 * estabelecimento necessárias no fluxo público de agendamento: nome do
 * negócio, WhatsApp DO ESTABELECIMENTO (não da JF Dev) e a janela de
 * agendamento configurada (`bookingWindowDays`) — nada sensível.
 */
export async function GET() {
  const businessId = await getDefaultBusinessId();
  const info = await getPublicBusinessInfo(businessId);
  return NextResponse.json(info);
}
