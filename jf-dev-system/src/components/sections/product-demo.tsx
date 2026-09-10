'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BarChart3, Bell, CalendarCheck, Users } from 'lucide-react';
import { SectionHeading } from '@/components/ui/reveal';

/**
 * Seção de "apresentação de produto": ao rolar, um notebook 3D (via CSS
 * transforms + perspectiva) exibe o dashboard, cartões de estatística
 * entram em cena e um celular aparece demonstrando o agendamento —
 * profundidade real sem depender de vídeo ou WebGL pesado nesta seção.
 */
export function ProductDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const notebookRotate = useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, -6]);
  const notebookY = useTransform(scrollYProgress, [0, 0.5, 1], [40, 0, -30]);
  const cardsOpacity = useTransform(scrollYProgress, [0.15, 0.4], [0, 1]);
  const cardsY = useTransform(scrollYProgress, [0.15, 0.45], [30, 0]);
  const phoneX = useTransform(scrollYProgress, [0.3, 0.6], [60, 0]);
  const phoneOpacity = useTransform(scrollYProgress, [0.3, 0.55], [0, 1]);

  return (
    <section id="sistema" ref={containerRef} className="section-padding relative overflow-hidden">
      <div className="container-app">
        <SectionHeading
          eyebrow="Demonstração"
          title="O sistema em ação, com profundidade real"
          description="Continue rolando: o painel ganha vida, os dados entram em cena e o agendamento aparece no celular do cliente."
        />

        <div className="relative mx-auto mt-16 flex min-h-[520px] max-w-4xl items-center justify-center" style={{ perspective: 1400 }}>
          {/* Notebook / dashboard */}
          <motion.div
            style={{ rotateX: notebookRotate, y: notebookY, transformStyle: 'preserve-3d' }}
            className="relative z-10 w-full max-w-xl rounded-2xl border border-border-soft bg-surface-elevated/90 p-4 shadow-glow-blue backdrop-blur-xl sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              </div>
              <span className="text-[11px] text-ink-muted">painel.jfdev.app/admin</span>
            </div>
            <div className="rounded-xl bg-bg p-4">
              <div className="mb-3 h-2.5 w-40 rounded bg-gradient-to-r from-blue-electric to-blue-neon" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: CalendarCheck, label: 'Hoje', value: '12' },
                  { icon: Users, label: 'Clientes', value: '284' },
                  { icon: BarChart3, label: 'Receita', value: 'R$ 6.4k' },
                  { icon: Bell, label: 'Pendentes', value: '3' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-border-soft bg-surface p-3">
                    <stat.icon className="h-4 w-4 text-blue-neon" aria-hidden />
                    <p className="mt-2 text-sm font-semibold text-ink">{stat.value}</p>
                    <p className="text-[10px] text-ink-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex h-20 items-end gap-1.5 rounded-lg border border-border-soft bg-surface p-3">
                {[35, 55, 40, 70, 50, 85, 60, 95, 65, 75].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-blue-main/70 to-blue-neon"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Cartões de estatística entrando em cena */}
          <motion.div
            style={{ opacity: cardsOpacity, y: cardsY }}
            className="absolute -left-2 top-6 z-20 hidden w-40 rounded-xl border border-border-soft bg-surface-elevated/95 p-3 shadow-card backdrop-blur-xl sm:block sm:-left-8"
          >
            <p className="text-[10px] text-ink-muted">Serviço mais pedido</p>
            <p className="mt-1 text-sm font-semibold text-ink">Coloração Premium</p>
            <p className="text-xs text-blue-neon">42 atendimentos/mês</p>
          </motion.div>

          {/* Celular demonstrando o agendamento */}
          <motion.div
            style={{ opacity: phoneOpacity, x: phoneX }}
            className="absolute -right-2 bottom-0 z-20 w-32 rounded-2xl border border-border-soft bg-surface-elevated/95 p-2.5 shadow-glow-violet backdrop-blur-xl sm:-right-6 sm:w-36"
          >
            <div className="mx-auto mb-2 h-1.5 w-8 rounded-full bg-white/10" />
            <p className="text-[10px] text-ink-muted">Seu agendamento</p>
            <p className="mt-1 text-xs font-semibold text-ink">Corte Moderno</p>
            <p className="text-[10px] text-ink-muted">Hoje, 15:00</p>
            <div className="mt-2 rounded-md bg-gradient-to-r from-blue-main to-blue-neon py-1.5 text-center text-[9px] font-semibold text-white">
              Confirmado
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
