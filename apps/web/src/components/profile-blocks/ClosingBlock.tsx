import React from 'react';
import type { MediaKitProfile } from '@shared';
import { fieldClass, textareaClass, labelClass } from './block-styles';

interface ClosingBlockProps {
  mediaKit: Pick<MediaKitProfile, 'closingTitle' | 'closingDescription' | 'footerNote'>;
  accentHex: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onFooterNoteChange: (value: string) => void;
}

export default function ClosingBlock({
  mediaKit,
  accentHex,
  onTitleChange,
  onDescriptionChange,
  onFooterNoteChange,
}: ClosingBlockProps) {
  return (
    <div className="grid gap-4">
      <div>
        <label className={labelClass}>Titulo del cierre</label>
        <input
          value={mediaKit.closingTitle || ''}
          onChange={(e) => onTitleChange(e.target.value)}
          className={fieldClass}
          style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
          placeholder=""
        />
      </div>
      <div>
        <label className={labelClass}>Descripcion del cierre</label>
        <textarea
          value={mediaKit.closingDescription || ''}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className={textareaClass}
          style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
          placeholder=""
        />
      </div>
      <div>
        <label className={labelClass}>Texto del footer</label>
        <input
          value={mediaKit.footerNote || ''}
          onChange={(e) => onFooterNoteChange(e.target.value)}
          className={fieldClass}
          style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
          placeholder=""
        />
      </div>
    </div>
  );
}
