import {
  CalendarClock,
  Users2,
  Scissors,
  LayoutDashboard,
  Ban,
  History,
  LineChart,
  Smartphone,
} from 'lucide-react';
import { Reveal, SectionHeading } from '@/components/ui/reveal';
import { Card } from '@/components/ui/card';

const FEATURES = [
  { icon: CalendarClock, title: 'Agendamento inteligente', description: 'Fluxo guiado: serviço, profissional, data, horário e confirmação.' },
  { icon: LayoutDashboard, title: 'Painel administrativo', description: 'Visão completa da operação, com dashboard, agenda e relatórios.' },
  { icon: Users2, title: 'Gestão de clientes', description: 'Cadastro, histórico de atendimentos e observações por cliente.' },
  { icon: Scissors, title: 'Gestão de serviços', description: 'Preço, duração, status e quais profissionais realizam cada serviço.' },
  { icon: Ban, title: 'Bloqueio de horários', description: 'Folgas, feriados e compromissos sem risco de conflito na agenda.' },
  { icon: History, title: 'Histórico completo', description: 'Cada atendimento fica registrado, com status e linha do tempo.' },
  { icon: LineChart, title: 'Métricas e relatórios', description: 'Faturamento, atendimentos e desempenho por profissional.' },
  { icon: Smartphone, title: '100% responsivo', description: 'Experiência completa em qualquer tela, do celular ao ultrawide.' },
];

export function Features() {
  return (
    <section id="recursos" className="section-padding">
      <div className="container-app">
        <SectionHeading
          eyebrow="Recursos"
          title="Tudo que a operação precisa, em um só sistema"
          description="Funcionalidades reais, não apenas telas de exemplo — cada recurso abaixo funciona de ponta a ponta."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 4) * 0.06}>
              <Card className="h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-electric/30 hover:shadow-card-hover">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-electric/10 text-blue-neon">
                  <feature.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-sm font-semibold text-ink">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{feature.description}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
