import React from 'react';
import type { MediaKitProfile, SocialProfiles } from '@shared';
import ImageUpload from '../ImageUpload';
import { fieldClass, labelClass, isComponentEnabled, getHiddenComponents } from './block-styles';
import { ComponentSection, AddComponentBar } from './ComponentSection';

const socialProfileFields: Array<{ key: keyof SocialProfiles; label: string }> = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'x', label: 'X' },
  { key: 'threads', label: 'Threads' },
  { key: 'youtube', label: 'YouTube' },
];

interface IdentityBlockProps {
  name: string;
  handle: string;
  avatar: string;
  socialProfiles: SocialProfiles;
  mediaKit: Pick<MediaKitProfile, 'periodLabel' | 'updatedLabel' | 'tagline' | 'contactEmail'>;
  accentHex: string;
  uploadsEnabled: boolean;
  socialDropdown: keyof SocialProfiles | null;
  enabledComponents?: string[];
  onNameChange: (value: string) => void;
  onHandleChange: (value: string) => void;
  onAvatarChange: (url: string) => void;
  onSocialChange: (key: keyof SocialProfiles, value: string) => void;
  onSocialDropdownChange: (key: keyof SocialProfiles | null) => void;
  onMediaKitChange: (key: 'periodLabel' | 'updatedLabel' | 'tagline' | 'contactEmail', value: string) => void;
  onAddComponent?: (key: string) => void;
  onRemoveComponent?: (key: string) => void;
}

export default function IdentityBlock({
  name,
  handle,
  avatar,
  socialProfiles,
  mediaKit,
  accentHex,
  uploadsEnabled,
  socialDropdown,
  enabledComponents,
  onNameChange,
  onHandleChange,
  onAvatarChange,
  onSocialChange,
  onSocialDropdownChange,
  onMediaKitChange,
  onAddComponent,
  onRemoveComponent,
}: IdentityBlockProps) {
  const hidden = getHiddenComponents('identity', enabledComponents);

  return (
    <div className="grid gap-5">
      {/* Name + Handle — always shown */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Nombre</label>
          <input
            value={name || ''}
            onChange={(e) => onNameChange(e.target.value)}
            className={fieldClass}
            style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
            placeholder="Nombre artístico o profesional"
          />
        </div>
        <div>
          <label className={labelClass}>Handle</label>
          <input
            value={handle || ''}
            onChange={(e) => onHandleChange(e.target.value)}
            className={fieldClass}
            style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
            placeholder="@tuusuario"
          />
        </div>
      </div>

      {/* Avatar */}
      {isComponentEnabled('avatar', enabledComponents) && (
        <ComponentSection label="Foto de perfil" onRemove={() => onRemoveComponent?.('avatar')}>
          <ImageUpload
            value={avatar || ''}
            onChange={onAvatarChange}
            category="avatar"
            accentColor={accentHex}
            uploadsEnabled={uploadsEnabled}
            aspectRatio="aspect-square"
            placeholder="Subir avatar"
            className={!uploadsEnabled ? '' : 'max-w-[160px]'}
          />
        </ComponentSection>
      )}

      {/* Tagline */}
      {isComponentEnabled('tagline', enabledComponents) && (
        <ComponentSection label="Tagline" onRemove={() => onRemoveComponent?.('tagline')}>
          <input
            value={mediaKit.tagline || ''}
            onChange={(e) => onMediaKitChange('tagline', e.target.value)}
            className={fieldClass}
            style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
            placeholder="Humor, estilo, verticales o posicionamiento"
          />
        </ComponentSection>
      )}

      {/* Contact email */}
      {isComponentEnabled('contact_email', enabledComponents) && (
        <ComponentSection label="Email de contacto" onRemove={() => onRemoveComponent?.('contact_email')}>
          <input
            value={mediaKit.contactEmail || ''}
            onChange={(e) => onMediaKitChange('contactEmail', e.target.value)}
            className={fieldClass}
            style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
            placeholder="contacto@..."
          />
        </ComponentSection>
      )}

      {/* Social profiles */}
      {isComponentEnabled('social_profiles', enabledComponents) && (
        <ComponentSection label="Redes sociales" onRemove={() => onRemoveComponent?.('social_profiles')}>
          <div className="grid gap-4 sm:grid-cols-2">
            {socialProfileFields.map((field) => (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                <div className="relative">
                  <input
                    value={socialProfiles?.[field.key] || ''}
                    onChange={(e) => onSocialChange(field.key, e.target.value)}
                    onFocus={() => {
                      if (!socialProfiles?.[field.key] && handle?.trim()) {
                        onSocialDropdownChange(field.key);
                      }
                    }}
                    onBlur={() => onSocialDropdownChange(null)}
                    className={fieldClass}
                    style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                    placeholder=""
                  />
                  {socialDropdown === field.key &&
                    (() => {
                      const cleanHandle = (handle || '').trim().replace(/^@/, '');
                      return cleanHandle ? (
                        <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-[var(--line-soft)] bg-[var(--surface-card)] shadow-lg">
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              onSocialChange(field.key, `@${cleanHandle}`);
                              onSocialDropdownChange(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--surface-muted)]"
                          >
                            <span className="font-bold" style={{ color: accentHex }}>
                              @{cleanHandle}
                            </span>
                          </button>
                        </div>
                      ) : null;
                    })()}
                </div>
              </div>
            ))}
          </div>
        </ComponentSection>
      )}

      {/* Dates */}
      {isComponentEnabled('dates', enabledComponents) && (
        <ComponentSection label="Período / Actualización" onRemove={() => onRemoveComponent?.('dates')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Título / Período</label>
              <input
                value={mediaKit.periodLabel || ''}
                onChange={(e) => onMediaKitChange('periodLabel', e.target.value)}
                className={fieldClass}
                style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                placeholder="Media Kit 2026"
              />
            </div>
            <div>
              <label className={labelClass}>Texto de actualización</label>
              <input
                value={mediaKit.updatedLabel || ''}
                onChange={(e) => onMediaKitChange('updatedLabel', e.target.value)}
                className={fieldClass}
                style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                placeholder="Marzo 2026"
              />
            </div>
          </div>
        </ComponentSection>
      )}

      <AddComponentBar available={hidden} onAdd={(key) => onAddComponent?.(key)} />
    </div>
  );
}
