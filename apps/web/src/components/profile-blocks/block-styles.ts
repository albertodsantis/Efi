export const fieldClass =
  'w-full rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-card-strong)] px-4 py-3.5 text-base sm:text-sm font-medium text-[var(--text-primary)] transition-all placeholder:text-[var(--text-secondary)]/70 focus:outline-none focus:ring-2';

export const textareaClass = `${fieldClass} min-h-[116px] resize-y leading-6`;

export const labelClass =
  'mb-2 block text-[11px] font-bold tracking-[0.16em] text-[var(--text-secondary)]/80 uppercase';

export function safeArr(val: unknown): any[] {
  return Array.isArray(val) ? val : [];
}
