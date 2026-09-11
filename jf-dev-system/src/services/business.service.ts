import { prisma } from '@/lib/db';

export interface DefaultBusinessIdentity {
  id: string;
  name: string;
  timezone: string;
}

// O sistema desta versão trabalha com um único negócio. Guardamos sua
// identidade durante a vida do processo para não repetir a mesma consulta em
// toda rota, clique e atualização do painel. Em caso de falha, a Promise é
// removida para permitir uma nova tentativa.
const globalForBusiness = globalThis as unknown as {
  jfDefaultBusinessPromise?: Promise<DefaultBusinessIdentity>;
};

async function loadDefaultBusinessIdentity(): Promise<DefaultBusinessIdentity> {
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, timezone: true },
  });
  if (!business) {
    throw new Error(
      'Nenhum negócio encontrado no banco. Rode "npm run db:seed" para criar os dados de demonstração.'
    );
  }
  return business;
}

export async function getDefaultBusinessIdentity(): Promise<DefaultBusinessIdentity> {
  globalForBusiness.jfDefaultBusinessPromise ??= loadDefaultBusinessIdentity();
  try {
    return await globalForBusiness.jfDefaultBusinessPromise;
  } catch (error) {
    delete globalForBusiness.jfDefaultBusinessPromise;
    throw error;
  }
}

/**
 * O sistema já nasce com o modelo de dados pronto para multi-negócio
 * (multi-tenant), mas esta primeira versão opera com um único negócio de
 * demonstração. Esta função centraliza como obter esse negócio, para que
 * a expansão futura (múltiplos negócios, um por conta) troque apenas este
 * arquivo.
 */
export async function getDefaultBusinessId(): Promise<string> {
  return (await getDefaultBusinessIdentity()).id;
}

export interface PublicBusinessInfo {
  businessName: string;
  timeZone: string;
  /** WhatsApp do PRÓPRIO estabelecimento (nunca o contato comercial da JF Dev). */
  whatsappNumber: string | null;
  bookingWindowDays: number;
}

/**
 * Informações públicas do negócio, para o site de agendamento — separa
 * explicitamente o contato do ESTABELECIMENTO (`whatsappNumber`, vindo de
 * `Setting`) do contato comercial da JF Dev (`siteConfig.contact`, usado
 * apenas no rodapé/institucional). Antes desta correção, a tela de
 * confirmação de agendamento oferecia "Falar pelo WhatsApp" usando o
 * número da JF Dev — ou seja, o cliente que acabava de agendar um horário
 * no salão era direcionado para o WhatsApp da empresa de tecnologia, não
 * do salão. Também expõe `bookingWindowDays` (antes hardcoded em 30 dias
 * no componente de seleção de data, ignorando o valor configurado em
 * Configurações).
 */
export async function getPublicBusinessInfo(businessId: string): Promise<PublicBusinessInfo> {
  const [business, settings] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    prisma.setting.findUnique({ where: { businessId } }),
  ]);

  return {
    businessName: business?.name ?? '',
    timeZone: business?.timezone ?? 'America/Sao_Paulo',
    whatsappNumber: settings?.whatsappNumber || null,
    bookingWindowDays: settings?.bookingWindowDays ?? 30,
  };
}
