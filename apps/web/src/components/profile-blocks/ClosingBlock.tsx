import React from 'react';
import type { MediaKitProfile } from '@shared';
import { fieldClass, textareaClass, labelClass, isComponentEnabled, getHiddenComponents } from './block-styles';
import { ComponentSection, AddComponentBar } from './ComponentSection';

interface ClosingBlockProps {
  mediaKit: Pick<MediaKitProfile, 'closingTitle' | 'closingDescription' | 'footerNote'>;
  accentHex: string;
  enabledComponents?: string[];
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onFooterNoteChange: (value: string) => void;
  onAddComponent?: (key: string) => void;
  onRemoveComponent?: (key: string) => void;
}

export default function ClosingBlock({
  mediaKit,
  accentHex,
  enabledComponents,
  onTitleChange,
  onDescriptionChange,
  onFooterNoteChange,
  onAddComponent,
  onRemoveComponent,
}: ClosingBlockProps) {
  const hidden = getHiddenComponents('closing', enabledComponents);

  return (
    <div className="grid gap-5">
      {isComponentEnabled('closing_text', enabledComponents) && (
        <ComponentSection label="Título y descripción" onRemove={() => onRemoveComponent?.('closing_text')}>
          <div className="grid gap-4">
            <div>
              <label className={labelClass}>Título del cierre</label>
              <input
                value={mediaKit.closingTitle || ''}
                onChange={(e) => onTitleChange(e.target.value)}
                className={fieldClass}
                style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                placeholder=""
              />
            </div>
            <div>
              <label className={labelClass}>Descripción del cierre</label>
              <textarea
                value={mediaKit.closingDescription || ''}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className={textareaClass}
                style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
                placeholder=""
              />
            </div>
          </div>
        </ComponentSection>
      )}

      {isComponentEnabled('footer_note', enabledComponents) && (
        <ComponentSection label="Texto del footer" onRemove={() => onRemoveComponent?.('footer_note')}>
          <input
            value={mediaKit.footerNote || ''}
            onChange={(e) => onFooterNoteChange(e.target.value)}
            className={fieldClass}
            style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
            placeholder=""
          />
        </ComponentSection>
      )}

      <AddComponentBar available={hidden} onAdd={(key) => onAddComponent?.(key)} />
    </div>
  );
}
