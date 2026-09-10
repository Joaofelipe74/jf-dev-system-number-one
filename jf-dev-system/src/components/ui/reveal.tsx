'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}

/** Reforça a leitura em scroll com um fade-up discreto — sem exageros. */
export function Reveal({ children, delay = 0, className, y = 20 }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  center = true,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-neon">
        {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-4 text-base text-ink-muted sm:text-lg">{description}</p>}
    </Reveal>
  );
}
