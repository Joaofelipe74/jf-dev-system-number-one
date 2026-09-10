import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { BookingFlow } from '@/components/booking/booking-flow';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Agendar horário',
  description: `Agende seu horário com o ${siteConfig.demoBusiness.name} em poucos passos.`,
};

export default function AgendarPage() {
  return (
    <>
      <SiteHeader />
      <main className="section-padding pt-28 sm:pt-32">
        <div className="container-app">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-neon">
              {siteConfig.demoBusiness.name}
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Agende seu horário
            </h1>
            <p className="mt-3 text-ink-muted">
              Sistema de agendamento desenvolvido pela {siteConfig.brand.name} — escolha o serviço,
              o profissional e o melhor horário para você.
            </p>
          </div>
          <BookingFlow />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
