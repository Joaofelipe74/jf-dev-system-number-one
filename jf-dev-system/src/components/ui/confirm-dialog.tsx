'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  variant?: 'danger' | 'primary';
}

/** Diálogo de confirmação usado antes de qualquer ação destrutiva (excluir). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  isLoading,
  onConfirm,
  onClose,
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-300">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        <p className="text-sm text-ink-muted">{description}</p>
        <div className="mt-4 flex w-full gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
