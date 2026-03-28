import React, { useCallback, useRef, useState } from 'react';
import { ImageSquare, Trash, CircleNotch } from '@phosphor-icons/react';
import { appApi } from '../lib/api';
import { cx } from './ui';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif';

interface ImageUploadProps {
  /** Current image URL (external URL or Supabase URL). */
  value: string;
  /** Called with the new public URL after upload, or '' on delete. */
  onChange: (url: string) => void;
  /** Storage category — organizes files in folders (e.g. 'avatar', 'portfolio', 'media-kit'). */
  category: string;
  /** Accent color for interactive elements. */
  accentColor?: string;
  /** Aspect ratio class (e.g. 'aspect-square', 'aspect-video'). Default: 'aspect-square'. */
  aspectRatio?: string;
  /** Additional container className. */
  className?: string;
  /** Placeholder text when empty. */
  placeholder?: string;
  /** Whether uploads are enabled (Supabase configured). Falls back to URL input when false. */
  uploadsEnabled?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  category,
  accentColor = '#C96F5B',
  aspectRatio = 'aspect-square',
  className,
  placeholder = 'Subir imagen',
  uploadsEnabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten imágenes.');
        return;
      }
      if (file.size > MAX_SIZE) {
        setError('La imagen excede 5 MB.');
        return;
      }

      setUploading(true);
      try {
        const result = await appApi.uploadFile(file, category);
        onChange(result.url);
      } catch (err: any) {
        setError(err.message || 'Error al subir imagen');
      } finally {
        setUploading(false);
      }
    },
    [category, onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  // When uploads are not enabled, render a simple URL text input
  if (!uploadsEnabled) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className={cx(
          'w-full rounded-[0.95rem] border border-[var(--line-soft)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/40 focus:ring-2',
          className,
        )}
        style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
      />
    );
  }

  return (
    <div className={cx('relative', className)}>
      {value ? (
        /* ── Preview ───────────────────────────────────────── */
        <div className={cx('group relative overflow-hidden rounded-[1rem]', aspectRatio)}>
          <img
            src={value}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-white/90 p-2 text-slate-700 shadow transition-transform hover:scale-110"
              title="Cambiar imagen"
            >
              <ImageSquare size={18} />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-full bg-white/90 p-2 text-red-600 shadow transition-transform hover:scale-110"
              title="Eliminar"
            >
              <Trash size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* ── Drop zone ─────────────────────────────────────── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={cx(
            'flex w-full flex-col items-center justify-center gap-2 rounded-[1rem] border-2 border-dashed transition-all',
            aspectRatio,
            dragOver
              ? 'border-[var(--accent)] bg-[var(--accent)]/5'
              : 'border-[var(--line-soft)] bg-[var(--surface-muted)]/50 hover:border-[var(--accent)]/50',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          {uploading ? (
            <CircleNotch size={24} className="animate-spin text-[var(--text-secondary)]" />
          ) : (
            <ImageSquare size={24} style={{ color: accentColor }} />
          )}
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            {uploading ? 'Subiendo...' : placeholder}
          </span>
          {!uploading && (
            <span className="text-[10px] text-[var(--text-secondary)]/60">
              JPG, PNG, WebP · máx 5 MB
            </span>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <p className="mt-1.5 text-[11px] font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}
