import React, { useEffect, useRef, useState } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  accentHex?: string;
}

export default function EmojiPicker({ value, onChange, accentHex }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-[52px] w-[52px] items-center justify-center rounded-[1rem] border border-[color:var(--line-soft)] bg-[var(--surface-card-strong)] text-2xl transition-all hover:border-[color:var(--accent-border)] focus:outline-none focus:ring-2"
        style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
        aria-label="Elegir emoji"
        title="Elegir emoji"
      >
        {value || '🏢'}
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50">
          <Picker
            data={data}
            onEmojiSelect={(emoji: { native: string }) => {
              onChange(emoji.native);
              setOpen(false);
            }}
            locale="es"
            theme="auto"
            previewPosition="none"
            skinTonePosition="none"
            navPosition="bottom"
            perLine={8}
            maxFrequentRows={2}
          />
        </div>
      )}
    </div>
  );
}
