import Link from 'next/link';
import { Instagram, Linkedin, Github, Mail } from 'lucide-react';
import { siteConfig, getWhatsAppLink } from '@/config/site';

export function SiteFooter() {
  const whatsappLink = getWhatsAppLink('Olá! Vim pelo site e quero saber mais sobre a JF Dev.');

  return (
    <footer className="border-t border-border-soft bg-bg-secondary">
      <div className="container-app grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link href="#inicio" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-electric to-violet-neon text-sm font-black text-white">
              JF
            </span>
            <span className="text-ink">{siteConfig.brand.shortName}</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm text-ink-muted">
            {siteConfig.brand.description} Desenvolvido pela {siteConfig.brand.name}.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {siteConfig.contact.instagram && (
              <SocialLink href={siteConfig.contact.instagram} label="Instagram">
                <Instagram className="h-4 w-4" />
              </SocialLink>
            )}
            {siteConfig.contact.linkedin && (
              <SocialLink href={siteConfig.contact.linkedin} label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </SocialLink>
            )}
            {siteConfig.contact.github && (
              <SocialLink href={siteConfig.contact.github} label="GitHub">
                <Github className="h-4 w-4" />
              </SocialLink>
            )}
            {siteConfig.contact.email && (
              <SocialLink href={`mailto:${siteConfig.contact.email}`} label="E-mail">
                <Mail className="h-4 w-4" />
              </SocialLink>
            )}
          </div>
        </div>

        <div>
          <p className="font-display text-sm font-semibold text-ink">Navegação</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
            <li><a href="#solucao" className="hover:text-ink">A solução</a></li>
            <li><a href="#recursos" className="hover:text-ink">Recursos</a></li>
            <li><a href="#sistema" className="hover:text-ink">Sistema</a></li>
            <li><a href="#contato" className="hover:text-ink">Contato</a></li>
          </ul>
        </div>

        <div>
          <p className="font-display text-sm font-semibold text-ink">Acesso</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
            <li><Link href="/agendar" className="hover:text-ink">Agendar horário</Link></li>
            <li><Link href="/area-do-cliente" className="hover:text-ink">Área do cliente</Link></li>
            <li><Link href="/admin/login" className="hover:text-ink">Painel administrativo</Link></li>
            {whatsappLink && (
              <li>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                  Falar pelo WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border-soft py-6">
        <div className="container-app flex flex-col items-center justify-between gap-3 text-xs text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {siteConfig.brand.name}. Todos os direitos reservados.</p>
          <p>Desenvolvido pela {siteConfig.brand.name} — tecnologia, exclusividade e sofisticação.</p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-soft text-ink-muted transition-colors hover:border-blue-electric/40 hover:text-blue-neon"
    >
      {children}
    </a>
  );
}
