/**
 * Configuração central da marca JF Dev.
 *
 * Todas as informações de contato/rede social do estúdio ficam centralizadas
 * aqui — nenhuma outra parte do código deve conter telefone, WhatsApp,
 * e-mail, Instagram ou links "chumbados". Preencha os placeholders abaixo
 * com os dados reais antes de publicar o projeto.
 *
 * Nada aqui é sensível (são dados de contato públicos), então este arquivo
 * pode ser versionado normalmente.
 */

export const siteConfig = {
  /** Nome da marca responsável pelo desenvolvimento do sistema. */
  brand: {
    name: 'JF Dev',
    shortName: 'JF DEV',
    tagline: 'Sistemas que transformam negócios.',
    description:
      'Desenvolvemos soluções digitais modernas para gestão, automação e crescimento de empresas.',
  },

  /**
   * Empresa fictícia usada apenas para demonstrar o funcionamento do
   * sistema nesta primeira versão. Pode futuramente ser adaptada para
   * barbearias, salões, clínicas, estética, tatuadores, autônomos,
   * oficinas, consultórios e demais prestadores de serviço.
   */
  demoBusiness: {
    name: 'Studio Nova Era',
    segment: 'Estética & Bem-estar',
    description:
      'Empresa fictícia criada para demonstrar, na prática, o funcionamento completo do sistema.',
  },

  /** Preencha com os dados reais da JF Dev antes de publicar. */
  contact: {
    whatsapp: '', // Ex.: "5511999999999" (somente números, com DDI e DDD)
    email: '', // Ex.: "contato@jfdev.com.br"
    instagram: '', // Ex.: "https://instagram.com/jfdev"
    linkedin: '', // Ex.: "https://linkedin.com/company/jfdev"
    github: '', // Ex.: "https://github.com/jfdev"
    url: '', // Ex.: "https://jfdev.com.br"
  },

  seo: {
    title: 'JF Dev — Sistema Inteligente de Gestão e Agendamento',
    description:
      'Uma solução completa de gestão e agendamento, desenvolvida pela JF Dev: agenda inteligente, painel administrativo, gestão de clientes e profissionais em uma experiência digital sofisticada.',
    keywords: [
      'JF Dev',
      'sistema de agendamento',
      'gestão de negócios',
      'software para barbearia',
      'software para salão',
      'software para clínica',
      'agenda online',
      'painel administrativo',
    ],
  },
} as const;

/** Monta o link "wa.me" a partir do número configurado, se houver. */
export function getWhatsAppLink(message?: string): string | null {
  const number = siteConfig.contact.whatsapp;
  if (!number) return null;
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
