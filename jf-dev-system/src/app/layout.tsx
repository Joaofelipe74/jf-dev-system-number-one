import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import './globals.css';
import { siteConfig } from '@/config/site';
import { ToastProvider } from '@/components/ui/toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const sora = Sora({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

// CORREÇÃO: a variável `NEXT_PUBLIC_APP_URL` está documentada no
// `.env.example`/README desde a primeira versão, mas nunca era lida em
// lugar nenhum do código — a URL base de metadados (usada para montar
// URLs absolutas de Open Graph/compartilhamento) dependia apenas de
// `siteConfig.contact.url`, um campo em branco até alguém preencher os
// dados reais da marca. Agora a variável de ambiente é a fonte primária.
const appUrl = process.env.NEXT_PUBLIC_APP_URL || siteConfig.contact.url || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: siteConfig.seo.title,
    template: `%s — ${siteConfig.brand.shortName}`,
  },
  description: siteConfig.seo.description,
  keywords: [...siteConfig.seo.keywords],
  authors: [{ name: siteConfig.brand.name }],
  creator: siteConfig.brand.name,
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: appUrl,
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    siteName: siteConfig.brand.name,
    // Nenhuma imagem de OG é declarada aqui de propósito: o projeto não
    // inventa uma imagem de marca (ver `public/images/jf-dev/README.md`).
    // Adicione `images: [...]` quando a imagem real da JF Dev existir.
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
  },
};

export const viewport: Viewport = {
  themeColor: '#06080D',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable}`}>
      <body>
        {/*
          CORREÇÃO DE ACESSIBILIDADE: `reducedMotion="user"` faz o Framer
          Motion respeitar `prefers-reduced-motion: reduce` do sistema
          operacional AUTOMATICAMENTE em toda a árvore de componentes —
          reduzindo animações de transformação/layout a mudanças instantâneas
          de opacidade. Antes desta correção, apenas a cena 3D (via o hook
          `useReducedMotion`) e algumas transições CSS respeitavam essa
          preferência; as dezenas de `motion.div` usados em modais, menus,
          seções da landing page e no fluxo de agendamento ignoravam-na
          completamente. Este wrapper único resolve todos eles de uma vez,
          sem precisar alterar cada componente individualmente.
        */}
        <MotionConfig reducedMotion="user">
          <ToastProvider>{children}</ToastProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
