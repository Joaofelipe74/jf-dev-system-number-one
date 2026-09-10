import { Boxes, Workflow, ShieldCheck } from 'lucide-react';
import { Reveal, SectionHeading } from '@/components/ui/reveal';
import { Card } from '@/components/ui/card';

const PILLARS = [
  {
    icon: Workflow,
    title: 'Um sistema, todo o fluxo',
    description:
      'Da primeira visita ao site até a conclusão do atendimento: agendamento, confirmação, histórico e métricas em um único lugar.',
  },
  {
    icon: Boxes,
    title: 'Pensado para o seu negócio',
    description:
      'A estrutura foi desenhada para se adaptar a diferentes tipos de operação — de agenda simples a múltiplos profissionais e serviços.',
  },
  {
    icon: ShieldCheck,
    title: 'Seguro por padrão',
    description:
      'Autenticação real, regras de negócio validadas no servidor e dados protegidos — a segurança nunca depende só da tela.',
  },
];

export function Solution() {
  return (
    <section id="solucao" className="section-padding relative">
      <div className="container-app">
        <SectionHeading
          eyebrow="A solução"
          title="Um sistema inteligente de gestão e agendamento"
          description="Criado pela JF Dev para eliminar planilhas soltas, cadernos de agenda e mensagens perdidas — substituindo tudo por uma experiência digital única, coerente e sob controle total do negócio."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.08}>
              <Card className="h-full p-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-electric/10 text-blue-neon">
                  <pillar.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{pillar.description}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
