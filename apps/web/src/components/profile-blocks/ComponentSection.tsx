import React from 'react';
import { Plus, X } from '@phosphor-icons/react';
import type { ComponentMeta } from './block-styles';

/** Wraps an optional block component with a label and a remove button. */
export function ComponentSection({
  label,
  onRemove,
  children,
}: {
  label: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-(--text-secondary)/50">
          {label}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-(--text-secondary)/40 transition-colors hover:text-rose-500"
          title={`Quitar ${label}`}
        >
          <X size={12} />
        </button>
      </div>
      {children}
    </div>
  );
}

/** Renders chips for hidden components so the user can re-add them. */
export function AddComponentBar({
  available,
  onAdd,
}: {
  available: ComponentMeta[];
  onAdd: (key: string) => void;
}) {
  if (!available.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2 border-t border-(--line-soft) pt-4">
      {available.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onAdd(c.key)}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-(--line-soft) px-3 py-1 text-[11px] font-bold text-(--text-secondary) transition-colors hover:border-(--accent) hover:text-(--text-primary)"
        >
          <Plus size={10} />
          {c.label}
        </button>
      ))}
    </div>
  );
}
