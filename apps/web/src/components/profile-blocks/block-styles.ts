// ─── Component catalog ───────────────────────────────────────────────────────

export interface ComponentMeta {
  key: string;
  label: string;
}

export const BLOCK_COMPONENT_CATALOG: Partial<Record<string, ComponentMeta[]>> = {
  identity: [
    { key: 'avatar',          label: 'Foto de perfil' },
    { key: 'tagline',         label: 'Tagline' },
    { key: 'contact_email',   label: 'Email de contacto' },
    { key: 'social_profiles', label: 'Redes sociales' },
    { key: 'dates',           label: 'Período / Actualización' },
  ],
  about: [
    { key: 'featured_image', label: 'Imagen principal' },
    { key: 'bio',            label: 'Presentación' },
    { key: 'tags',           label: 'Tags' },
  ],
  metrics: [
    { key: 'insight_stats',    label: 'Estadísticas principales' },
    { key: 'audience_gender',  label: 'Audiencia' },
    { key: 'age_distribution', label: 'Rangos de edad' },
    { key: 'top_countries',    label: 'Top países' },
  ],
  services: [
    { key: 'services_header', label: 'Descripción del servicio' },
    { key: 'offerings',       label: 'Paquetes y tarifas' },
  ],
  closing: [
    { key: 'closing_text', label: 'Título y descripción' },
    { key: 'footer_note',  label: 'Texto del footer' },
  ],
};

/** undefined enabledComponents means all components are enabled. */
export function isComponentEnabled(key: string, enabledComponents: string[] | undefined): boolean {
  return enabledComponents === undefined || enabledComponents.includes(key);
}

export function getHiddenComponents(blockType: string, enabledComponents: string[] | undefined): ComponentMeta[] {
  const catalog = BLOCK_COMPONENT_CATALOG[blockType] ?? [];
  if (enabledComponents === undefined) return [];
  return catalog.filter((c) => !enabledComponents.includes(c.key));
}

// ─── Styles ──────────────────────────────────────────────────────────────────

export const fieldClass =
  'w-full rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-card-strong)] px-4 py-3.5 text-base sm:text-sm font-medium text-[var(--text-primary)] transition-all placeholder:text-[var(--text-secondary)]/70 focus:outline-none focus:ring-2';

export const textareaClass = `${fieldClass} min-h-[116px] resize-y leading-6`;

export const labelClass =
  'mb-2 block text-[11px] font-bold tracking-[0.16em] text-[var(--text-secondary)]/80 uppercase';

export function safeArr(val: unknown): any[] {
  return Array.isArray(val) ? val : [];
}
