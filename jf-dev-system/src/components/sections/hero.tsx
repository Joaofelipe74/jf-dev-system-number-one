'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Hero3D } from '@/components/3d/hero-3d';
import { siteConfig } from '@/config/site';

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-40">
      <div className="pointer-events-none absolute inset-0 bg-hero-radial" aria-hidden />

      <div className="container-app relative grid items-center gap-12 pb-16 lg:grid-cols-2 lg:gap-8 lg:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface px-4 py-1.5 text-xs font-medium text-blue-neon">
            <Sparkles className="h-3.5 w-3.5" />
            Desenvolvido pela {siteConfig.brand.name}
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            <span className="text-gradient-blue">{siteConfig.brand.shortName}</span>
            <br />
            {siteConfig.brand.tagline}
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">
            {siteConfig.brand.description} Conheça o{' '}
            <strong className="font-semibold text-ink">Sistema Inteligente de Gestão e Agendamento</strong>{' '}
            — construído para o seu negócio, do jeito que ele realmente funciona.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#solucao">
              <Button size="lg" className="w-full sm:w-auto">
                Conhecer a solução
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href="#contato">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Solicitar projeto
              </Button>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink-muted">
            <Link href="/agendar" className="underline-offset-4 hover:text-blue-neon hover:underline">
              Ver agendamento em ação →
            </Link>
            <Link href="/admin/login" className="underline-offset-4 hover:text-blue-neon hover:underline">
              Acessar painel administrativo →
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <Hero3D />
        </motion.div>
      </div>
    </section>
  );
}
