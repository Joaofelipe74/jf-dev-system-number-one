'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/button';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'Solução', href: '#solucao' },
  { label: 'Recursos', href: '#recursos' },
  { label: 'Sistema', href: '#sistema' },
  { label: 'Contato', href: '#contato' },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-all duration-300',
          scrolled
            ? 'border-b border-border-soft bg-bg/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        )}
      >
        <div className="container-app flex h-16 items-center justify-between sm:h-20">
          <Link href="#inicio" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-electric to-violet-neon text-sm font-black text-white shadow-glow-blue-sm">
              JF
            </span>
            <span className="text-ink">{siteConfig.brand.shortName}</span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:block">
            <a href="#contato">
              <Button size="sm">Solicitar projeto</Button>
            </a>
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-soft text-ink lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {scrolled && (
          <motion.div
            layoutId="header-glow"
            className="h-px w-full bg-gradient-to-r from-transparent via-blue-electric/60 to-transparent"
          />
        )}
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={NAV_LINKS} />
    </>
  );
}
