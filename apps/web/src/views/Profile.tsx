import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowSquareOut,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  CircleNotch,
  Copy,
  FilePdf,
  GlobeSimple,
  InstagramLogo,
  Link,
  Plus,
  Trash,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
  ThreadsLogo,
} from '@phosphor-icons/react';
import type { EfiProfile, ProfileLink, SocialProfiles } from '@shared';
import { useAppContext } from '../context/AppContext';
import { Avatar, Button, ScreenHeader, SurfaceCard, cx } from '../components/ui';
import { appApi } from '../lib/api';
import { toast } from '../lib/toast';
import ImageUpload from '../components/ImageUpload';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileForm {
  name: string;
  handle: string;
  tagline: string;
  avatar: string;
  socialProfiles: SocialProfiles;
  efiProfile: EfiProfile;
}

// ─── Social platform config ───────────────────────────────────────────────────

const SOCIAL_PLATFORMS: {
  key: keyof SocialProfiles;
  label: string;
  Icon: React.ElementType;
  placeholder: string;
}[] = [
  { key: 'instagram', label: 'Instagram', Icon: InstagramLogo, placeholder: '@tuhandle' },
  { key: 'tiktok',    label: 'TikTok',    Icon: TiktokLogo,    placeholder: '@tuhandle' },
  { key: 'x',         label: 'X (Twitter)', Icon: XLogo,       placeholder: '@tuhandle' },
  { key: 'youtube',   label: 'YouTube',   Icon: YoutubeLogo,   placeholder: '@tucanal' },
  { key: 'threads',   label: 'Threads',   Icon: ThreadsLogo,   placeholder: '@tuhandle' },
];

// ─── Save status ──────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nanoid() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Profile() {
  const {
    profile,
    accentColor,
    accentHex,
    updateProfile,
  } = useAppContext();

  const [form, setForm] = useState<ProfileForm>({
    name: profile.name,
    handle: profile.handle,
    tagline: profile.tagline,
    avatar: profile.avatar,
    socialProfiles: { ...profile.socialProfiles },
    efiProfile: {
      links: profile.efiProfile.links.map((l) => ({ ...l })),
      pdf_url: profile.efiProfile.pdf_url,
      pdf_label: profile.efiProfile.pdf_label,
    },
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [uploadsEnabled, setUploadsEnabled] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep form in sync when profile loads from server
  useEffect(() => {
    setForm({
      name: profile.name,
      handle: profile.handle,
      tagline: profile.tagline,
      avatar: profile.avatar,
      socialProfiles: { ...profile.socialProfiles },
      efiProfile: {
        links: profile.efiProfile.links.map((l) => ({ ...l })),
        pdf_url: profile.efiProfile.pdf_url,
        pdf_label: profile.efiProfile.pdf_label,
      },
    });
  }, [profile]);

  useEffect(() => {
    appApi.getUploadStatus().then((s) => setUploadsEnabled(s.enabled)).catch(() => {});
  }, []);

  // ── Debounced auto-save ───────────────────────────────────────────────────

  const triggerSave = (updated: ProfileForm) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');

    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateProfile({
          name: updated.name,
          handle: updated.handle,
          tagline: updated.tagline,
          avatar: updated.avatar,
          socialProfiles: updated.socialProfiles,
          efiProfile: updated.efiProfile,
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err: any) {
        toast.error(err.message ?? 'Error al guardar.');
        setSaveStatus('idle');
      }
    }, 1500);
  };

  const patch = (partial: Partial<ProfileForm>) => {
    const updated = { ...form, ...partial };
    setForm(updated);
    triggerSave(updated);
  };

  const patchSocial = (key: keyof SocialProfiles, value: string) => {
    patch({ socialProfiles: { ...form.socialProfiles, [key]: value } });
  };

  const patchEfi = (partial: Partial<EfiProfile>) => {
    patch({ efiProfile: { ...form.efiProfile, ...partial } });
  };

  // ── Link management ───────────────────────────────────────────────────────

  const addLink = () => {
    const newLink: ProfileLink = { id: nanoid(), label: '', url: '' };
    patchEfi({ links: [...form.efiProfile.links, newLink] });
  };

  const updateLink = (id: string, field: keyof Omit<ProfileLink, 'id'>, value: string) => {
    patchEfi({
      links: form.efiProfile.links.map((l) =>
        l.id === id ? { ...l, [field]: value } : l,
      ),
    });
  };

  const removeLink = (id: string) => {
    patchEfi({ links: form.efiProfile.links.filter((l) => l.id !== id) });
  };

  const moveLink = (id: string, dir: 'up' | 'down') => {
    const links = [...form.efiProfile.links];
    const idx = links.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= links.length) return;
    [links[idx], links[swapIdx]] = [links[swapIdx], links[idx]];
    patchEfi({ links });
  };

  // ── PDF upload ────────────────────────────────────────────────────────────

  const handlePdfFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('El PDF no puede superar 20 MB.');
      return;
    }
    setPdfUploading(true);
    try {
      const result = await appApi.uploadFile(file, 'pdf');
      patchEfi({ pdf_url: result.url });
    } catch (err: any) {
      toast.error(err.message ?? 'Error al subir el PDF.');
    } finally {
      setPdfUploading(false);
    }
  };

  const removePdf = () => {
    patchEfi({ pdf_url: null });
  };

  // ── Public URL ────────────────────────────────────────────────────────────

  const publicHandle = form.handle.startsWith('@') ? form.handle.slice(1) : form.handle;
  const publicUrl = publicHandle ? `${window.location.origin}/@${publicHandle}` : null;

  const copyPublicUrl = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => toast.success('Enlace copiado'));
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader
        title="Perfil"
        actions={
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                <CircleNotch className="animate-spin" size={12} />
                Guardando…
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                <CheckCircle size={12} />
                Guardado
              </span>
            )}
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                <ArrowSquareOut size={12} />
                Ver página
              </a>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 md:p-6 flex flex-col gap-6">

          {/* ── Identity ─────────────────────────────────────────────────── */}
          <SurfaceCard>
            <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">
              Identidad
            </h2>
            <div className="flex gap-4 items-start">
              <div className="shrink-0">
                <ImageUpload
                  value={form.avatar}
                  onChange={(url) => patch({ avatar: url })}
                  category="avatar"
                  accentColor={accentHex}
                  aspectRatio="aspect-square"
                  className="w-20 h-20 rounded-full"
                  uploadsEnabled={uploadsEnabled}
                  placeholder="Foto"
                />
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Nombre</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    placeholder="Tu nombre"
                    className="w-full bg-transparent border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Handle</label>
                  <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
                    <span className="px-3 py-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-raised)] select-none">@</span>
                    <input
                      type="text"
                      value={form.handle.replace(/^@/, '')}
                      onChange={(e) => patch({ handle: e.target.value.replace(/^@/, '') })}
                      placeholder="tuhandle"
                      className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Bio corta</label>
                  <input
                    type="text"
                    value={form.tagline}
                    onChange={(e) => patch({ tagline: e.target.value })}
                    placeholder="Fotógrafo de bodas y retratos · México"
                    maxLength={120}
                    className="w-full bg-transparent border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
              </div>
            </div>

            {publicUrl && (
              <div className="mt-4 flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                <GlobeSimple size={14} className="text-[var(--color-text-secondary)] shrink-0" />
                <span className="text-xs text-[var(--color-text-secondary)] flex-1 truncate">{publicUrl}</span>
                <button
                  onClick={copyPublicUrl}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
          </SurfaceCard>

          {/* ── Social profiles ───────────────────────────────────────────── */}
          <SurfaceCard>
            <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">
              Redes sociales
            </h2>
            <div className="flex flex-col gap-3">
              {SOCIAL_PLATFORMS.map(({ key, label, Icon, placeholder }) => (
                <div key={key} className="flex items-center gap-2">
                  <Icon size={18} className="text-[var(--color-text-secondary)] shrink-0" />
                  <input
                    type="text"
                    value={form.socialProfiles[key]}
                    onChange={(e) => patchSocial(key, e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
              ))}
            </div>
          </SurfaceCard>

          {/* ── Links ─────────────────────────────────────────────────────── */}
          <SurfaceCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                Mis enlaces
              </h2>
              <button
                onClick={addLink}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                <Plus size={12} />
                Añadir enlace
              </button>
            </div>

            {form.efiProfile.links.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--color-text-secondary)]">
                <Link size={24} className="mx-auto mb-2 opacity-40" />
                <p>Agrega tus enlaces importantes aquí.</p>
                <p className="text-xs mt-1 opacity-60">YouTube, newsletter, booking, portfolio…</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {form.efiProfile.links.map((link, idx) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveLink(link.id, 'up')}
                        disabled={idx === 0}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-20 transition-colors"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => moveLink(link.id, 'down')}
                        disabled={idx === form.efiProfile.links.length - 1}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-20 transition-colors"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                      placeholder="Etiqueta"
                      className="w-32 shrink-0 bg-transparent border border-[var(--color-border)] rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                      placeholder="https://…"
                      className="flex-1 bg-transparent border border-[var(--color-border)] rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                    <button
                      onClick={() => removeLink(link.id)}
                      className="text-[var(--color-text-secondary)] hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>

          {/* ── PDF / Dossier ──────────────────────────────────────────────── */}
          <SurfaceCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                Documento (PDF)
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              Sube tu dossier, media kit o portafolio en PDF. Aparecerá como un botón en tu página.
            </p>

            {form.efiProfile.pdf_url ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                  <FilePdf size={20} className="text-[var(--color-text-secondary)] shrink-0" />
                  <span className="text-sm flex-1 truncate text-[var(--color-text-secondary)]">
                    PDF subido
                  </span>
                  <a
                    href={form.efiProfile.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                  >
                    <ArrowSquareOut size={14} />
                  </a>
                  <button
                    onClick={removePdf}
                    className="text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                  >
                    <Trash size={14} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                    Texto del botón
                  </label>
                  <input
                    type="text"
                    value={form.efiProfile.pdf_label}
                    onChange={(e) => patchEfi({ pdf_label: e.target.value })}
                    placeholder="Ver mi media kit"
                    className="w-full bg-transparent border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePdfFile(file);
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={pdfUploading || !uploadsEnabled}
                  className={cx(
                    'w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-[var(--color-border)] transition-colors',
                    uploadsEnabled
                      ? 'hover:border-[var(--color-accent)] cursor-pointer'
                      : 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {pdfUploading ? (
                    <CircleNotch size={20} className="animate-spin text-[var(--color-text-secondary)]" />
                  ) : (
                    <FilePdf size={20} className="text-[var(--color-text-secondary)]" />
                  )}
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {pdfUploading
                      ? 'Subiendo…'
                      : uploadsEnabled
                      ? 'Subir PDF (máx. 20 MB)'
                      : 'Almacenamiento no configurado'}
                  </span>
                </button>
              </div>
            )}
          </SurfaceCard>

        </div>
      </div>
    </div>
  );
}
