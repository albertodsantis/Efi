import React, { useEffect, useRef, useState } from 'react';
import {
  Cookie,
  DotsThreeVertical,
  FileText,
  Question,
  ShieldCheck,
} from '@phosphor-icons/react';
import { cx } from './ui';
import type { LegalPage } from './LegalModal';

const menuItems: Array<{
  key: LegalPage;
  label: string;
  icon: React.ElementType;
  dividerBefore?: boolean;
}> = [
  { key: 'privacy', label: 'Política de Privacidad', icon: ShieldCheck },
  { key: 'terms', label: 'Términos y Condiciones', icon: FileText },
  { key: 'cookies', label: 'Política de Cookies', icon: Cookie },
  { key: 'faq', label: 'Preguntas Frecuentes', icon: Question, dividerBefore: true },
];

export default function MoreOptionsMenu({ onSelect }: { onSelect: (page: LegalPage) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative ml-auto self-center shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Más opciones"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cx(
          'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
          isOpen
            ? 'bg-[var(--surface-card-strong)] text-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-card-strong)] hover:text-[var(--text-primary)]',
        )}
      >
        <DotsThreeVertical size={18} weight="bold" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[130] mt-1.5 min-w-[220px] origin-top-right rounded-[1rem] border bg-[var(--surface-card-strong)] shadow-[var(--shadow-floating)] [border-color:var(--line-soft)] animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="p-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={item.key}>
                  {item.dividerBefore && (
                    <div className="my-1 border-t [border-color:var(--line-soft)]" />
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      onSelect(item.key);
                    }}
                    className="flex w-full items-center gap-3 rounded-[0.75rem] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-card)]"
                  >
                    <Icon size={15} weight="regular" className="shrink-0 text-[var(--text-secondary)]" />
                    {item.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
