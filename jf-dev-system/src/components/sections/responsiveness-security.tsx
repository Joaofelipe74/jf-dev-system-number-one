import { Smartphone, Tablet, Monitor, ShieldCheck, Lock, KeyRound, DatabaseZap } from 'lucide-react';
import { Reveal, SectionHeading } from '@/components/ui/reveal';
import { Card } from '@/components/ui/card';

export function Responsiveness() {
  return (
    <section className="section-padding bg-bg-secondary">
      <div className="container-app">
        <SectionHeading
          eyebrow="Responsividade"
          title="A mesma qualidade, em qualquer tela"
          description="Construído mobile first: nada de scroll horizontal, componentes espremidos ou informação perdida."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Smartphone, title: 'Smartphones', desc: 'Botões grandes, formulários simplificados e menu em drawer.' },
            { icon: Tablet, title: 'Tablets', desc: 'Layouts intermediários que aproveitam o espaço extra da tela.' },
            { icon: Monitor, title: 'Desktops & Ultrawide', desc: 'Densidade de informação maior, sem perder a leitura clara.' },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 0.08}>
              <Card className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-electric/10 text-blue-neon">
                  <item.icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{item.desc}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Security() {
  return (
    <section className="section-padding">
      <div className="container-app">
        <SectionHeading
          eyebrow="Segurança"
          title="Tratada corretamente, não como detalhe"
          description="Segredos nunca ficam no código, senhas nunca ficam em texto puro e as regras críticas rodam no servidor."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: KeyRound, title: 'Autenticação real', desc: 'Login administrativo com senha criptografada e sessão assinada.' },
            { icon: Lock, title: 'Variáveis de ambiente', desc: 'Credenciais e chaves privadas nunca versionadas no repositório.' },
            { icon: ShieldCheck, title: 'Validação no servidor', desc: 'Toda regra crítica — como conflitos de horário — é validada no backend.' },
            { icon: DatabaseZap, title: 'Dados protegidos', desc: 'Informações de clientes ficam no banco, nunca em arquivos versionados.' },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 0.06}>
              <Card className="h-full p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-sm font-semibold text-ink">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{item.desc}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
