import { Mail, MessageCircle, Instagram } from 'lucide-react';
import { Reveal, SectionHeading } from '@/components/ui/reveal';
import { Card } from '@/components/ui/card';
import { getWhatsAppLink, siteConfig } from '@/config/site';

export function Contact() {
  const whatsappLink = getWhatsAppLink(`Olá! Quero saber mais sobre a ${siteConfig.brand.name}.`);
  const hasAnyContact =
    siteConfig.contact.whatsapp || siteConfig.contact.email || siteConfig.contact.instagram;

  return (
    <section id="contato" className="section-padding bg-bg-secondary">
      <div className="container-app">
        <SectionHeading
          eyebrow="Contato"
          title={`Vamos construir o sistema do seu negócio`}
          description={`Fale diretamente com a ${siteConfig.brand.name} e conte o que você precisa.`}
        />

        <Reveal delay={0.1} className="mx-auto mt-12 max-w-2xl">
          <Card className="p-6 sm:p-8">
            {hasAnyContact ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {siteConfig.contact.whatsapp && whatsappLink && (
                  <ContactItem icon={MessageCircle} label="WhatsApp" href={whatsappLink} />
                )}
                {siteConfig.contact.email && (
                  <ContactItem
                    icon={Mail}
                    label="E-mail"
                    href={`mailto:${siteConfig.contact.email}`}
                  />
                )}
                {siteConfig.contact.instagram && (
                  <ContactItem icon={Instagram} label="Instagram" href={siteConfig.contact.instagram} />
                )}
              </div>
            ) : (
              <p className="text-center text-sm text-ink-muted">
                Os canais de contato da {siteConfig.brand.name} serão exibidos aqui assim que
                configurados em{' '}
                <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs text-blue-neon">
                  src/config/site.ts
                </code>
                .
              </p>
            )}
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

function ContactItem({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Mail;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-2 rounded-xl border border-border-soft p-5 text-center transition-colors hover:border-blue-electric/40 hover:bg-white/5"
    >
      <Icon className="h-5 w-5 text-blue-neon" aria-hidden />
      <span className="text-sm font-medium text-ink">{label}</span>
    </a>
  );
}
