import React from 'react';
import { Plus, Trash } from '@phosphor-icons/react';
import type { MediaKitMetric, MediaKitProfile } from '@shared';
import { fieldClass, labelClass, safeArr } from './block-styles';

type MetricKey = 'insightStats' | 'audienceGender' | 'ageDistribution' | 'topCountries';

interface MetricsBlockProps {
  mediaKit: Pick<MediaKitProfile, 'insightStats' | 'audienceGender' | 'ageDistribution' | 'topCountries'>;
  accentHex: string;
  onMetricChange: (key: MetricKey, index: number, field: keyof MediaKitMetric, value: string) => void;
  onAddMetric: (key: MetricKey) => void;
  onRemoveMetric: (key: MetricKey, index: number) => void;
}

function MetricGrid({
  label,
  metricKey,
  items,
  itemLabel,
  accentHex,
  addLabel,
  onMetricChange,
  onAddMetric,
  onRemoveMetric,
}: {
  label: string;
  metricKey: MetricKey;
  items: any[];
  itemLabel: string;
  accentHex: string;
  addLabel: string;
  onMetricChange: (key: MetricKey, index: number, field: keyof MediaKitMetric, value: string) => void;
  onAddMetric: (key: MetricKey) => void;
  onRemoveMetric: (key: MetricKey, index: number) => void;
}) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item: any, index: number) => (
          <div
            key={index}
            className="group relative rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-muted)] p-4"
          >
            <button
              type="button"
              onClick={() => onRemoveMetric(metricKey, index)}
              className="absolute right-3 top-3 text-[var(--text-secondary)] opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
            >
              <Trash size={14} />
            </button>
            <label className={labelClass}>{itemLabel}</label>
            <input
              value={item?.label || ''}
              onChange={(e) => onMetricChange(metricKey, index, 'label', e.target.value)}
              className={fieldClass}
              style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
              placeholder=""
            />
            <label className={`${labelClass} mt-4`}>Valor</label>
            <input
              value={item?.value || ''}
              onChange={(e) => onMetricChange(metricKey, index, 'value', e.target.value)}
              className={fieldClass}
              style={{ '--tw-ring-color': accentHex } as React.CSSProperties}
              placeholder=""
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => onAddMetric(metricKey)}
          className="flex min-h-[120px] items-center justify-center rounded-[1rem] border border-dashed border-[var(--line-soft)] bg-[var(--surface-card)] text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
        >
          <div className="flex flex-col items-center gap-2">
            <Plus size={20} weight="regular" />
            <span className="text-sm font-bold">{addLabel}</span>
          </div>
        </button>
      </div>
    </div>
  );
}

export default function MetricsBlock({ mediaKit, accentHex, onMetricChange, onAddMetric, onRemoveMetric }: MetricsBlockProps) {
  return (
    <div className="grid gap-6">
      <MetricGrid
        label="Metricas principales"
        metricKey="insightStats"
        items={safeArr(mediaKit.insightStats)}
        itemLabel="Etiqueta"
        accentHex={accentHex}
        addLabel="Añadir métrica"
        onMetricChange={onMetricChange}
        onAddMetric={onAddMetric}
        onRemoveMetric={onRemoveMetric}
      />
      <MetricGrid
        label="Audiencia"
        metricKey="audienceGender"
        items={safeArr(mediaKit.audienceGender)}
        itemLabel="Segmento"
        accentHex={accentHex}
        addLabel="Añadir segmento"
        onMetricChange={onMetricChange}
        onAddMetric={onAddMetric}
        onRemoveMetric={onRemoveMetric}
      />
      <MetricGrid
        label="Rangos de edad"
        metricKey="ageDistribution"
        items={safeArr(mediaKit.ageDistribution)}
        itemLabel="Rango"
        accentHex={accentHex}
        addLabel="Añadir rango"
        onMetricChange={onMetricChange}
        onAddMetric={onAddMetric}
        onRemoveMetric={onRemoveMetric}
      />
      <MetricGrid
        label="Top countries"
        metricKey="topCountries"
        items={safeArr(mediaKit.topCountries)}
        itemLabel="País"
        accentHex={accentHex}
        addLabel="Añadir país"
        onMetricChange={onMetricChange}
        onAddMetric={onAddMetric}
        onRemoveMetric={onRemoveMetric}
      />
    </div>
  );
}
