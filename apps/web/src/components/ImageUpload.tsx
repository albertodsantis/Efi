import React, { useCallback, useRef, useState } from 'react';
import { ImageSquare, Trash, CircleNotch, Camera, Image } from '@phosphor-icons/react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
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

/** Converts a base64 data URL to a File object for upload. */
function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
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
  const [showNativeSheet, setShowNativeSheet] = useState(false);

  const isNative = Capacitor.isNativePlatform();

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

  const handleNativeCapture = async (source: CameraSource) => {
    setShowNativeSheet(false);
    try {
      const photo = await CapCamera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source,
        quality: 80,
        allowEditing: false,
        width: 1200,
      });

      if (!photo.dataUrl) return;

      const ext = photo.format ?? 'jpeg';
      const file = dataUrlToFile(photo.dataUrl, `photo_${Date.now()}.${ext}`);
      void handleFile(file);
    } catch {
      // User cancelled or permission denied — no error shown
    }
  };

  const handleTriggerUpload = () => {
    if (isNative) {
      setShowNativeSheet(true);
    } else {
      inputRef.current?.click();
    }
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
              onClick={handleTriggerUpload}
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
          onClick={handleTriggerUpload}
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

      {/* Web file input (hidden, unused on native) */}
      {!isNative && (
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleInputChange}
          className="hidden"
        />
      )}

      {error && (
        <p className="mt-1.5 text-[11px] font-medium text-red-500">{error}</p>
      )}

      {/* ── Native bottom sheet ────────────────────────────────── */}
      {showNativeSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowNativeSheet(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Sheet */}
          <div
            className="relative w-full rounded-t-2xl bg-zinc-900 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 mt-3 h-1 w-10 rounded-full bg-zinc-700" />

            <p className="mb-2 px-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Seleccionar imagen
            </p>

            <button
              type="button"
              onClick={() => void handleNativeCapture(CameraSource.Camera)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-white transition-colors active:bg-zinc-800"
            >
              <Camera size={20} className="text-zinc-400" />
              Tomar foto
            </button>

            <div className="mx-5 h-px bg-zinc-800" />

            <button
              type="button"
              onClick={() => void handleNativeCapture(CameraSource.Photos)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-white transition-colors active:bg-zinc-800"
            >
              <Image size={20} className="text-zinc-400" />
              Elegir de galería
            </button>

            <div className="mx-5 h-px bg-zinc-800" />

            <button
              type="button"
              onClick={() => setShowNativeSheet(false)}
              className="w-full px-5 py-4 text-sm font-semibold text-zinc-400 transition-colors active:bg-zinc-800"
            >
              Cancelar
            </button>

            <div className="h-4" />
          </div>
        </div>
      )}
    </div>
  );
}
