import { TrendingUp, Clock, Users, Star } from 'lucide-react';
import { Reveal, SectionHeading } from '@/components/ui/reveal';

const BENEFITS = [
  { icon: Clock, value: 'Menos tempo', label: 'gasto organizando agenda manualmente' },
  { icon: Users, value: 'Mais clientes', label: 'atendidos sem conflitos de horário' },
  { icon: TrendingUp, value: 'Mais visibilidade', label: 'sobre faturamento e desempenho' },
  { icon: Star, value: 'Mais profissionalismo', label: 'na experiência de quem agenda' },
];

export function Benefits() {
  return (
    <section className="section-padding bg-bg-secondary">
      <div className="container-app">
        <SectionHeading
          eyebrow="Benefícios"
          title="O que muda na prática para o negócio"
          description="Resultados que aparecem já nas primeiras semanas de uso."
        />

        <div className="mt-14 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {BENEFITS.map((benefit, i) => (
            <Reveal key={benefit.value} delay={i * 0.07} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-electric/10 text-blue-neon">
                <benefit.icon className="h-6 w-6" aria-hidden />
              </div>
              <p className="mt-4 font-display text-lg font-bold text-ink">{benefit.value}</p>
              <p className="mt-1 text-sm text-ink-muted">{benefit.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
