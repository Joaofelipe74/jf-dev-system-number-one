'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
}

export function MobileMenu({ open, onClose, links }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-xl lg:hidden"
        >
          <div className="container-app flex h-16 items-center justify-between sm:h-20">
            <span className="font-display text-lg font-bold text-ink">Menu</span>
            <button
              onClick={onClose}
              aria-label="Fechar menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-soft text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <motion.nav
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="container-app flex flex-col gap-2 pt-4"
            aria-label="Navegação móvel"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="rounded-xl px-4 py-4 text-lg font-medium text-ink transition-colors hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
            <a href="#contato" onClick={onClose} className="mt-4">
              <Button size="lg" className="w-full">
                Solicitar projeto
              </Button>
            </a>
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
