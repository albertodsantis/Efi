import React, { useState } from 'react';
import { Check, Minus, Sparkle } from '@phosphor-icons/react';
import type { BillingPeriod } from '@shared';
import { PLAN_FEATURES, PLAN_PRICING } from '@shared';
import OverlayModal from './OverlayModal';
import { Button, ModalPanel, StatusBadge, cx } from './ui';

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [period, setPeriod] = useState<BillingPeriod>('annual');

  const displayPrice =
    period === 'monthly'
      ? `US$${PLAN_PRICING.monthly.toFixed(0)}`
      : `US$${PLAN_PRICING.annualMonthlyEquivalent.toFixed(2)}`;
  const periodLabel = period === 'monthly' ? '/ mes' : '/ mes, facturado anual';
  const annualTotal = `US$${PLAN_PRICING.annual.toFixed(0)} por año`;

  return (
    <OverlayModal onClose={onClose}>
      <ModalPanel
        title="Cambia a Pro"
        description="Durante el acceso anticipado, todos los usuarios disfrutan Pro sin costo. Cuando activemos los pagos, estas serán las condiciones."
        onClose={onClose}
        size="lg"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 rounded-2xl border [border-color:var(--line-soft)] bg-[var(--surface-muted)]/60 p-5">
            <div className="inline-flex rounded-full border [border-color:var(--line-soft)] bg-[var(--surface-card-strong)] p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setPeriod('monthly')}
                className={cx(
                  'rounded-full px-4 py-2 text-xs font-bold tracking-[0.14em] uppercase transition-colors',
                  period === 'monthly'
                    ? 'bg-[var(--accent-solid)] text-white shadow-sm'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-muted)]',
                )}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setPeriod('annual')}
                className={cx(
                  'relative rounded-full px-4 py-2 text-xs font-bold tracking-[0.14em] uppercase transition-colors',
                  period === 'annual'
                    ? 'bg-[var(--accent-solid)] text-white shadow-sm'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-muted)]',
                )}
              >
                Anual
                <span
                  className={cx(
                    'ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-normal',
                    period === 'annual'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-500/15 text-emerald-600',
                  )}
                >
                  -{PLAN_PRICING.annualDiscountPct}%
                </span>
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {displayPrice}
              </span>
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {periodLabel}
              </span>
            </div>
            {period === 'annual' ? (
              <p className="text-xs font-medium text-[var(--text-secondary)]">{annualTotal}</p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border [border-color:var(--line-soft)]">
            <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b [border-color:var(--line-soft)] bg-[var(--surface-muted)]/50 px-4 py-3 text-[11px] font-bold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
              <span>Funcionalidad</span>
              <span className="text-center">Free</span>
              <span className="flex items-center justify-center gap-1 text-[var(--accent-solid)]">
                <Sparkle size={14} weight="fill" /> Pro
              </span>
            </div>
            {PLAN_FEATURES.map((row, idx) => (
              <div
                key={row.label}
                className={cx(
                  'grid grid-cols-[1.4fr_1fr_1fr] items-center px-4 py-3 text-sm',
                  idx !== PLAN_FEATURES.length - 1 && 'border-b [border-color:var(--line-soft)]',
                )}
              >
                <span className="font-medium text-[var(--text-primary)]">{row.label}</span>
                <span className="flex items-center justify-center text-sm text-[var(--text-secondary)]">
                  {renderCell(row.free)}
                </span>
                <span className="flex items-center justify-center text-sm font-semibold text-[var(--text-primary)]">
                  {renderCell(row.pro)}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border [border-color:var(--line-soft)] bg-[var(--surface-muted)]/40 p-4 text-center">
            <StatusBadge tone="success">Acceso anticipado</StatusBadge>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Estás disfrutando todas las funciones Pro de forma gratuita mientras Efi está en acceso anticipado. Te avisaremos con tiempo antes de activar los pagos.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <Button tone="secondary" onClick={onClose}>Cerrar</Button>
          <Button tone="primary" disabled>
            Próximamente
          </Button>
        </div>
      </ModalPanel>
    </OverlayModal>
  );
}

function renderCell(value: string | boolean) {
  if (value === true) return <Check size={18} weight="bold" className="text-emerald-500" />;
  if (value === false) return <Minus size={18} weight="bold" className="text-[var(--text-secondary)]/60" />;
  return <span>{value}</span>;
}
