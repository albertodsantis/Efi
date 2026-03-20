import React from 'react';
import { createPortal } from 'react-dom';

export default function OverlayModal({
  children,
  tone = 'black',
  onClose,
}: {
  children: React.ReactNode;
  tone?: 'black' | 'slate';
  onClose?: () => void;
}) {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[120] flex items-end justify-center px-0 sm:px-6 backdrop-blur-sm sm:items-center ${
        tone === 'slate' ? 'bg-slate-900/40' : 'bg-black/40 dark:bg-black/60'
      }`}
      onClick={() => onClose?.()}
    >
      <div
        className="pointer-events-auto relative flex w-full justify-center pb-[env(safe-area-inset-bottom,0px)] sm:w-auto sm:max-w-[min(960px,100%)] sm:pb-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center sm:hidden">
          <span className="h-1.5 w-12 rounded-full bg-slate-300/80 dark:bg-slate-600/90" />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
