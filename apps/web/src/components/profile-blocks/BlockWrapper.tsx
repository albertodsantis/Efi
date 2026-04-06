import React from 'react';
import { ArrowUp, ArrowDown, X } from '@phosphor-icons/react';

interface BlockWrapperProps {
  title: string;
  children: React.ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
}

export default function BlockWrapper({ title, children, onMoveUp, onMoveDown, onRemove }: BlockWrapperProps) {
  return (
    <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--surface-muted)]/50 px-5 py-2.5">
        <p className="text-[11px] font-bold tracking-[0.16em] text-[var(--text-secondary)]/70 uppercase">{title}</p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] disabled:opacity-25 disabled:cursor-not-allowed"
            title="Mover arriba"
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] disabled:opacity-25 disabled:cursor-not-allowed"
            title="Mover abajo"
          >
            <ArrowDown size={13} />
          </button>
          <div className="mx-1 h-4 w-px bg-[var(--line-soft)]" />
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
            title="Eliminar bloque"
          >
            <X size={13} />
          </button>
        </div>
      </div>
      <div className="p-6 lg:p-7">{children}</div>
    </div>
  );
}
