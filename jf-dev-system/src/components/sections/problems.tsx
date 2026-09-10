import { XCircle, CheckCircle2 } from 'lucide-react';
import { Reveal, SectionHeading } from '@/components/ui/reveal';

const COMPARISONS = [
  {
    problem: 'Agenda em papel ou planilha, sujeita a erro e retrabalho.',
    solution: 'Agenda digital centralizada, com bloqueios e conflitos verificados automaticamente.',
  },
  {
    problem: 'Cliente precisa ligar ou mandar mensagem para saber horário livre.',
    solution: 'Cliente vê e escolhe, sozinho, apenas os horários realmente disponíveis.',
  },
  {
    problem: 'Nenhuma visão real do faturamento e da operação.',
    solution: 'Dashboard com métricas, gráficos e histórico atualizados em tempo real.',
  },
  {
    problem: 'Times grandes perdem o controle de quem atende o quê.',
    solution: 'Gestão individual de profissionais, serviços e horários de trabalho.',
  },
];

export function Problems() {
  return (
    <section className="section-padding bg-bg-secondary">
      <div className="container-app">
        <SectionHeading
          eyebrow="Por que existe"
          title="Problemas reais que o sistema resolve"
          description="Cada funcionalidade nasceu de uma dificuldade concreta na rotina de quem vive de agenda e atendimento."
        />

        <div className="mx-auto mt-14 grid max-w-4xl gap-4">
          {COMPARISONS.map((item, i) => (
            <Reveal key={item.problem} delay={i * 0.06}>
              <div className="grid gap-3 rounded-2xl border border-border-soft bg-surface p-5 sm:grid-cols-2 sm:gap-6 sm:p-6">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400/80" aria-hidden />
                  <p className="text-sm text-ink-muted">{item.problem}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-neon" aria-hidden />
                  <p className="text-sm text-ink">{item.solution}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
