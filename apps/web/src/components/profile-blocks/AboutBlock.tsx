import React from 'react';
import { Plus, Trash, X } from '@phosphor-icons/react';
import type { MediaKitProfile } from '@shared';
import ImageUpload from '../ImageUpload';
import { fieldClass, textareaClass, labelClass, safeArr, isComponentEnabled, getHiddenComponents } from './block-styles';
import { ComponentSection, AddComponentBar } from './ComponentSection';

interface AboutBlockProps {
  mediaKit: Pick<MediaKitProfile, 'featuredImage' | 'aboutTitle' | 'aboutParagraphs' | 'topicTags'>;
  accentHex: string;
  uploadsEnabled: boolean;
  enabledComponents?: string[];
  onFeaturedImageChange: (url: string) => void;
  onAboutTitleChange: (value: string) => void;
  onParagraphChange: (index: number, value: string) => void;
  onAddParagraph: () => void;
  onRemoveParagraph: (index: number) => void;
  onTagChange: (index: number, value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (index: number) => void;
  onAddComponent?: (key: string) => void;
  onRemoveComponent?: (key: string) => void;
}

export default function AboutBlock({
  mediaKit,
  accentHex,
  uploadsEnabled,
  enabledComponents,
  onFeaturedImageChange,
  onAboutTitleChange,
  onParagraphChange,
  onAddParagraph,
  onRemoveParagraph,
  onTagChange,
  onAddTag,
  onRemoveTag,
  onAddComponent,
  onRemoveComponent,
}: AboutBlockProps) {
  const hidden = getHiddenComponents('about', enabledComponents);

  return (
    <div className="grid gap-5">
      {/* Featured image */}
      {isComponentEnabled('featured_image', enabledComponents) && (
        <ComponentSection label="Imagen principal" onRemove={() => onRemoveComponent?.('featured_image')}>
          <ImageUpload
            value={mediaKit.featuredImage || ''}
            onChange={onFeaturedImageChange}
            category="media-kit"
            accentColor={accentHex}
            uploadsEnabled={uploadsEnabled}
            aspectRatio="aspect-video"
            placeholder="Subir portada"
          />
        </ComponentSection>
      )}

      {/* Bio: title + paragraphs */}
      {isComponentEnabled('bio', enabledComponents) && (
        <ComponentSection label="Presentación" onRemove={() => onRemoveComponent?.('bio')}>
          <div className="grid gap-4">
            <div>
              <label className={labelClass}>Título de presentación</label>
              <input
                value={mediaKit.aboutTitle || ''}
                onChange={(e) => onAboutTitleChange(e.target.value)}
                className={fieldClass}
                style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                placeholder="Hola! Soy..."
              />
            </div>
            <div className="space-y-4">
              {safeArr(mediaKit.aboutParagraphs).map((paragraph: any, index: number) => (
                <div key={index} className="group relative">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[11px] font-bold tracking-[0.16em] text-[var(--text-secondary)]/80 uppercase">
                      Párrafo {index + 1}
                    </label>
                    <button
                      type="button"
                      onClick={() => onRemoveParagraph(index)}
                      className="text-[var(--text-secondary)] opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  <textarea
                    value={typeof paragraph === 'string' ? paragraph : ''}
                    onChange={(e) => onParagraphChange(index, e.target.value)}
                    className={textareaClass}
                    style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                    placeholder="Habla de ti, de tus proyectos y servicios."
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={onAddParagraph}
                className="mt-2 flex items-center gap-1.5 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                <Plus size={14} weight="regular" /> Añadir párrafo
              </button>
            </div>
          </div>
        </ComponentSection>
      )}

      {/* Tags */}
      {isComponentEnabled('tags', enabledComponents) && (
        <ComponentSection label="Tags" onRemove={() => onRemoveComponent?.('tags')}>
          <div className="grid gap-4 sm:grid-cols-2">
            {safeArr(mediaKit.topicTags).map((tag: any, index: number) => (
              <div key={index} className="group relative">
                <input
                  value={typeof tag === 'string' ? tag : ''}
                  onChange={(e) => onTagChange(index, e.target.value)}
                  className={fieldClass}
                  style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                  placeholder={`#Tag${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => onRemoveTag(index)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
                >
                  <X size={14} weight="regular" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onAddTag}
            className="mt-3 flex items-center gap-1.5 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <Plus size={14} weight="regular" /> Añadir tag
          </button>
        </ComponentSection>
      )}

      <AddComponentBar available={hidden} onAdd={(key) => onAddComponent?.(key)} />
    </div>
  );
}
