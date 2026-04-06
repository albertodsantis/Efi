import React from 'react';
import { Plus, Trash } from '@phosphor-icons/react';
import type { MediaKitOffer, MediaKitProfile } from '@shared';
import { fieldClass, textareaClass, labelClass, safeArr } from './block-styles';

interface ServicesBlockProps {
  mediaKit: Pick<MediaKitProfile, 'servicesTitle' | 'servicesDescription' | 'offerings'>;
  accentHex: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onOfferingChange: (index: number, field: keyof MediaKitOffer, value: string) => void;
  onAddOffering: () => void;
  onRemoveOffering: (index: number) => void;
}

export default function ServicesBlock({
  mediaKit,
  accentHex,
  onTitleChange,
  onDescriptionChange,
  onOfferingChange,
  onAddOffering,
  onRemoveOffering,
}: ServicesBlockProps) {
  return (
    <div className="grid gap-6">
      <div>
        <label className={labelClass}>Titulo del bloque de tarifas</label>
        <input
          value={mediaKit.servicesTitle || ''}
          onChange={(e) => onTitleChange(e.target.value)}
          className={fieldClass}
          style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
          placeholder=""
        />
      </div>
      <div>
        <label className={labelClass}>Descripcion del bloque de tarifas</label>
        <textarea
          value={mediaKit.servicesDescription || ''}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className={textareaClass}
          style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
          placeholder=""
        />
      </div>
      <div className="grid gap-4">
        {safeArr(mediaKit.offerings).map((offering: any, index: number) => (
          <div
            key={index}
            className="group relative rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-muted)] p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.16em] text-[var(--text-secondary)]/80 uppercase">
                Oferta {index + 1}
              </p>
              <button
                type="button"
                onClick={() => onRemoveOffering(index)}
                className="text-[var(--text-secondary)] opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
              >
                <Trash size={14} />
              </button>
            </div>
            <div className="grid gap-4">
              <input
                value={offering?.title || ''}
                onChange={(e) => onOfferingChange(index, 'title', e.target.value)}
                className={fieldClass}
                style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                placeholder="Nombre de la oferta"
              />
              <input
                value={offering?.price || ''}
                onChange={(e) => onOfferingChange(index, 'price', e.target.value)}
                className={fieldClass}
                style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                placeholder="Precio"
              />
              <textarea
                value={offering?.description || ''}
                onChange={(e) => onOfferingChange(index, 'description', e.target.value)}
                className={textareaClass}
                style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                placeholder=""
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={onAddOffering}
          className="flex min-h-[60px] items-center justify-center gap-2 rounded-[1rem] border border-dashed border-[var(--line-soft)] bg-[var(--surface-card)] text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
        >
          <Plus size={16} weight="regular" />
          <span className="text-sm font-bold">Añadir oferta</span>
        </button>
      </div>
    </div>
  );
}
