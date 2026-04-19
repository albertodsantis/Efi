export type PlanId = 'free' | 'pro';

export type BillingPeriod = 'monthly' | 'annual';

export interface PlanLimits {
  maxPartners: number | null;
  maxActiveTasks: number | null;
  aiAssistant: boolean;
  googleCalendarSync: boolean;
  customBranding: boolean;
  exportData: boolean;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxPartners: 10,
    maxActiveTasks: 20,
    aiAssistant: false,
    googleCalendarSync: false,
    customBranding: false,
    exportData: false,
  },
  pro: {
    maxPartners: null,
    maxActiveTasks: null,
    aiAssistant: true,
    googleCalendarSync: true,
    customBranding: true,
    exportData: true,
  },
};

export interface PlanPricing {
  currency: 'USD';
  monthly: number;
  annual: number;
  annualMonthlyEquivalent: number;
  annualDiscountPct: number;
}

export const PLAN_PRICING: PlanPricing = {
  currency: 'USD',
  monthly: 9,
  annual: 86,
  annualMonthlyEquivalent: 7.17,
  annualDiscountPct: 20,
};

export interface PlanFeatureRow {
  label: string;
  free: string | boolean;
  pro: string | boolean;
}

export const PLAN_FEATURES: PlanFeatureRow[] = [
  { label: 'Socios en Directorio', free: '10', pro: 'Ilimitados' },
  { label: 'Entregas activas en Pipeline', free: '20', pro: 'Ilimitadas' },
  { label: 'Asistente IA (Gemini)', free: false, pro: true },
  { label: 'Sincronización con Google Calendar', free: false, pro: true },
  { label: 'EfiLink personalizable', free: true, pro: true },
  { label: 'Estrategia y Objetivos', free: true, pro: true },
  { label: 'Branding personalizado', free: false, pro: true },
  { label: 'Exportar datos', free: false, pro: true },
];

export interface PlanState {
  plan: PlanId;
  trialEndsAt: string | null;
  subscribedUntil: string | null;
  earlyAccess: boolean;
}

export function isPro(state: PlanState, now: Date = new Date()): boolean {
  if (state.earlyAccess) return true;
  if (state.plan !== 'pro') return false;
  if (state.subscribedUntil && new Date(state.subscribedUntil) > now) return true;
  if (state.trialEndsAt && new Date(state.trialEndsAt) > now) return true;
  return false;
}

export function trialDaysRemaining(state: PlanState, now: Date = new Date()): number | null {
  if (!state.trialEndsAt) return null;
  const end = new Date(state.trialEndsAt).getTime();
  const diffMs = end - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
