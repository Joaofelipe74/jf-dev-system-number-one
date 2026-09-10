import Link from 'next/link';
import { ArrowRight, LayoutGrid, Users2, Scissors, BarChart3 } from 'lucide-react';
import { Reveal, SectionHeading } from '@/components/ui/reveal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CAPABILITIES = [
  {
    icon: LayoutGrid,
    title: 'Dashboard administrativo',
    description:
      'Agendamentos do dia, receita estimada, atendimentos concluídos e cancelamentos — tudo em cards e gráficos com identidade dark.',
  },
  {
    icon: Users2,
    title: 'Gestão de clientes e profissionais',
    description:
      'Cadastro completo, histórico individual, horários de trabalho e controle de atividade de cada profissional.',
  },
  {
    icon: Scissors,
    title: 'Gestão de serviços',
    description: 'Preço, duração, status e quais profissionais realizam cada serviço, com edição instantânea.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios e métricas',
    description: 'Faturamento, serviços mais utilizados, desempenho por profissional e evolução mensal.',
  },
];

export function AdminPreview() {
  return (
    <section className="section-padding">
      <div className="container-app">
        <SectionHeading
          eyebrow="Painel administrativo"
          title="Controle total da operação, em uma interface premium"
          description="Sidebar organizada, busca, notificações e um dashboard que realmente reflete o que está acontecendo no negócio."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {CAPABILITIES.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.07}>
              <Card className="flex h-full gap-4 p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-neon/10 text-violet-neon">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.description}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-10 text-center">
          <Link href="/admin/login">
            <Button size="lg" variant="secondary">
              Acessar o painel administrativo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
