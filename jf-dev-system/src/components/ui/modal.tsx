'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * CORREÇÃO DE ACESSIBILIDADE: o modal anterior não fazia nenhum
 * gerenciamento de foco — ao abrir, o foco permanecia em qualquer
 * elemento que estivesse focado antes (frequentemente atrás do overlay,
 * invisível), e a tecla Tab podia levar o foco para fora da caixa de
 * diálogo, para elementos da página por trás dela. Agora: o foco vai para
 * o primeiro elemento focável do modal ao abrir, Tab/Shift+Tab ficam
 * presos dentro do modal enquanto ele estiver aberto, e o foco volta para
 * o elemento que o disparou ao fechar.
 */
export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const focusFirstElement = () => {
      const container = dialogRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusable[0] ?? container).focus();
    };
    // Aguarda o próximo frame para garantir que o conteúdo já foi montado.
    const raf = requestAnimationFrame(focusFirstElement);

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const container = dialogRef.current;
      if (!container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-border-soft bg-surface p-6 shadow-card-hover focus:outline-none',
              sizeClasses[size]
            )}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="modal-title" className="font-display text-lg font-semibold text-ink">
                  {title}
                </h2>
                {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
