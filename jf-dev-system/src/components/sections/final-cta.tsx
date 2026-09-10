'use client';

import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWhatsAppLink, siteConfig } from '@/config/site';

export function FinalCta() {
  const whatsappLink = getWhatsAppLink(
    `Olá! Vi o sistema de gestão e agendamento da ${siteConfig.brand.name} e quero solicitar um projeto.`
  );

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-hero-radial" aria-hidden />
      <div className="container-app relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel glow-border mx-auto max-w-3xl px-6 py-14 text-center sm:px-12 sm:py-16"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Seu negócio pode ser o próximo.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-muted sm:text-lg">
            Transforme processos manuais em uma experiência digital moderna, desenvolvida sob
            medida pela {siteConfig.brand.name}.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#contato">
              <Button size="lg" className="w-full sm:w-auto">
                Solicitar um projeto
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            {whatsappLink ? (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <MessageCircle className="h-4 w-4" />
                  Falar com a {siteConfig.brand.name}
                </Button>
              </a>
            ) : (
              <a href="#contato">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <MessageCircle className="h-4 w-4" />
                  Falar com a {siteConfig.brand.name}
                </Button>
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
