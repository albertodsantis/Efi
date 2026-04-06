import React from 'react';
import { Plus, Trash } from '@phosphor-icons/react';
import type { MediaKitProfile } from '@shared';
import ImageUpload from '../ImageUpload';
import { labelClass, safeArr } from './block-styles';

interface PortfolioBlockProps {
  mediaKit: Pick<MediaKitProfile, 'portfolioImages'>;
  accentHex: string;
  uploadsEnabled: boolean;
  onImageChange: (index: number, url: string) => void;
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
}

export default function PortfolioBlock({
  mediaKit,
  accentHex,
  uploadsEnabled,
  onImageChange,
  onAddImage,
  onRemoveImage,
}: PortfolioBlockProps) {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {safeArr(mediaKit.portfolioImages).map((image: any, index: number) => (
          <div key={index} className="group relative">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[11px] font-bold tracking-[0.16em] text-[var(--text-secondary)]/80 uppercase">
                Imagen {index + 1}
              </label>
              <button
                type="button"
                onClick={() => onRemoveImage(index)}
                className="text-[var(--text-secondary)] opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
              >
                <Trash size={14} />
              </button>
            </div>
            <ImageUpload
              value={typeof image === 'string' ? image : ''}
              onChange={(url) => onImageChange(index, url)}
              category="portfolio"
              accentColor={accentHex}
              uploadsEnabled={uploadsEnabled}
              aspectRatio="aspect-[4/3]"
              placeholder={`Imagen ${index + 1}`}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAddImage}
        className="mt-3 flex items-center gap-1.5 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <Plus size={14} weight="regular" /> Añadir imagen
      </button>
    </div>
  );
}
