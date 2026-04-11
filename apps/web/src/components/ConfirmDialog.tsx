import React from 'react';
import OverlayModal from './OverlayModal';
import { Button, ModalPanel } from './ui';
import { hapticWarning } from '../lib/haptics';

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onClose,
  isConfirming = false,
  tone = 'danger',
  accentColor,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  isConfirming?: boolean;
  tone?: 'primary' | 'danger';
  accentColor?: string;
}) {
  return (
    <OverlayModal onClose={onClose}>
      <ModalPanel
        title={title}
        description="Confirma esta accion antes de aplicarla al workspace."
        onClose={onClose}
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button tone="secondary" onClick={onClose} className="sm:min-w-[9rem]">
              {cancelLabel}
            </Button>
            <Button
              tone={tone}
              accentColor={tone === 'primary' ? accentColor : undefined}
              onClick={async () => {
                await hapticWarning();
                onConfirm();
              }}
              disabled={isConfirming}
              className="sm:min-w-[9rem]"
            >
              {isConfirming ? 'Procesando...' : confirmLabel}
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </ModalPanel>
    </OverlayModal>
  );
}
