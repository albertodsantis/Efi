import { LightningIcon as Lightning, TrophyIcon as Trophy } from '@phosphor-icons/react';
import type { BadgeKey, EfisystemSnapshot } from '@shared';

// ── Level config ──────────────────────────────────────────────

const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 200,
  3: 600,
  4: 1200,
  5: 2500,
  6: 4500,
  7: 7000,
  8: 10500,
  9: 15000,
  10: 20000,
};

const LEVEL_LABELS: Record<number, string> = {
  1: 'Emergente',
  2: 'Explorer',
  3: 'Vibing',
  4: 'Máquina',
  5: 'Crack',
  6: 'Master',
  7: 'Élite',
  8: 'Authority',
  9: 'Ícono',
  10: 'Leyenda',
};

function getThresholds(level: number): { current: number; next: number } {
  const current = LEVEL_THRESHOLDS[level] ?? 0;
  const nextLevel = Math.min(level + 1, 10);
  const next = LEVEL_THRESHOLDS[nextLevel] ?? LEVEL_THRESHOLDS[10];
  return { current, next };
}

// ── Badge preview config ──────────────────────────────────────
// Ordered list of all badges — used to render the preview row in the same
// canonical order regardless of unlock order.

const BADGE_ORDER: BadgeKey[] = [
  'perfil_estelar',
  'vision_clara',
  'motor_de_ideas',
  'circulo_intimo',
  'promesa_cumplida',
  'negocio_en_marcha',
  'directorio_dorado',
  'creador_imparable',
  'lluvia_de_billetes',
];

// A compact accent color per badge used for the preview dot glow.
const BADGE_DOT_COLOR: Record<BadgeKey, string> = {
  perfil_estelar:    '#d49840',
  vision_clara:      '#c87848',
  motor_de_ideas:    '#b8b8c8',
  circulo_intimo:    '#f8d040',
  promesa_cumplida:  '#f0c0b0',
  negocio_en_marcha: '#e0e0f8',
  directorio_dorado: '#687080',
  creador_imparable: '#8b78ff',
  lluvia_de_billetes:'#ff9548',
};

// ── Component ─────────────────────────────────────────────────

interface Props {
  efisystem: EfisystemSnapshot;
  accentHex: string;
  onOpenBadges?: () => void;
}

export default function EfisystemWidget({ efisystem, accentHex, onOpenBadges }: Props) {
  const { totalPoints, currentLevel, unlockedBadges } = efisystem;
  const { current: currentThreshold, next: nextThreshold } = getThresholds(currentLevel);
  const isMaxLevel = currentLevel >= 10;

  const progressPct = isMaxLevel
    ? 100
    : Math.min(
        100,
        ((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100,
      );

  const unlockedCount = unlockedBadges.length;
  const totalBadges = BADGE_ORDER.length;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Lightning size={18} weight="fill" style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
          <span className="text-sm font-semibold text-(--text-primary) truncate">
            Nivel {currentLevel} · {LEVEL_LABELS[currentLevel]}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Lightning size={14} weight="fill" style={{ color: 'var(--accent-color)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--accent-color)' }}>
            {totalPoints.toLocaleString('es')}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-2 rounded-full bg-(--surface-muted) overflow-hidden" style={{ boxShadow: `0 0 0 1px ${accentHex}33` }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: 'var(--accent-color)' }}
          />
        </div>
        {!isMaxLevel && (
          <div className="mt-1 flex justify-between text-[11px] text-(--text-tertiary)">
            <span>{totalPoints.toLocaleString('es')} pts</span>
            <span>{nextThreshold.toLocaleString('es')} pts · {LEVEL_LABELS[currentLevel + 1]}</span>
          </div>
        )}
      </div>

      {/* Badge preview row */}
      {onOpenBadges && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onOpenBadges}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: `linear-gradient(135deg, ${accentHex}18 0%, ${accentHex}2a 100%)`,
              border: `1px solid ${accentHex}30`,
            }}
          >
            {/* Badge dots */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {BADGE_ORDER.map((key) => {
                const isUnlocked = unlockedBadges.includes(key);
                const color = BADGE_DOT_COLOR[key];
                return (
                  <div
                    key={key}
                    className="h-3 w-3 rounded-full shrink-0 transition-all duration-300"
                    style={
                      isUnlocked
                        ? {
                            background: color,
                            boxShadow: `0 0 5px ${color}cc`,
                          }
                        : {
                            background: `${accentHex}20`,
                            border: `1px solid ${accentHex}25`,
                          }
                    }
                  />
                );
              })}
            </div>

            {/* Label + trophy */}
            <div className="flex items-center gap-1 shrink-0">
              <Trophy size={12} weight="fill" style={{ color: accentHex }} />
              <span
                className="text-[11px] font-bold"
                style={{ color: accentHex }}
              >
                {unlockedCount}/{totalBadges}
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
