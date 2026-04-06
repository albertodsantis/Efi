import React, { useEffect, useRef, useState } from 'react';
import { FolderPlus, Plus, Trash } from '@phosphor-icons/react';
import type { MediaKitProfile, Partner } from '@shared';
import { fieldClass, labelClass, safeArr } from './block-styles';

function BrandInput({
  value,
  onChange,
  partners,
  onCreateInDirectory,
  accentColor,
}: {
  value: string;
  onChange: (v: string) => void;
  partners: Partner[];
  onCreateInDirectory: (name: string) => void;
  accentColor: string;
}) {
  const [focused, setFocused] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputVal = value.trim().toLowerCase();

  const suggestions = inputVal.length > 0
    ? partners.filter((p) => p.name.toLowerCase().includes(inputVal) && p.name.toLowerCase() !== inputVal)
    : partners;

  const exactMatch = partners.some((p) => p.name.toLowerCase() === inputVal);
  const showDropdown = focused && (suggestions.length > 0 || (inputVal.length > 0 && !exactMatch));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await onCreateInDirectory(value.trim());
    } finally {
      setCreating(false);
      setFocused(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        className={fieldClass}
        style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
        placeholder=""
      />
      {showDropdown && (
        <div className="absolute z-[100] mt-2 max-h-52 w-full overflow-auto rounded-[1rem] border bg-[var(--surface-card-strong)] p-1.5 shadow-[var(--shadow-medium)] animate-in fade-in zoom-in-95 duration-100 [border-color:var(--line-soft)]">
          {suggestions.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(p.name); setFocused(false); }}
              className="flex w-full items-center rounded-[0.75rem] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)]/60 hover:text-[var(--text-primary)]"
            >
              {p.name}
            </button>
          ))}
          {inputVal.length > 0 && !exactMatch && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCreate}
              disabled={creating}
              className="flex w-full items-center gap-2 rounded-[0.75rem] px-3 py-2.5 text-left text-sm font-bold transition-colors hover:bg-[var(--surface-muted)]/60"
              style={{ color: accentColor }}
            >
              <FolderPlus size={14} />
              {creating ? 'Creando...' : `Crear "${value.trim()}" en directorio`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface BrandsBlockProps {
  mediaKit: Pick<MediaKitProfile, 'brandsTitle' | 'trustedBrands'>;
  accentHex: string;
  partners: Partner[];
  totalPartnersCount: number;
  configuredBrands: number;
  onTitleChange: (value: string) => void;
  onBrandChange: (index: number, value: string) => void;
  onAddBrand: () => void;
  onRemoveBrand: (index: number) => void;
  onCreatePartner: (name: string) => Promise<void>;
}

export default function BrandsBlock({
  mediaKit,
  accentHex,
  partners,
  totalPartnersCount,
  configuredBrands,
  onTitleChange,
  onBrandChange,
  onAddBrand,
  onRemoveBrand,
  onCreatePartner,
}: BrandsBlockProps) {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
        <div>
          <label className={labelClass}>Titulo del bloque de marcas</label>
          <input
            value={mediaKit.brandsTitle || ''}
            onChange={(e) => onTitleChange(e.target.value)}
            className={fieldClass}
            style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
            placeholder=""
          />
        </div>
        <div className="rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-muted)] px-4 py-4">
          <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--text-secondary)]/80 uppercase">
            Clientes cargados
          </p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {configuredBrands}
            <span className="ml-1 text-sm font-medium text-[var(--text-secondary)]">
              / {totalPartnersCount} en directorio
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {safeArr(mediaKit.trustedBrands).map((brand: any, index: number) => (
          <div key={index} className="group relative">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[11px] font-bold tracking-[0.16em] text-[var(--text-secondary)]/80 uppercase">
                Cliente {index + 1}
              </label>
              <button
                type="button"
                onClick={() => onRemoveBrand(index)}
                className="text-[var(--text-secondary)] opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
              >
                <Trash size={14} />
              </button>
            </div>
            <BrandInput
              value={typeof brand === 'string' ? brand : ''}
              onChange={(val) => onBrandChange(index, val)}
              partners={partners}
              onCreateInDirectory={onCreatePartner}
              accentColor={accentHex}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAddBrand}
        className="mt-3 flex items-center gap-1.5 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <Plus size={14} weight="regular" /> Añadir marca
      </button>
    </div>
  );
}
