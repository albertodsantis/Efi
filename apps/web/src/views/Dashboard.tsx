import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDot,
  CheckCircle,
  CaretLeft,
  CaretRight,
  Clock,
  Lock,
  Star,
  Eye,
  Users,
  TrophyIcon as Trophy,
  Medal,
  Rocket,
  CurrencyDollar,
  Money,
  Target,
  X,
  // Nuevos para placas
  PencilSimpleLine,
  UserPlus,
  Compass,
  Palette,
  Stack,
  Sun,
  Moon,
  CheckSquare,
  Lightning,
  Leaf,
  UsersThree,
  Flame,
  CalendarCheck,
  Crown,
  SealCheck,
  Question,
  CalendarHeart,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { EmptyState, StatusBadge, SurfaceCard, cx } from '../components/ui';
import { toast } from '../lib/toast';
import type { BadgeKey, Task, TaskStatus } from '@shared/domain';
import type { Locale } from '@shared';
import { formatLocalDateISO, parseLocalDate, startOfLocalDay } from '../lib/date';
import EfisystemWidget from '../components/EfisystemWidget';
import LevelsModal from '../components/LevelsModal';
import { hapticSuccess } from '../lib/haptics';

const localeToBcp47 = (locale: Locale): string => (locale === 'en' ? 'en-US' : 'es-ES');

/* ── constants ──────────────────────────────────────────────── */

const ALL_PIPELINE_STATUSES: TaskStatus[] = [
  'Pendiente',
  'En Progreso',
  'En Revisión',
  'Completada',
  'Cobrado',
];

const statusToneMap: Record<TaskStatus, 'warning' | 'info' | 'review' | 'success' | 'neutral'> = {
  Pendiente: 'warning',
  'En Progreso': 'info',
  'En Revisión': 'review',
  Completada: 'success',
  Cobrado: 'neutral',
};

const pipelineBarColors: Record<TaskStatus, string> = {
  Pendiente: '#d97706',
  'En Progreso': '#2563eb',
  'En Revisión': '#7c3aed',
  Completada: '#059669',
  Cobrado: '#64748b',
};

const formatCurrency = (v: number, locale: Locale = 'es') =>
  `$${v.toLocaleString(localeToBcp47(locale))}`;

const formatTaskDate = (task: Task, locale: Locale = 'es') =>
  parseLocalDate(task.dueDate).toLocaleDateString(localeToBcp47(locale), {
    day: '2-digit',
    month: 'short',
  });

/* ── GoalsMarquee ───────────────────────────────────────────── */

function GoalsMarquee({ goals, accentHex, accentGradient }: { goals: string[]; accentHex: string; accentGradient: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);
  const dragRef = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let animationId: number;
    let scrollPos = el.scrollLeft;
    const speed = 0.117;

    const scroll = () => {
      if (!isInteractingRef.current) {
        scrollPos += speed;
        const maxScroll = el.scrollWidth / 2;
        if (scrollPos >= maxScroll) scrollPos -= maxScroll;
        el.scrollLeft = scrollPos;
      } else {
        scrollPos = el.scrollLeft;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isInteractingRef.current = true;
    if (e.pointerType === 'mouse') {
      dragRef.current.isDragging = true;
      dragRef.current.startX = e.pageX;
      dragRef.current.scrollLeft = containerRef.current?.scrollLeft || 0;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.isDragging || !containerRef.current) return;
    e.preventDefault();
    containerRef.current.scrollLeft =
      dragRef.current.scrollLeft - (e.pageX - dragRef.current.startX) * 1.5;
  };

  const handlePointerUp = () => {
    dragRef.current.isDragging = false;
    isInteractingRef.current = false;
  };

  const displayGoals = useMemo(() => Array(30).fill(goals).flat(), [goals]);

  return (
    <div className="relative flex items-center overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <div
        ref={containerRef}
        className="hide-scrollbar flex w-full cursor-grab select-none items-center gap-16 overflow-x-auto px-4 active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onMouseEnter={() => (isInteractingRef.current = true)}
      >
        {displayGoals.map((goal, i) => (
          <div key={i} className="flex shrink-0 items-center gap-16">
            <div className="flex items-center gap-3 opacity-80 transition-opacity hover:opacity-100">
              <div
                className="h-1 w-1 shrink-0 rounded-full"
                style={{ background: accentGradient }}
              />
              <span className="text-[13px] font-medium tracking-wide text-[var(--text-secondary)]">
                {goal}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── TaskCard ───────────────────────────────────────────────── */

function TaskCard({
  task,
  partner,
  accentHex,
  onComplete,
}: {
  task: Task;
  partner: { id: string; name: string } | undefined;
  accentHex: string;
  onComplete: (id: string) => void;
}) {
  const { t } = useTranslation('dashboard');
  const { locale } = useAppContext();
  return (
    <div className="group flex items-start gap-3 rounded-[0.85rem] border border-[var(--line-soft)] bg-[var(--surface-card)]/80 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-[13px] font-bold text-[var(--text-primary)]">
            {task.title}
          </h3>
          <StatusBadge tone={statusToneMap[task.status]}>{t(`taskStatus.${task.status}`)}</StatusBadge>
        </div>
        <p className="mt-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
          {partner?.name || t('taskCard.noPartner')} · {formatTaskDate(task, locale)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <p className="text-[13px] font-black text-[var(--text-primary)]">
          {formatCurrency(task.value, locale)}
        </p>
        {task.status !== 'Completada' && task.status !== 'Cobrado' && (
          <button
            type="button"
            onClick={() => void onComplete(task.id)}
            className="flex items-center gap-1 rounded-[0.7rem] bg-[var(--surface-muted)] px-2 py-1 text-[10px] font-bold text-[var(--text-secondary)] transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-400"
          >
            <CheckCircle size={12} />
            {t('taskCard.complete')}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── GoalEffortWidget ──────────────────────────────────────── */

function GoalEffortWidget({
  tasks,
  goals,
  accentHex,
  accentGradient,
}: {
  tasks: Task[];
  goals: any[];
  accentHex: string;
  accentGradient: string;
}) {
  const { t } = useTranslation('dashboard');
  const { locale } = useAppContext();
  const distribution = useMemo(() => {
    const goalMap = new Map<string, { name: string; taskCount: number; value: number }>();
    for (const g of goals) {
      if (g.id && g.generalGoal) {
        goalMap.set(g.id, { name: g.generalGoal, taskCount: 0, value: 0 });
      }
    }

    let unassignedCount = 0;
    let unassignedValue = 0;

    for (const t of tasks) {
      if (t.goalId && goalMap.has(t.goalId)) {
        const entry = goalMap.get(t.goalId)!;
        entry.taskCount++;
        entry.value += t.value;
      } else {
        unassignedCount++;
        unassignedValue += t.value;
      }
    }

    const items = [...goalMap.values()]
      .filter((e) => e.taskCount > 0)
      .sort((a, b) => b.value - a.value);

    return { items, unassignedCount, unassignedValue };
  }, [tasks, goals]);

  const totalTasks = tasks.length;
  if (totalTasks === 0 || distribution.items.length === 0) return null;

  const COLORS = [
    accentHex,
    '#059669',
    '#2563eb',
    '#7c3aed',
    '#d97706',
    '#dc2626',
    '#0891b2',
    '#4f46e5',
  ];

  const allItems = [
    ...distribution.items.map((item, i) => ({
      label: item.name,
      count: item.taskCount,
      value: item.value,
      color: COLORS[i % COLORS.length],
    })),
    ...(distribution.unassignedCount > 0
      ? [{ label: t('goalEffort.noGoal'), count: distribution.unassignedCount, value: distribution.unassignedValue, color: '#94a3b8' }]
      : []),
  ];

  return (
    <SurfaceCard className="p-5 lg:p-6">
      <div className="flex items-center gap-2">
        <Target size={14} className="text-[var(--text-secondary)]" />
        <p className="text-[11px] font-bold tracking-[0.18em] text-[var(--text-secondary)] uppercase">
          {t('goalEffort.title')}
        </p>
      </div>

      {/* Segmented bar */}
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[var(--surface-inset)]">
        {allItems.map((item) => {
          const pct = (item.count / totalTasks) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={item.label}
              className="transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct}%`, backgroundColor: item.color, opacity: 0.82 }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3.5 space-y-2">
        {allItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate font-medium text-[var(--text-primary)]">{item.label}</span>
              <span className="shrink-0 text-[var(--text-secondary)]">({item.count})</span>
            </div>
            <span className="shrink-0 font-bold text-[var(--text-secondary)]">
              ${item.value.toLocaleString(localeToBcp47(locale))}
            </span>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}

/* ── RevenueChart ───────────────────────────────────────────── */

function RevenueChart({
  tasks,
  accentHex,
  accentGradient,
  pipelineHasCobrado,
}: {
  tasks: Task[];
  accentHex: string;
  accentGradient: string;
  pipelineHasCobrado: boolean;
}) {
  const { t } = useTranslation('dashboard');
  const { locale } = useAppContext();
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const collectedLabel = pipelineHasCobrado
    ? t('revenueChart.collected')
    : t('revenueChart.income');

  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      index: i,
      label: new Date(currentYear, i).toLocaleDateString(localeToBcp47(locale), { month: 'short' }),
      projected: 0,
      collected: 0,
    }));

    tasks.forEach((task) => {
      const dueDate = parseLocalDate(task.dueDate);
      if (dueDate.getFullYear() === currentYear) {
        months[dueDate.getMonth()].projected += task.value;
      }

      if (pipelineHasCobrado) {
        if (task.status === 'Cobrado' && task.cobradoAt) {
          const cobradoDate = new Date(task.cobradoAt);
          if (cobradoDate.getFullYear() === currentYear) {
            months[cobradoDate.getMonth()].collected += task.actualPayment ?? task.value;
          }
        }
      } else {
        if (task.status === 'Completada' && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          if (completedDate.getFullYear() === currentYear) {
            months[completedDate.getMonth()].collected += task.actualPayment ?? task.value;
          }
        }
      }
    });

    return months;
  }, [tasks, currentYear, pipelineHasCobrado, locale]);

  const maxValue = Math.max(...monthlyData.flatMap((m) => [m.projected, m.collected]), 1);
  const BAR_HEIGHT = 140;
  const yearProjected = monthlyData.reduce((s, m) => s + m.projected, 0);
  const yearCollected = monthlyData.reduce((s, m) => s + m.collected, 0);

  return (
    <SurfaceCard className="-mx-4 !rounded-none !border-x-0 px-5 py-5 lg:-mx-8 lg:px-8 lg:py-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-[var(--text-secondary)] uppercase">
            {t('revenueChart.yearTitle', { year: currentYear })}
          </p>
          <div className="mt-2 flex items-center gap-4 text-[11px] font-medium text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-[3px]"
                style={{ backgroundColor: `${accentHex}35` }}
              />
              {t('revenueChart.projected')}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-[3px]"
                style={{ background: accentGradient }}
              />
              {collectedLabel}
            </span>
          </div>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--text-secondary)] uppercase">
              {t('revenueChart.projected')}
            </p>
            <p className="text-lg font-black text-[var(--text-primary)]">
              {formatCurrency(yearProjected, locale)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--text-secondary)] uppercase">
              {collectedLabel}
            </p>
            <p className="text-lg font-black" style={{ color: accentHex }}>
              {formatCurrency(yearCollected, locale)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div
        className="relative mt-6 flex items-end gap-1 sm:gap-1.5"
        style={{ height: BAR_HEIGHT + 30 }}
      >
        {monthlyData.map((month) => {
          const projH =
            month.projected > 0
              ? Math.max((month.projected / maxValue) * BAR_HEIGHT, 4)
              : 2;
          const collH =
            month.collected > 0
              ? Math.max((month.collected / maxValue) * BAR_HEIGHT, 4)
              : 2;
          const isCurrent = month.index === currentMonth;
          const isHovered = hoveredMonth === month.index;

          return (
            <div
              key={month.index}
              className="relative flex flex-1 flex-col items-center"
              onMouseEnter={() => setHoveredMonth(month.index)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              {/* Tooltip */}
              {isHovered && (month.projected > 0 || month.collected > 0) && (
                <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-[0.7rem] bg-[var(--surface-card)] px-3 py-2 text-center shadow-lg ring-1 ring-[var(--line-soft)]">
                  <p className="whitespace-nowrap text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                    {month.label} {currentYear}
                  </p>
                  <p className="mt-0.5 whitespace-nowrap text-[11px] font-bold text-[var(--text-primary)]">
                    {formatCurrency(month.projected, locale)} {t('revenueChart.tooltipProjectedSuffix')}
                  </p>
                  <p
                    className="whitespace-nowrap text-[11px] font-bold"
                    style={{ color: accentHex }}
                  >
                    {formatCurrency(month.collected, locale)} {pipelineHasCobrado ? t('revenueChart.tooltipCollectedSuffix') : t('revenueChart.tooltipIncomeSuffix')}
                  </p>
                </div>
              )}

              <div
                className="flex w-full items-end justify-center gap-[2px] sm:gap-1"
                style={{ height: BAR_HEIGHT }}
              >
                <div
                  className="w-full max-w-[14px] rounded-t-[3px] transition-all duration-200 sm:max-w-[18px]"
                  style={{
                    height: projH,
                    backgroundColor: `${accentHex}35`,
                  }}
                />
                <div
                  className="w-full max-w-[14px] rounded-t-[3px] transition-all duration-200 sm:max-w-[18px]"
                  style={{
                    height: collH,
                    background: accentGradient,
                    opacity: month.collected > 0 ? 1 : 0.15,
                  }}
                />
              </div>

              <span
                className={cx(
                  'mt-2 text-[9px] font-medium uppercase tracking-wide sm:text-[10px]',
                  isCurrent ? 'font-black' : 'text-[var(--text-secondary)]',
                )}
                style={isCurrent ? { color: accentHex } : undefined}
              >
                {month.label}
              </span>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}

/* ── Achievements grid ──────────────────────────────────────── */

interface BadgeDef {
  key: BadgeKey;
  icon: React.ElementType;
  secret?: boolean;           // cuando está bloqueada se muestra como "???"
}

interface BadgeSection {
  id: string;
  badges: BadgeDef[];
}

const SECTIONS: BadgeSection[] = [
  {
    id: 'primeros-pasos',
    badges: [
      { key: 'perfil_estelar',    icon: Star },
      { key: 'primer_trazo',      icon: PencilSimpleLine },
      { key: 'red_inicial',       icon: UserPlus },
      { key: 'rumbo_fijo',        icon: Compass },
      { key: 'vision_clara',      icon: Eye },
      { key: 'identidad_propia',  icon: Palette },
    ],
  },
  {
    id: 'hitos',
    badges: [
      { key: 'motor_de_ideas',       icon: Rocket },
      { key: 'fabrica_de_proyectos', icon: Stack },
      { key: 'promesa_cumplida',     icon: Medal },
      { key: 'creador_imparable',    icon: Target },
      { key: 'negocio_en_marcha',    icon: CurrencyDollar },
      { key: 'lluvia_de_billetes',   icon: Money },
      { key: 'circulo_intimo',       icon: Users },
      { key: 'directorio_dorado',    icon: Trophy },
    ],
  },
  {
    id: 'habitos',
    badges: [
      { key: 'madrugador',           icon: Sun },
      { key: 'noctambulo',           icon: Moon },
      { key: 'cierre_limpio',        icon: CheckSquare },
      { key: 'cobrador_implacable',  icon: Lightning },
      { key: 'pipeline_zen',         icon: Leaf },
      { key: 'visionario_cumplido',  icon: Eye },
      { key: 'conector',             icon: UsersThree },
    ],
  },
  {
    id: 'rachas',
    badges: [
      { key: 'en_la_zona',         icon: Flame },
      { key: 'racha_de_hierro',    icon: Flame },
      { key: 'inamovible',         icon: Flame },
      { key: 'semana_perfecta',    icon: CalendarCheck },
      { key: 'mes_de_oro',         icon: CalendarHeart },
    ],
  },
  {
    id: 'leyenda',
    badges: [
      { key: 'fundador',       icon: SealCheck },
      { key: 'tres_en_un_dia', icon: Question, secret: true },
      { key: 'cobro_finde',    icon: Question, secret: true },
      { key: 'icono_efi',      icon: Crown },
    ],
  },
];

// Icons for secret badges once unlocked (the label/description are read from i18n).
const SECRET_REVEALED_ICONS: Partial<Record<BadgeKey, React.ElementType>> = {
  tres_en_un_dia: Lightning,
  cobro_finde: Money,
};

const ALL_BADGES: BadgeDef[] = SECTIONS.flatMap(s => s.badges);

// ── Material tier per badge (progression order: Bronze → Diamond) ─

interface MaterialStyle {
  medallionBg: string;
  medallionShadow: string;
  iconColor: string;
  tileBorderColor: string;
  tileGlowColor: string;
}

// Tiers definidos una vez, luego asignados a cada placa por rareza/dificultad.
type Tier = 'bronce' | 'cobre' | 'plata' | 'oro' | 'oro_rosa' | 'platino' | 'titanio' | 'obsidiana' | 'diamante';

const TIER_STYLES: Record<Tier, MaterialStyle> = {
  bronce: {
    medallionBg: 'linear-gradient(145deg, #8c5a28 0%, #b87830 15%, #d49840 28%, #f0c060 42%, #e8b048 55%, #c07828 70%, #8c5828 85%, #6a4020 100%)',
    medallionShadow: '0 6px 20px -4px rgba(160,100,30,0.75), inset 0 1px 0 rgba(255,215,120,0.5), inset 0 -1px 0 rgba(0,0,0,0.3)',
    iconColor: '#fff8e8',
    tileBorderColor: 'rgba(180,120,50,0.45)',
    tileGlowColor: 'rgba(180,120,50,0.08)',
  },
  cobre: {
    medallionBg: 'linear-gradient(145deg, #7c3818 0%, #a85830 15%, #c87848 28%, #e09868 42%, #cc8050 55%, #aa5828 70%, #7c3818 100%)',
    medallionShadow: '0 6px 20px -4px rgba(160,80,40,0.75), inset 0 1px 0 rgba(255,175,130,0.5), inset 0 -1px 0 rgba(0,0,0,0.3)',
    iconColor: '#fff0e8',
    tileBorderColor: 'rgba(170,90,40,0.45)',
    tileGlowColor: 'rgba(170,90,40,0.08)',
  },
  plata: {
    medallionBg: 'linear-gradient(145deg, #7a7a8a 0%, #9898a8 15%, #b8b8c8 28%, #e0e0f0 42%, #f4f4ff 50%, #d0d0e0 60%, #a8a8b8 75%, #808090 100%)',
    medallionShadow: '0 6px 20px -4px rgba(140,140,170,0.6), inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(0,0,0,0.2)',
    iconColor: '#1a1a2a',
    tileBorderColor: 'rgba(160,160,190,0.4)',
    tileGlowColor: 'rgba(160,160,190,0.07)',
  },
  oro: {
    medallionBg: 'linear-gradient(145deg, #7a5c10 0%, #a88020 15%, #d4a828 28%, #f8d040 40%, #ffe040 48%, #f8c830 58%, #c89020 72%, #906800 87%, #6a4e08 100%)',
    medallionShadow: '0 6px 24px -4px rgba(200,160,20,0.8), inset 0 1px 0 rgba(255,245,150,0.6), inset 0 -1px 0 rgba(0,0,0,0.25)',
    iconColor: '#2a1800',
    tileBorderColor: 'rgba(200,158,20,0.5)',
    tileGlowColor: 'rgba(200,158,20,0.1)',
  },
  oro_rosa: {
    medallionBg: 'linear-gradient(145deg, #8a5858 0%, #b07878 15%, #d0a090 28%, #f0c0b0 42%, #f8c8b8 50%, #e0a898 60%, #c08080 75%, #8a5858 100%)',
    medallionShadow: '0 6px 20px -4px rgba(200,130,130,0.65), inset 0 1px 0 rgba(255,225,215,0.5), inset 0 -1px 0 rgba(0,0,0,0.2)',
    iconColor: '#2a1010',
    tileBorderColor: 'rgba(200,130,130,0.4)',
    tileGlowColor: 'rgba(200,130,130,0.08)',
  },
  platino: {
    medallionBg: 'linear-gradient(145deg, #a0a0b4 0%, #c0c0d4 15%, #d8d8ec 28%, #f0f0fc 40%, #ffffff 50%, #e8e8f8 60%, #ccccde 75%, #a8a8bc 87%, #909098 100%)',
    medallionShadow: '0 6px 24px -4px rgba(180,180,220,0.7), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(0,0,0,0.15)',
    iconColor: '#18182a',
    tileBorderColor: 'rgba(190,190,230,0.45)',
    tileGlowColor: 'rgba(190,190,230,0.08)',
  },
  titanio: {
    medallionBg: 'linear-gradient(145deg, #2a2f3c 0%, #3c4454 15%, #505a6c 28%, #687080 40%, #747e90 50%, #60686e 62%, #484e5a 75%, #333844 87%, #252830 100%)',
    medallionShadow: '0 6px 20px -4px rgba(60,80,120,0.65), inset 0 1px 0 rgba(200,210,240,0.25), inset 0 -1px 0 rgba(0,0,0,0.4)',
    iconColor: '#d0d8f0',
    tileBorderColor: 'rgba(80,100,150,0.4)',
    tileGlowColor: 'rgba(80,100,150,0.07)',
  },
  obsidiana: {
    medallionBg: 'linear-gradient(220deg, rgba(120,80,240,0.5) 0%, rgba(60,100,255,0.3) 35%, transparent 65%, rgba(160,60,200,0.3) 100%), linear-gradient(145deg, #0c0810 0%, #1c1228 20%, #2e1e42 40%, #22163a 60%, #140c22 80%, #080510 100%)',
    medallionShadow: '0 6px 24px -4px rgba(100,60,220,0.8), inset 0 1px 0 rgba(180,140,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.5)',
    iconColor: '#c8b8ff',
    tileBorderColor: 'rgba(100,60,200,0.5)',
    tileGlowColor: 'rgba(100,60,200,0.1)',
  },
  diamante: {
    medallionBg: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.2) 30%, transparent 55%), linear-gradient(125deg, #ff6eb4 0%, #ff9548 14%, #ffe44d 28%, #72ed6a 42%, #4dc8ff 56%, #8b78ff 70%, #ff6eb4 84%, #ff9548 100%)',
    medallionShadow: '0 6px 28px -4px rgba(160,80,255,0.85), 0 0 20px rgba(255,200,50,0.45), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.1)',
    iconColor: '#ffffff',
    tileBorderColor: 'rgba(160,100,255,0.5)',
    tileGlowColor: 'rgba(160,100,255,0.12)',
  },
};

const BADGE_TIER: Record<BadgeKey, Tier> = {
  // ── Sección 1 — Primeros Pasos (bronce/cobre, salvo identidad_propia)
  perfil_estelar:        'bronce',
  primer_trazo:          'bronce',
  red_inicial:           'bronce',
  rumbo_fijo:            'bronce',
  vision_clara:          'cobre',
  identidad_propia:      'bronce',
  // ── Sección 2 — Hitos
  motor_de_ideas:        'plata',
  fabrica_de_proyectos:  'oro',
  promesa_cumplida:      'oro_rosa',
  creador_imparable:     'obsidiana',
  negocio_en_marcha:     'platino',
  lluvia_de_billetes:    'diamante',
  circulo_intimo:        'oro',
  directorio_dorado:     'titanio',
  // ── Sección 3 — Hábitos
  madrugador:            'cobre',
  noctambulo:            'plata',
  cierre_limpio:         'plata',
  cobrador_implacable:   'oro',
  pipeline_zen:          'platino',
  visionario_cumplido:   'oro_rosa',
  conector:              'titanio',
  // ── Sección 4 — Rachas
  en_la_zona:            'bronce',
  racha_de_hierro:       'plata',
  inamovible:            'obsidiana',
  semana_perfecta:       'oro',
  mes_de_oro:            'diamante',
  // ── Sección 5 — Leyenda
  fundador:              'diamante',
  tres_en_un_dia:        'obsidiana',
  cobro_finde:           'oro_rosa',
  icono_efi:             'diamante',
};

const BADGE_MATERIALS: Record<BadgeKey, MaterialStyle> = Object.fromEntries(
  (Object.keys(BADGE_TIER) as BadgeKey[]).map(k => [k, TIER_STYLES[BADGE_TIER[k]]]),
) as Record<BadgeKey, MaterialStyle>;

function BadgeTile({ badge, unlocked, accentHex }: { badge: BadgeDef; unlocked: boolean; accentHex: string }) {
  const { t } = useTranslation('dashboard');
  const mat = BADGE_MATERIALS[badge.key];

  // Secret badges show a muted mystery label/icon until unlocked.
  const isSecretLocked = !!badge.secret && !unlocked;
  const revealedIcon = unlocked && badge.secret ? SECRET_REVEALED_ICONS[badge.key] : null;
  const displayLabel = badge.secret && !unlocked
    ? t('badges.labels.secretLocked')
    : t(`badges.labels.${badge.key}`);
  const displayDescription = isSecretLocked
    ? t('badges.secretHint')
    : t(`badges.descriptions.${badge.key}`);
  const DisplayIcon = revealedIcon ?? badge.icon;

  // Extract a more opaque spotlight color from the border color
  const spotlightColor = mat.tileBorderColor.replace(/rgba\(([^,]+,[^,]+,[^,]+),.*\)/, 'rgba($1,0.40)');

  return (
    <div className="flex w-[112px] shrink-0 flex-col items-center snap-start">
      {/* Pedestal area */}
      <div className="relative flex flex-col items-center">
        {unlocked && (
          <div
            className="pointer-events-none absolute -top-5 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full blur-2xl"
            style={{ background: spotlightColor }}
          />
        )}

        {/* Metallic medallion */}
        <div
          className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full"
          style={
            unlocked
              ? { background: mat.medallionBg, boxShadow: mat.medallionShadow }
              : {
                  background: 'linear-gradient(145deg, #1c1c22 0%, #28282e 50%, #1a1a20 100%)',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.6)',
                }
          }
        >
          {unlocked ? (
            <DisplayIcon size={26} weight="fill" style={{ color: mat.iconColor }} />
          ) : isSecretLocked ? (
            <Question size={22} weight="bold" style={{ color: '#4a4a58' }} />
          ) : (
            <Lock size={20} weight="fill" style={{ color: '#3a3a48' }} />
          )}
        </div>

        {/* Floating shelf plank */}
        <div
          className="relative z-10 mt-1.5 h-2 w-[4.5rem] rounded-sm"
          style={
            unlocked
              ? {
                  background: `linear-gradient(180deg, color-mix(in srgb, ${accentHex} 12%, #1a1a24) 0%, color-mix(in srgb, ${accentHex} 6%, #111118) 100%)`,
                  borderBottom: `3px solid ${mat.tileBorderColor}`,
                  boxShadow: `0 6px 16px -2px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 3px 8px -2px ${mat.tileBorderColor}`,
                }
              : {
                  background: 'linear-gradient(180deg, #181818 0%, #101010 100%)',
                  borderBottom: '3px solid #252528',
                  boxShadow: '0 4px 10px -2px rgba(0,0,0,0.6)',
                }
          }
        />
      </div>

      {/* Museum wall plaque */}
      <div
        className="mt-3 w-full rounded px-2 py-1.5 text-center"
        style={
          unlocked
            ? {
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${mat.tileBorderColor}`,
              }
            : {
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.07)',
                opacity: isSecretLocked ? 0.55 : 0.4,
              }
        }
      >
        <p
          className="text-[11px] font-semibold leading-tight"
          style={{ color: unlocked ? '#d0d0e0' : isSecretLocked ? '#7a7a88' : '#606068' }}
        >
          {isSecretLocked ? t('badges.lockedSecret') : displayLabel}
        </p>
        <p
          className="mt-0.5 text-[10px] leading-tight"
          style={{ color: unlocked ? '#787890' : '#505058' }}
        >
          {displayDescription}
        </p>
      </div>
    </div>
  );
}

/* ── BadgesDrawer ───────────────────────────────────────────── */

function BadgesDrawer({ unlockedBadges, onClose, accentHex }: { unlockedBadges: BadgeKey[]; onClose: () => void; accentHex: string }) {
  const { t } = useTranslation('dashboard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const unlockedSet = useMemo(() => new Set(unlockedBadges), [unlockedBadges]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`relative flex h-full w-full max-w-md md:max-w-2xl flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-out ${mounted ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${accentHex} 8%, #0c0c14) 0%, #090910 55%, #060608 100%)` }}
      >
        {/* Ambient ceiling glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-72"
          style={{ background: `radial-gradient(ellipse at 50% -10%, ${accentHex}70 0%, transparent 68%)` }}
        />

        {/* Header */}
        <div
          className="relative z-10 flex items-center justify-between px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: '#dcdcf0' }}>{t('badgesDrawer.title')}</h2>
            <p className="mt-0.5 text-xs" style={{ color: `${accentHex}88` }}>
              {t('badgesDrawer.progress', { unlocked: unlockedBadges.length, total: ALL_BADGES.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            style={{ color: `${accentHex}88` }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — una sola pared: un único scroll horizontal que arrastra todas las filas juntas */}
        <div
          className="relative z-10 flex-1 overflow-x-auto overflow-y-auto py-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="flex w-max flex-col">
            {SECTIONS.map((section) => {
              const sectionUnlocked = section.badges.filter(b => unlockedSet.has(b.key)).length;
              return (
                <div key={section.id} className="py-3">
                  {/* Mini-header inline, pegado a la izquierda — queda fijo en la columna 0, no se duplica */}
                  <div className="flex items-baseline justify-between gap-3 px-5" style={{ minWidth: '100%' }}>
                    <div className="flex items-baseline gap-2 min-w-0">
                      <h3
                        className="text-[10px] font-bold tracking-[0.18em] uppercase shrink-0"
                        style={{ color: '#dcdcf0' }}
                      >
                        {t(`badges.sections.${section.id}.title`)}
                      </h3>
                      <p
                        className="truncate text-[10px]"
                        style={{ color: '#787890' }}
                      >
                        {t(`badges.sections.${section.id}.subtitle`)}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[10px] font-bold"
                      style={{ color: `${accentHex}bb` }}
                    >
                      {sectionUnlocked}/{section.badges.length}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-3 px-5">
                    {section.badges.map((badge) => (
                      <BadgeTile
                        key={badge.key}
                        badge={badge}
                        unlocked={unlockedSet.has(badge.key)}
                        accentHex={accentHex}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── Dashboard ──────────────────────────────────────────────── */

export default function Dashboard() {
  const { tasks, partners, accentColor, accentHex, accentGradient, updateTaskStatus, profile, efisystem, pipelineHasCobrado, locale } = useAppContext();
  const { t } = useTranslation('dashboard');
  const today = new Date();
  const todayIso = formatLocalDateISO(today);
  const startOfToday = startOfLocalDay(today);
  const tomorrow = new Date(startOfToday);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = formatLocalDateISO(tomorrow);
  const weekEnd = new Date(startOfToday);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const [badgesOpen, setBadgesOpen] = useState(false);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [periodView, setPeriodView] = useState<'month' | 'year' | 'all'>('month');
  const [periodMonth, setPeriodMonth] = useState(today.getMonth());
  const [periodYear, setPeriodYear] = useState(today.getFullYear());

  const periodLabel = useMemo(() => {
    if (periodView === 'all') return t('period.all');
    if (periodView === 'year') return String(periodYear);
    return new Date(periodYear, periodMonth).toLocaleDateString(localeToBcp47(locale), {
      month: 'long',
      year: 'numeric',
    }).replace(/^\w/, (c) => c.toUpperCase());
  }, [periodView, periodMonth, periodYear, locale, t]);

  const navigatePeriod = (dir: -1 | 1) => {
    if (periodView === 'month') {
      const d = new Date(periodYear, periodMonth + dir, 1);
      setPeriodMonth(d.getMonth());
      setPeriodYear(d.getFullYear());
    } else if (periodView === 'year') {
      setPeriodYear((y) => y + dir);
    }
  };

  const cyclePeriodView = () => {
    if (periodView === 'month') setPeriodView('year');
    else if (periodView === 'year') setPeriodView('all');
    else {
      setPeriodView('month');
      setPeriodMonth(today.getMonth());
      setPeriodYear(today.getFullYear());
    }
  };

  /* ── handlers ─────────────────────────────────────────────── */

  const handleCompleteTask = async (taskId: string) => {
    try {
      await hapticSuccess();
      await updateTaskStatus(taskId, 'Completada');
      toast.success(t('toasts.taskCompleted'));
    } catch {
      toast.error(t('toasts.taskCompleteError'));
    }
  };

  /* ── derived data ─────────────────────────────────────────── */

  const periodFilteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (periodView === 'all') return true;
      const d = parseLocalDate(t.dueDate);
      if (periodView === 'year') return d.getFullYear() === periodYear;
      return d.getMonth() === periodMonth && d.getFullYear() === periodYear;
    });
  }, [tasks, periodView, periodMonth, periodYear]);

  const generalGoals = useMemo(
    () =>
      (profile?.goals || [])
        .map((g: any) => (typeof g === 'string' ? g : g.generalGoal))
        .filter((g) => typeof g === 'string' && g.trim().length > 0),
    [profile?.goals],
  );

  const estimatedRevenue = useMemo(
    () =>
      (profile?.goals || []).reduce((s, g: any) => {
        if (typeof g === 'string') return s;
        return s + (Number(g.revenueEstimation) || 0);
      }, 0),
    [profile?.goals],
  );

  const globalSummary = useMemo(() => {
    const overdue = tasks.filter(
      (t) =>
        startOfLocalDay(parseLocalDate(t.dueDate)) < startOfToday &&
        t.status !== 'Cobrado' &&
        t.status !== 'Completada',
    ).length;
    const tasksToday = tasks.filter((t) => t.dueDate === todayIso && t.status !== 'Cobrado').length;
    const tasksThisWeek = tasks.filter((t) => {
      const d = startOfLocalDay(parseLocalDate(t.dueDate));
      return d >= startOfToday && d <= weekEnd && t.status !== 'Cobrado';
    }).length;
    const activePipelineValue = tasks
      .filter((t) => t.status !== 'Cobrado')
      .reduce((s, t) => s + t.value, 0);
    return { overdue, tasksToday, tasksThisWeek, activePipelineValue };
  }, [tasks, startOfToday, todayIso, weekEnd]);

  const periodSummary = useMemo(() => {
    const activePipelineValue = periodFilteredTasks
      .filter((t) => t.status !== 'Cobrado')
      .reduce((s, t) => s + t.value, 0);
    const closedPipelineValue = periodFilteredTasks
      .filter((t) => t.status === 'Cobrado')
      .reduce((s, t) => s + (t.actualPayment ?? t.value), 0);
    const pendingPaymentValue = periodFilteredTasks
      .filter((t) => t.status === 'Completada')
      .reduce((s, t) => s + t.value, 0);
    const deliveriesCount = periodFilteredTasks
      .filter((t) => t.status === 'Completada' || t.status === 'Cobrado').length;
    const activePartners = new Set(
      periodFilteredTasks.map((t) => t.partnerId),
    ).size;
    return {
      activePipelineValue,
      closedPipelineValue,
      pendingPaymentValue,
      deliveriesCount,
      activePartners,
      totalPartners: partners.length,
      totalContacts: partners.reduce((s, p) => s + p.contacts.length, 0),
    };
  }, [partners, periodFilteredTasks]);

  // When the Cobrado stage is disabled, the chart sources its "collected" series
  // from completion timestamps instead of payment timestamps.
  const annualRevenue = useMemo(() => {
    if (pipelineHasCobrado) return periodSummary.closedPipelineValue;
    return periodFilteredTasks
      .filter((t) => t.status === 'Completada')
      .reduce((s, t) => s + (t.actualPayment ?? t.value), 0);
  }, [pipelineHasCobrado, periodSummary.closedPipelineValue, periodFilteredTasks]);

  const groupedAgenda = useMemo(() => {
    const overdue: Task[] = [];
    const todayTasks: Task[] = [];
    const tomorrowTasks: Task[] = [];
    const thisWeekTasks: Task[] = [];

    const sorted = [...tasks]
      .filter((t) => t.status !== 'Cobrado' && t.status !== 'Completada')
      .sort((a, b) => parseLocalDate(a.dueDate).getTime() - parseLocalDate(b.dueDate).getTime());

    sorted.forEach((task) => {
      const d = startOfLocalDay(parseLocalDate(task.dueDate));
      if (d < startOfToday) overdue.push(task);
      else if (task.dueDate === todayIso) todayTasks.push(task);
      else if (task.dueDate === tomorrowIso) tomorrowTasks.push(task);
      else if (d <= weekEnd) thisWeekTasks.push(task);
    });

    return { overdue, todayTasks, tomorrowTasks, thisWeekTasks };
  }, [tasks, startOfToday, todayIso, tomorrowIso, weekEnd]);

  const hasAgendaItems =
    groupedAgenda.overdue.length > 0 ||
    groupedAgenda.todayTasks.length > 0 ||
    groupedAgenda.tomorrowTasks.length > 0 ||
    groupedAgenda.thisWeekTasks.length > 0;

  const toCollect = useMemo(() => {
    if (!pipelineHasCobrado) return [];
    return [...tasks]
      .filter((t) => t.status === 'Completada')
      .sort((a, b) => parseLocalDate(a.dueDate).getTime() - parseLocalDate(b.dueDate).getTime());
  }, [tasks, pipelineHasCobrado]);

  const toCollectTotal = useMemo(
    () => toCollect.reduce((sum, t) => sum + (t.actualPayment ?? t.value), 0),
    [toCollect],
  );

  const pipelineStatuses = useMemo<TaskStatus[]>(
    () => (pipelineHasCobrado ? ALL_PIPELINE_STATUSES : ALL_PIPELINE_STATUSES.filter((s) => s !== 'Cobrado')),
    [pipelineHasCobrado],
  );

  const breakdown = useMemo(
    () =>
      pipelineStatuses.map((status) => {
        const sts = periodFilteredTasks.filter((t) => t.status === status);
        return { status, count: sts.length, value: sts.reduce((s, t) => s + t.value, 0) };
      }),
    [periodFilteredTasks, pipelineStatuses],
  );

  const totalBreakdownCount = breakdown.reduce((s, b) => s + b.count, 0);

  /* ── render ───────────────────────────────────────────────── */

  return (
    <div className="space-y-5 p-4 pb-6 overflow-x-clip animate-in fade-in slide-in-from-bottom-4 duration-500 lg:px-8 lg:pt-4 lg:pb-8">
      {/* Goals Marquee */}
      {generalGoals.length > 0 && (
        <GoalsMarquee goals={generalGoals} accentHex={accentHex} accentGradient={accentGradient} />
      )}

      {/* Efisystem: level widget */}
      <div className="mb-4">
        <EfisystemWidget
          efisystem={efisystem}
          accentHex={accentHex}
          onOpenBadges={() => setBadgesOpen(true)}
          onOpenLevels={() => setLevelsOpen(true)}
        />
      </div>
      {badgesOpen && (
        <BadgesDrawer unlockedBadges={efisystem.unlockedBadges} onClose={() => setBadgesOpen(false)} accentHex={accentHex} />
      )}
      {levelsOpen && (
        <LevelsModal currentLevel={efisystem.currentLevel} accentHex={accentHex} onClose={() => setLevelsOpen(false)} />
      )}

      {/* Main 2-col grid */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        {/* ── Left: stacked cards ────────────────────────── */}
        <div className="order-2 min-w-0 space-y-5 xl:order-1">
          {/* Financial Flow */}
          <SurfaceCard className="relative overflow-hidden p-5 lg:p-6">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(circle at top right, ${accentHex}20 0%, transparent 55%)`,
                opacity: 0.6,
              }}
            />
            <div className="relative">
              {/* Period navigator */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1">
                  {periodView === 'month' && (
                    <button
                      type="button"
                      onClick={() => navigatePeriod(-1)}
                      aria-label={t('period.previousAriaLabel')}
                      className="rounded-lg p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                    >
                      <CaretLeft size={16} />
                    </button>
                  )}
                  <span className="min-w-[140px] text-center text-[13px] font-bold text-[var(--text-primary)]">
                    {periodLabel}
                  </span>
                  {periodView === 'month' && (
                    <button
                      type="button"
                      onClick={() => navigatePeriod(1)}
                      aria-label={t('period.nextAriaLabel')}
                      className="rounded-lg p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                    >
                      <CaretRight size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 rounded-[0.6rem] bg-[var(--surface-muted)]/70 p-0.5">
                  {([
                    { key: 'month' as const, label: t('period.month') },
                    { key: 'year' as const, label: t('period.year') },
                    { key: 'all' as const, label: t('period.all') },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setPeriodView(opt.key);
                        if (opt.key === 'month') {
                          setPeriodMonth(today.getMonth());
                          setPeriodYear(today.getFullYear());
                        }
                        if (opt.key === 'year') {
                          setPeriodYear(today.getFullYear());
                        }
                      }}
                      className={cx(
                        'rounded-[0.4rem] px-2.5 py-1 text-[10px] tracking-wide transition-all',
                        periodView === opt.key
                          ? 'bg-[var(--surface-card)] font-extrabold text-[var(--text-primary)] shadow-sm'
                          : 'font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPIs grid */}
              <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-4 sm:gap-x-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--text-secondary)] uppercase truncate">
                    {t('kpis.open')}
                  </p>
                  <p className="mt-1 truncate text-lg font-black tracking-tight text-[var(--text-primary)] sm:text-xl">
                    {formatCurrency(periodSummary.activePipelineValue, locale)}
                  </p>
                </div>
                {pipelineHasCobrado ? (
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--text-secondary)] uppercase truncate">
                      {t('kpis.collected')}
                    </p>
                    <p
                      className="mt-1 truncate text-lg font-black tracking-tight sm:text-xl"
                      style={{ color: accentHex }}
                    >
                      {formatCurrency(periodSummary.closedPipelineValue, locale)}
                    </p>
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--text-secondary)] uppercase truncate">
                    {t('kpis.toCollect')}
                  </p>
                  <p className="mt-1 truncate text-lg font-black tracking-tight text-amber-600 dark:text-amber-400 sm:text-xl">
                    {formatCurrency(periodSummary.pendingPaymentValue, locale)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--text-secondary)] uppercase truncate">
                    {t('kpis.deliveries')}
                  </p>
                  <p className="mt-1 truncate text-lg font-black tracking-tight text-[var(--text-primary)] sm:text-xl">
                    {periodSummary.deliveriesCount}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--text-secondary)] uppercase truncate">
                    {t('kpis.clients')}
                  </p>
                  <p className="mt-1 truncate text-lg font-black tracking-tight text-[var(--text-primary)] sm:text-xl">
                    {periodSummary.activePartners}
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      {' '}/ {periodSummary.totalPartners}
                    </span>
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--text-secondary)] uppercase truncate">
                    {t('kpis.contacts')}
                  </p>
                  <p className="mt-1 truncate text-lg font-black tracking-tight text-[var(--text-primary)] sm:text-xl">
                    {periodSummary.totalContacts}
                  </p>
                </div>
              </div>

              {/* Annual goal progress */}
              {estimatedRevenue > 0 && (
                <div className="mt-4 rounded-[0.7rem] bg-[var(--surface-muted)]/60 px-3.5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--text-secondary)] uppercase">
                      {t('annualGoal.title')}
                    </p>
                    <p className="text-[11px] font-bold text-[var(--text-secondary)]">
                      {formatCurrency(annualRevenue, locale)} /{' '}
                      {formatCurrency(estimatedRevenue, locale)}
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-inset)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((annualRevenue / estimatedRevenue) * 100, 100)}%`,
                        background: accentGradient,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                    {t('annualGoal.achieved', { percent: Math.round((annualRevenue / estimatedRevenue) * 100) })}
                  </p>
                </div>
              )}
            </div>
          </SurfaceCard>

          {/* Pipeline */}
          <SurfaceCard className="p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.18em] text-[var(--text-secondary)] uppercase">
                {t('pipeline.title')}
              </p>
              <StatusBadge tone="neutral">{t('pipeline.taskCount', { count: totalBreakdownCount })}</StatusBadge>
            </div>

            {/* Segmented bar */}
            {totalBreakdownCount > 0 && (
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[var(--surface-inset)]">
                {breakdown.map((item) => {
                  if (item.count === 0) return null;
                  const pct = (item.count / totalBreakdownCount) * 100;
                  return (
                    <div
                      key={item.status}
                      className="transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pipelineBarColors[item.status],
                        opacity: 0.82,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 space-y-2">
              {breakdown.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between gap-3 text-[11px]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <StatusBadge tone={statusToneMap[item.status]}>{item.count}</StatusBadge>
                    <span className="truncate font-medium text-[var(--text-primary)]">{t(`taskStatus.${item.status}`)}</span>
                  </div>
                  <span className="shrink-0 font-bold text-[var(--text-secondary)]">
                    {formatCurrency(item.value, locale)}
                  </span>
                </div>
              ))}
            </div>

          </SurfaceCard>

          {/* Goal Effort Distribution */}
          <GoalEffortWidget
            tasks={periodFilteredTasks}
            goals={profile?.goals || []}
            accentHex={accentHex}
            accentGradient={accentGradient}
          />

        </div>

        {/* ── Right: Agenda + Por cobrar ──────────────────── */}
        <div className="order-1 min-w-0 space-y-5 xl:order-2">
        <SurfaceCard className="p-5 lg:p-6">
          <p className="text-[11px] font-bold tracking-[0.18em] text-[var(--text-secondary)] uppercase">
            {t('agenda.title')}
          </p>

          {hasAgendaItems ? (
            <div className="mt-4 space-y-5">
              {/* Overdue */}
              {groupedAgenda.overdue.length > 0 && (
                <AgendaGroup
                  label={t('agenda.groups.overdue', { count: groupedAgenda.overdue.length })}
                  icon={<Clock size={13} className="text-amber-500" />}
                  labelClassName="text-amber-600 dark:text-amber-400"
                  tasks={groupedAgenda.overdue}
                  partners={partners}
                  accentHex={accentHex}
                  onComplete={handleCompleteTask}
                />
              )}

              {/* Today */}
              {groupedAgenda.todayTasks.length > 0 && (
                <AgendaGroup
                  label={t('agenda.groups.today', { count: groupedAgenda.todayTasks.length })}
                  tasks={groupedAgenda.todayTasks}
                  partners={partners}
                  accentHex={accentHex}
                  onComplete={handleCompleteTask}
                />
              )}

              {/* Tomorrow */}
              {groupedAgenda.tomorrowTasks.length > 0 && (
                <AgendaGroup
                  label={t('agenda.groups.tomorrow', { count: groupedAgenda.tomorrowTasks.length })}
                  tasks={groupedAgenda.tomorrowTasks}
                  partners={partners}
                  accentHex={accentHex}
                  onComplete={handleCompleteTask}
                />
              )}

              {/* This week */}
              {groupedAgenda.thisWeekTasks.length > 0 && (
                <AgendaGroup
                  label={t('agenda.groups.thisWeek', { count: groupedAgenda.thisWeekTasks.length })}
                  tasks={groupedAgenda.thisWeekTasks}
                  partners={partners}
                  accentHex={accentHex}
                  onComplete={handleCompleteTask}
                />
              )}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDot}
              title={t('agenda.empty.title')}
              description={t('agenda.empty.description')}
              className="py-10"
            />
          )}
        </SurfaceCard>

        {pipelineHasCobrado && toCollect.length > 0 && (
          <SurfaceCard className="p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Money size={16} className="text-emerald-500" />
                <p className="text-[11px] font-bold tracking-[0.18em] text-[var(--text-secondary)] uppercase">
                  {t('toCollect.title')}
                </p>
              </div>
              <p className="text-[13px] font-black text-[var(--text-primary)]">
                {formatCurrency(toCollectTotal, locale)}
              </p>
            </div>
            <div className="mt-4 space-y-2">
              {toCollect.map((task) => {
                const partner = partners.find((p) => p.id === task.partnerId);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    partner={partner}
                    accentHex={accentHex}
                    onComplete={handleCompleteTask}
                  />
                );
              })}
            </div>
          </SurfaceCard>
        )}
        </div>
      </section>

      {/* Revenue Chart – full width */}
      <RevenueChart tasks={tasks} accentHex={accentHex} accentGradient={accentGradient} pipelineHasCobrado={pipelineHasCobrado} />
    </div>
  );
}

/* ── AgendaGroup ────────────────────────────────────────────── */

function AgendaGroup({
  label,
  icon,
  labelClassName,
  tasks,
  partners,
  accentHex,
  onComplete,
}: {
  label: string;
  icon?: React.ReactNode;
  labelClassName?: string;
  tasks: Task[];
  partners: Array<{ id: string; name: string }>;
  accentHex: string;
  onComplete: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <p
          className={cx(
            'text-[10px] font-bold tracking-[0.14em] uppercase',
            labelClassName || 'text-[var(--text-secondary)]',
          )}
        >
          {label}
        </p>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => {
          const partner = partners.find((p) => p.id === task.partnerId);
          return (
            <React.Fragment key={task.id}>
              <TaskCard
                task={task}
                partner={partner}
                accentHex={accentHex}
                onComplete={onComplete}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
