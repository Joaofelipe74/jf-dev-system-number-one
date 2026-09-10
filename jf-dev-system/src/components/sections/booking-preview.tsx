import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { Button } from '@/components/ui/button';

const STEPS = [
  'Escolher o serviço desejado',
  'Selecionar o profissional',
  'Escolher a data',
  'Escolher um horário realmente disponível',
  'Informar os dados de contato',
  'Confirmar o agendamento',
];

export function BookingPreview() {
  return (
    <section className="section-padding bg-bg-secondary">
      <div className="container-app grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-neon">
            Sistema de agendamento
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Um fluxo simples para o cliente, robusto por trás
          </h2>
          <p className="mt-4 text-base text-ink-muted sm:text-lg">
            O cliente nunca vê um horário que já foi ocupado — a disponibilidade é calculada em
            tempo real, considerando expediente, profissional escolhido, agendamentos existentes e
            bloqueios manuais.
          </p>
          <Link href="/agendar">
            <Button size="lg" className="mt-7">
              Testar o agendamento
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="glass-panel glow-border p-6 sm:p-8">
            <ol className="space-y-4">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-electric/15 text-xs font-semibold text-blue-neon">
                    {i + 1}
                  </span>
                  <span className="text-sm text-ink">{step}</span>
                  {i < STEPS.length - 1 && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-ink-muted/40" aria-hidden />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
