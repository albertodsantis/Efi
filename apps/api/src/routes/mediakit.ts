import { Router } from 'express';
import type pg from 'pg';
import { createDefaultMediaKitProfile, createEmptySocialProfiles } from '@shared';
import type { MediaKitProfile, SocialProfiles } from '@shared';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeArr(val: any): any[] {
  return Array.isArray(val) ? val : [];
}

const socialPlatforms: Array<{ key: keyof SocialProfiles; base: string }> = [
  { key: 'instagram', base: 'https://instagram.com/' },
  { key: 'tiktok', base: 'https://www.tiktok.com/@' },
  { key: 'x', base: 'https://x.com/' },
  { key: 'threads', base: 'https://www.threads.net/@' },
  { key: 'youtube', base: 'https://youtube.com/@' },
];

function buildSocialHref(platform: keyof SocialProfiles, value: string) {
  const normalized = value.trim();
  if (!normalized) return '';
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const cleanHandle = normalized.replace(/^@/, '');
  const entry = socialPlatforms.find((p) => p.key === platform);
  return entry ? `${entry.base}${cleanHandle}` : '';
}

function parsePercent(value: string): number {
  const n = parseFloat(value.replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : Math.max(0, n);
}

function formatPct(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

function renderDonutChart(items: Array<{ label: string; value: string }>): string {
  if (!items.length) return '';
  const radius = 42;
  const C = 2 * Math.PI * radius;
  const strokeColors = ['var(--accent)', '#cfc7be', '#8f52aa', '#2563eb'];
  const toneNames = ['accent', 'neutral', 'berry', 'sky'];
  let cumulative = 0;

  const arcs = items
    .map((item, i) => {
      const pct = parsePercent(item.value);
      const dash = (pct / 100) * C;
      const arc = `<circle class="audience-donut-segment" cx="60" cy="60" r="${radius}" fill="none" stroke="${strokeColors[i] || '#cfc7be'}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${(-cumulative).toFixed(2)}"></circle>`;
      cumulative += dash;
      return arc;
    })
    .join('');

  const legend = items
    .map(
      (item, i) => `
      <div class="audience-legend-item">
        <span class="audience-legend-swatch tone-${toneNames[i] || 'neutral'}"></span>
        <span class="audience-legend-label">${escapeHtml(item.label)}</span>
        <span class="audience-legend-value">${escapeHtml(item.value)}</span>
      </div>`,
    )
    .join('');

  return `<div class="audience-donut-wrap">
    <div class="audience-donut-chart" aria-label="Distribución de audiencia">
      <svg class="audience-donut-svg" viewBox="0 0 120 120" role="img" aria-hidden="true">
        <circle class="audience-donut-track" cx="60" cy="60" r="${radius}" fill="none" stroke="#ece4da" stroke-width="16"></circle>
        <g transform="rotate(-90 60 60)">${arcs}</g>
      </svg>
      <div class="audience-donut-center" aria-hidden="true"></div>
    </div>
    <div class="audience-legend">${legend}</div>
  </div>`;
}

function renderAgeTreemap(items: Array<{ label: string; value: string }>): string {
  const palette = ['#1f1b18', 'var(--accent)', '#d99057', '#f0bf95'];

  const normalizedItems = items
    .map((item) => ({ label: item.label, percentage: parsePercent(item.value) }))
    .filter((item) => item.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  if (!normalizedItems.length) return '';

  const smallestPct = Math.min(...normalizedItems.map((i) => i.percentage));
  const coloredItems = normalizedItems.map((item, i) => ({
    ...item,
    visualWeight: item.percentage === smallestPct ? item.percentage * 1.3 : item.percentage,
    color: palette[i % palette.length],
  }));

  const rows = coloredItems
    .reduce<Array<{ items: typeof coloredItems; total: number }>>(
      (result, item) => {
        const targetRow = result[0].total <= result[1].total ? result[0] : result[1];
        targetRow.items.push(item);
        targetRow.total += item.visualWeight;
        return result;
      },
      [
        { items: [], total: 0 },
        { items: [], total: 0 },
      ],
    )
    .filter((row) => row.items.length);

  const renderTile = (item: (typeof coloredItems)[0], extraClass = '') => `
    <article class="age-tile ${extraClass}" style="--tile-color: ${item.color}; flex: ${item.visualWeight || 1} 1 0;">
      <div class="age-tile-content">
        <div class="age-tile-label">${escapeHtml(item.label)}</div>
        <div class="age-tile-value">${formatPct(item.percentage)}%</div>
      </div>
    </article>`;

  return `<div class="age-treemap" role="img" aria-label="Distribución por rango de edad">
    ${rows
      .map(
        (row, ri) => `
      <div class="age-treemap-row" style="flex: ${row.total || 1} 1 0;">
        ${row.items.map((item, ii) => renderTile(item, ri === 0 && ii === 0 ? 'age-tile-primary' : 'age-tile-secondary')).join('')}
      </div>`,
      )
      .join('')}
  </div>`;
}

function renderCountriesBar(items: Array<{ label: string; value: string }>): string {
  const palette = ['var(--accent)', '#c96f3a', '#d99057', '#eab27f', '#b95a1b', '#d9d2c8'];

  const normalized = items
    .map((item) => ({ label: item.label, pct: parsePercent(item.value) }))
    .filter((item) => item.pct > 0 || item.label.trim());

  if (!normalized.length) return '';

  const total = normalized.reduce((sum, item) => sum + item.pct, 0);
  const barScale = total > 100 ? 100 / total : 1;
  const remainder = Math.max(0, 100 - Math.min(total, 100));

  const segments = normalized.map((item, i) => ({
    label: item.label,
    pct: item.pct,
    barPct: item.pct * barScale,
    color: palette[i % palette.length],
  }));

  if (remainder > 0.5) {
    segments.push({ label: 'Otros', pct: remainder, barPct: remainder, color: palette[palette.length - 1] });
  }

  const bar = segments
    .map(
      (item) =>
        `<span class="country-stack-segment" style="flex-basis: ${item.barPct.toFixed(2)}%; background: ${item.color};" title="${escapeHtml(item.label)} ${item.pct > 0 ? formatPct(item.pct) + '%' : ''}"></span>`,
    )
    .join('');

  const legend = segments
    .map(
      (item) => `
    <div class="country-legend-item">
      <span class="country-legend-swatch" style="background: ${item.color};"></span>
      <span class="country-legend-label">${escapeHtml(item.label)}</span>
      <span class="country-value">${item.pct > 0 ? formatPct(item.pct) + '%' : '-'}</span>
    </div>`,
    )
    .join('');

  return `<div class="country-breakdown">
    <div class="country-stack-bar" role="img" aria-label="Distribución por país">${bar}</div>
    <div class="country-list">${legend}</div>
  </div>`;
}

function generateMediaKitHtml(
  profile: { name: string; avatar: string; handle: string; socialProfiles: SocialProfiles },
  mediaKit: MediaKitProfile,
  accentColor: string,
) {
  const safeAccent = /^#[0-9a-fA-F]{3,8}$|^rgb|^hsl/.test(accentColor) ? accentColor : '#6366f1';

  const socialIconMap: Record<string, string> = {
    instagram: 'instagram',
    tiktok: 'music-2',
    x: 'twitter',
    threads: 'at-sign',
    youtube: 'youtube',
  };

  const socialLinks = socialPlatforms
    .map(({ key }) => {
      const value = (profile.socialProfiles?.[key] || '').trim();
      const href = buildSocialHref(key, value);
      if (!value || !href) return '';
      const icon = socialIconMap[key] || 'link';
      const label = value.startsWith('@') ? value : `@${value.replace(/^@/, '')}`;
      return `<a class="button button-secondary" href="${escapeHtml(href)}" target="_blank" rel="noreferrer"><i data-lucide="${icon}"></i>${escapeHtml(label)}</a>`;
    })
    .filter(Boolean)
    .join('');

  const metricIcons = ['users', 'trending-up', 'globe', 'bar-chart-3'];
  const metricTones = ['accent', 'berry', 'sky', 'mint'];

  const insightCards = safeArr(mediaKit.insightStats)
    .filter((item: any) => item?.label?.trim() || item?.value?.trim())
    .map(
      (item: any, i: number) => `
      <article class="metric-card">
        <div class="metric-icon tone-${metricTones[i % metricTones.length]}">
          <i data-lucide="${metricIcons[i % metricIcons.length]}"></i>
        </div>
        <p class="metric-value">${escapeHtml(item.value || '-')}</p>
        <div class="metric-label">${escapeHtml(item.label || 'Dato')}</div>
      </article>`,
    )
    .join('');

  const genderChart = renderDonutChart(
    safeArr(mediaKit.audienceGender).filter((item: any) => item?.label?.trim() || item?.value?.trim()),
  );

  const ageTreemap = renderAgeTreemap(
    safeArr(mediaKit.ageDistribution).filter((item: any) => item?.label?.trim() || item?.value?.trim()),
  );

  const countriesBar = renderCountriesBar(
    safeArr(mediaKit.topCountries).filter((item: any) => item?.label?.trim() || item?.value?.trim()),
  );

  const aboutParagraphs = safeArr(mediaKit.aboutParagraphs)
    .filter((p: any) => p?.trim())
    .map((p: string) => `<p>${escapeHtml(p)}</p>`)
    .join('');

  const topicTags = safeArr(mediaKit.topicTags)
    .filter((t: any) => t?.trim())
    .map((t: string) => `<span class="chip">#${escapeHtml(t.replace(/^#/, ''))}</span>`)
    .join('');

  const portfolioImages = safeArr(mediaKit.portfolioImages)
    .filter((img: any) => img?.trim())
    .map(
      (img: string, i: number) => `
      <figure class="portfolio-item">
        <img src="${escapeHtml(img)}" alt="Portfolio ${i + 1}" />
      </figure>`,
    )
    .join('');

  const offerings = safeArr(mediaKit.offerings)
    .filter((item: any) => item?.title?.trim() || item?.price?.trim() || item?.description?.trim())
    .map(
      (item: any) => `
      <article class="service-card">
        <div class="service-top">
          <div class="service-icon"><i data-lucide="package"></i></div>
          <div class="service-price">${escapeHtml(item.price || '')}</div>
        </div>
        <h3 class="service-name">${escapeHtml(item.title || 'Colaboración')}</h3>
        <p class="service-copy">${escapeHtml(item.description || '')}</p>
      </article>`,
    )
    .join('');

  const trustedBrands = safeArr(mediaKit.trustedBrands)
    .filter((b: any) => b?.trim())
    .map((b: string) => `<span class="brand-chip">${escapeHtml(b)}</span>`)
    .join('');

  const nameParts = (profile.name || '').trim().split(/\s+/).filter(Boolean);
  const leadingName = nameParts[0] || profile.name || '';
  const trailingName = nameParts.slice(1).join(' ');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Media Kit — ${escapeHtml(profile.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --accent: ${safeAccent};
      --accent-soft: color-mix(in srgb, var(--accent) 20%, white);
      --accent-strong: color-mix(in srgb, var(--accent) 70%, #1a0f0a);
      --page-bg: #fdfbf7;
      --surface: #ffffff;
      --surface-alt: #f5efe7;
      --text: #222222;
      --muted: #676767;
      --line: #e7dfd5;
      --shadow: 0 18px 45px rgba(26,17,11,0.1);
      --shadow-soft: 0 24px 60px rgba(56,38,24,0.08);
      --shadow-strong: 0 36px 90px rgba(56,38,24,0.14);
      --radius-lg: 32px;
      --radius-md: 24px;
      --radius-sm: 999px;
      --font-display: "Cormorant Garamond", Georgia, serif;
      --font-body: "Manrope", "Helvetica Neue", Arial, sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: var(--font-body);
      background:
        radial-gradient(circle at top left, rgba(247,212,184,0.46), transparent 28%),
        radial-gradient(circle at 86% 14%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 25%),
        linear-gradient(180deg, #fffdf9 0%, #fdfbf7 42%, #fbf5ed 100%);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }
    img { display: block; max-width: 100%; }
    a { color: inherit; text-decoration: none; }
    button { font: inherit; cursor: pointer; }

    /* Shell & grid texture */
    .site-shell { position: relative; overflow: hidden; }
    .site-shell::before {
      content: "";
      position: fixed; inset: 0;
      background-image:
        linear-gradient(rgba(34,34,34,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(34,34,34,0.03) 1px, transparent 1px);
      background-size: 28px 28px;
      mask-image: linear-gradient(180deg, rgba(0,0,0,0.24), transparent 70%);
      pointer-events: none;
      opacity: 0.18;
    }

    /* Layout */
    .container { width: min(calc(100% - 32px), 1120px); margin: 0 auto; }
    .section { padding: 104px 0; }
    .section-tight { padding: 44px 0 34px; }
    .eyebrow { margin: 0 0 18px; font-size: 0.74rem; font-weight: 800; letter-spacing: 0.34em; text-transform: uppercase; color: var(--muted); }
    .section-title { margin: 0; font-family: var(--font-display); font-size: clamp(2.6rem, 4.8vw, 4rem); font-weight: 600; line-height: 0.98; letter-spacing: -0.03em; }
    .section-copy { margin: 18px auto 0; max-width: 680px; font-size: 1rem; line-height: 1.78; color: var(--muted); }

    /* Hero */
    .hero { position: relative; min-height: 96vh; display: grid; place-items: center; padding: 88px 0 56px; }
    .hero-backdrop { position: absolute; inset: 0; opacity: 0.42; pointer-events: none; }
    .blob { position: absolute; border-radius: 999px; filter: blur(52px); animation: blob 10s ease-in-out infinite; }
    .blob-one { top: 72px; left: 64px; width: 280px; height: 280px; background: color-mix(in srgb, var(--accent) 56%, white); }
    .blob-two { top: 64px; right: 72px; width: 270px; height: 270px; background: color-mix(in srgb, var(--accent) 22%, #e7cfe0); animation-delay: 2.5s; }
    .blob-three { bottom: 72px; left: 46%; width: 320px; height: 320px; background: color-mix(in srgb, var(--accent) 14%, #f6c8ce); animation-delay: 5s; }
    .hero-inner {
      position: relative; z-index: 1;
      width: min(calc(100% - 32px), 980px);
      margin: 0 auto;
      padding: clamp(32px, 6vw, 64px);
      text-align: center;
      border-radius: 40px;
      background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,249,240,0.84)), linear-gradient(135deg, rgba(247,212,184,0.18), rgba(255,255,255,0));
      border: 1px solid color-mix(in srgb, var(--accent-strong) 12%, transparent);
      box-shadow: var(--shadow-strong);
      backdrop-filter: blur(18px);
      animation: fade-up 0.8s ease-out;
    }
    .hero-inner::before {
      content: "";
      position: absolute; inset: 14px;
      border-radius: 30px;
      border: 1px solid color-mix(in srgb, var(--accent-strong) 12%, transparent);
      pointer-events: none;
    }
    .hero-title { margin: 0; font-family: var(--font-display); font-size: clamp(4.4rem, 12vw, 8.8rem); font-weight: 600; line-height: 0.88; letter-spacing: -0.05em; }
    .hero-title-accent { display: inline-block; margin-left: 0.18em; color: var(--accent); font-style: italic; transform: translateY(0.03em); }
    .hero-tagline { margin: 22px auto 36px; max-width: 640px; font-size: clamp(1.05rem, 2.1vw, 1.35rem); font-weight: 500; line-height: 1.65; color: var(--muted); }
    .hero-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 36px; }
    .hero-print-meta { display: none; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 18px; }
    .hero-print-link { padding: 12px 18px; border-radius: var(--radius-sm); border: 1px solid color-mix(in srgb, var(--accent) 22%, white); background: var(--surface); font-weight: 700; }

    /* Buttons */
    .button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 24px; border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 0.92rem; font-weight: 700; letter-spacing: 0.02em; transition: transform 220ms ease, box-shadow 220ms ease; }
    .button:hover { transform: translateY(-2px); box-shadow: var(--shadow-soft); }
    .button svg { width: 18px; height: 18px; }
    .button-primary { background: linear-gradient(135deg, #1f1b18, #3a2a21); color: #ffffff; }
    .button-secondary { background: rgba(255,255,255,0.72); border-color: rgba(34,34,34,0.08); }
    .button-accent { background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 88%, white), color-mix(in srgb, var(--accent-strong) 82%, white)); color: #fff9f2; }

    /* About */
    .section-about { background: transparent; }
    .about-grid {
      display: grid;
      grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
      align-items: center;
      gap: 72px;
      padding: clamp(24px, 4vw, 36px);
      border-radius: 36px;
      background: linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,248,239,0.64));
      border: 1px solid rgba(34,34,34,0.06);
      box-shadow: var(--shadow-soft);
    }
    .portrait-wrap { position: relative; }
    .portrait-card { position: relative; aspect-ratio: 3/4; overflow: hidden; border-radius: var(--radius-lg); background: #ddd6cc; box-shadow: var(--shadow-strong); transform: rotate(-2deg); }
    .portrait-card::after { content: ""; position: absolute; inset: auto -20px -20px auto; width: 100%; height: 100%; border: 1px solid color-mix(in srgb, var(--accent-strong) 20%, transparent); border-radius: var(--radius-lg); z-index: -1; }
    .portrait-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 700ms ease; }
    .portrait-card:hover img { transform: scale(1.04); }
    .about-copy p { margin: 0 0 18px; font-size: 1.02rem; line-height: 1.9; color: var(--muted); }
    .about-copy .section-title { max-width: none; margin-bottom: 22px; }
    .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
    .chip {
      padding: 10px 16px; border-radius: var(--radius-sm);
      background: linear-gradient(135deg, color-mix(in srgb, var(--accent-soft) 42%, transparent), rgba(255,255,255,0.88));
      border: 1px solid color-mix(in srgb, var(--accent-strong) 12%, transparent);
      color: var(--accent-strong);
      font-size: 0.72rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
    }

    /* Stats */
    .stats-section {
      position: relative;
      background: linear-gradient(180deg, rgba(255,252,247,0.94), rgba(255,247,238,0.86)), var(--surface);
      border-top: 1px solid rgba(34,34,34,0.05);
      border-bottom: 1px solid rgba(34,34,34,0.05);
    }
    .stats-section::before { content: ""; position: absolute; inset: 18px; border: 1px solid color-mix(in srgb, var(--accent-strong) 8%, transparent); border-radius: 38px; pointer-events: none; }
    .stats-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 38px; }
    .stats-updated { padding: 10px 16px; border-radius: var(--radius-sm); background: rgba(255,255,255,0.72); border: 1px solid rgba(34,34,34,0.06); font-size: 0.82rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; margin-bottom: 38px; }
    .metric-card, .panel-card, .service-card {
      position: relative; overflow: hidden; border-radius: var(--radius-md);
      background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,238,229,0.96));
      border: 1px solid rgba(34,34,34,0.06); box-shadow: var(--shadow-soft);
    }
    .metric-card::after, .panel-card::after, .service-card::after {
      content: ""; position: absolute; inset: 0 auto auto 0; width: 100%; height: 4px;
      background: linear-gradient(90deg, color-mix(in srgb, var(--accent-strong) 90%, transparent), color-mix(in srgb, var(--accent-soft) 18%, transparent));
      border-top-left-radius: inherit; border-top-right-radius: inherit; opacity: 0.82;
    }
    .metric-card { padding: 28px 22px; text-align: center; }
    .metric-icon { display: inline-flex; width: 58px; height: 58px; align-items: center; justify-content: center; border-radius: 999px; margin-bottom: 16px; }
    .metric-icon svg, .service-icon svg, .button svg { width: 18px; height: 18px; }
    .tone-accent { background: var(--accent-soft); color: var(--accent-strong); }
    .tone-berry { background: #efdef7; color: #8f52aa; }
    .tone-sky { background: #dbeafe; color: #2563eb; }
    .tone-mint { background: #d9f9eb; color: #14815c; }
    .metric-value { margin: 0; font-family: var(--font-display); font-size: clamp(2.2rem, 3vw, 3rem); font-weight: 700; line-height: 0.95; }
    .metric-label { max-width: 16ch; margin: 10px auto 0; font-size: 0.72rem; line-height: 1.45; letter-spacing: 0.16em; text-transform: uppercase; text-align: center; color: var(--muted); }
    .panel-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
    .panel-card { padding: 32px; }
    .panel-card-wide { grid-column: 1 / -1; }
    .panel-title { margin: 0 0 20px; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.24em; text-transform: uppercase; color: var(--muted); }

    /* Donut chart */
    .audience-bars { display: flex; justify-content: center; min-height: 188px; }
    .audience-donut-wrap { display: grid; justify-items: center; gap: 24px; width: 100%; }
    .audience-donut-chart { position: relative; display: grid; place-items: center; width: 216px; aspect-ratio: 1; }
    .audience-donut-svg { width: 100%; height: 100%; overflow: visible; }
    .audience-donut-track { opacity: 0.9; }
    .audience-donut-segment { transition: stroke-dasharray 220ms ease; }
    .audience-donut-center { position: absolute; inset: 50%; width: 104px; height: 104px; transform: translate(-50%, -50%); border-radius: 999px; background: rgba(255,252,247,0.94); box-shadow: inset 0 0 0 1px rgba(34,34,34,0.05); }
    .audience-legend { display: grid; gap: 10px; width: min(100%, 280px); }
    .audience-legend-item { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 16px; background: rgba(255,255,255,0.74); border: 1px solid rgba(34,34,34,0.05); }
    .audience-legend-swatch { width: 10px; height: 10px; border-radius: 999px; }
    .audience-legend-swatch.tone-accent { background: var(--accent); }
    .audience-legend-swatch.tone-neutral { background: #cfc7be; }
    .audience-legend-swatch.tone-berry { background: #8f52aa; }
    .audience-legend-swatch.tone-sky { background: #2563eb; }
    .audience-legend-label { font-size: 0.92rem; font-weight: 700; }
    .audience-legend-value { font-size: 0.92rem; font-weight: 800; }

    /* Age treemap */
    .range-list { display: block; }
    .age-treemap { display: flex; flex-direction: column; gap: 0; min-height: 288px; overflow: hidden; border-radius: 28px; background: rgba(255,255,255,0.54); border: 1px solid rgba(34,34,34,0.05); }
    .age-treemap-row { display: flex; gap: 0; min-height: 0; }
    .age-tile {
      position: relative; min-width: 0; min-height: 0; border-radius: 0; overflow: hidden;
      background: linear-gradient(180deg, color-mix(in srgb, var(--tile-color) 18%, white), color-mix(in srgb, var(--tile-color) 10%, white)), linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0));
      border: 1px solid rgba(255,255,255,0.7);
    }
    .age-tile-content { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; padding: 20px; }
    .age-tile::after { content: ""; position: absolute; inset: auto -18% -32% auto; width: 140px; height: 140px; border-radius: 999px; background: color-mix(in srgb, var(--tile-color) 14%, white); opacity: 0.8; }
    .age-tile-primary .age-tile-content { padding: 26px; }
    .age-tile-label { font-size: 0.76rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: color-mix(in srgb, var(--tile-color) 64%, #201a16); }
    .age-tile-value { margin-top: 12px; font-family: var(--font-display); font-size: 2.2rem; font-weight: 700; line-height: 0.92; letter-spacing: -0.04em; color: #1d1714; }
    .age-tile-primary .age-tile-value { font-size: clamp(3rem, 4vw, 4.2rem); }
    .age-tile-secondary .age-tile-value { font-size: 1.6rem; }

    /* Countries bar */
    .country-breakdown { display: grid; gap: 18px; }
    .country-stack-bar { display: flex; width: 100%; height: 18px; overflow: hidden; border-radius: 999px; background: #e8dfd5; box-shadow: inset 0 0 0 1px rgba(34,34,34,0.04); }
    .country-stack-segment { display: block; min-width: 0; height: 100%; }
    .country-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 18px; }
    .country-legend-item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 16px; background: rgba(255,255,255,0.74); border: 1px solid rgba(34,34,34,0.05); }
    .country-legend-swatch { width: 10px; height: 10px; border-radius: 999px; }
    .country-legend-label { font-size: 0.98rem; font-weight: 600; }
    .country-value { font-size: 0.96rem; font-weight: 800; text-align: right; }

    /* Portfolio */
    .portfolio-container { position: relative; padding: 0 16px; }
    .portfolio-track { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(280px, 1fr); gap: 22px; overflow-x: auto; scrollbar-width: none; padding-bottom: 10px; }
    .portfolio-track::-webkit-scrollbar { display: none; }
    .portfolio-item { position: relative; aspect-ratio: 4/5; overflow: hidden; border-radius: 28px; background: #ddd6cc; box-shadow: var(--shadow-soft); isolation: isolate; margin: 0; }
    .portfolio-item::after { content: ""; position: absolute; inset: auto 0 0; height: 40%; background: linear-gradient(180deg, transparent, rgba(20,12,8,0.28)); opacity: 0.58; transition: opacity 260ms ease; }
    .portfolio-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 500ms ease; }
    .portfolio-item:hover img { transform: scale(1.04); }
    .portfolio-item:hover::after { opacity: 0.72; }

    /* Services */
    .services-header { text-align: center; margin-bottom: 48px; }
    .service-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
    .service-card { padding: 34px 30px; }
    .service-card:nth-child(1) { background: linear-gradient(180deg, rgba(255,248,241,0.96), rgba(245,238,229,0.96)); }
    .service-card:nth-child(2) { background: linear-gradient(180deg, rgba(253,250,245,0.98), rgba(243,236,227,0.98)); }
    .service-card:nth-child(3) { background: linear-gradient(180deg, rgba(251,245,238,0.96), rgba(244,235,224,0.96)); }
    .service-card:nth-child(4) { background: linear-gradient(180deg, rgba(255,250,244,0.98), rgba(242,233,223,0.98)); }
    .service-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 22px; }
    .service-icon { display: inline-flex; width: 58px; height: 58px; align-items: center; justify-content: center; border-radius: 999px; background: rgba(255,255,255,0.9); border: 1px solid rgba(34,34,34,0.06); }
    .service-price { font-family: var(--font-display); font-size: 2.2rem; font-weight: 700; line-height: 0.95; }
    .service-name { margin: 0 0 12px; font-family: var(--font-display); font-size: 2rem; line-height: 1; }
    .service-copy { margin: 0; color: var(--muted); font-size: 0.98rem; line-height: 1.75; }

    /* Brands */
    .brands-section { position: relative; border-top: 1px solid rgba(34,34,34,0.06); background: linear-gradient(180deg, rgba(255,251,246,0.92), rgba(248,241,232,0.84)); }
    .brands-container { text-align: center; }
    .brand-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px 54px; margin-top: 32px; opacity: 0.76; }
    .brand-chip { font-family: var(--font-display); font-size: clamp(1.8rem, 3vw, 2.6rem); font-weight: 700; letter-spacing: 0.02em; }

    /* Footer */
    .footer {
      width: 100%;
      background: radial-gradient(circle at top, color-mix(in srgb, var(--accent) 20%, transparent), transparent 34%), linear-gradient(180deg, #1e1714 0%, #120f0d 100%);
      color: #ffffff; text-align: center; padding: 104px 16px;
    }
    .footer .section-title { color: var(--accent); }
    .footer-copy { margin: 18px auto 0; max-width: 540px; color: rgba(255,232,214,0.84); }
    .footer-email { display: inline-block; margin-top: 28px; padding: 16px 28px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #fffdf9, #f3e5d4); color: #111111; font-weight: 700; box-shadow: 0 16px 40px rgba(0,0,0,0.18); }
    .footer-legal { margin-top: 34px; font-size: 0.8rem; color: rgba(255,255,255,0.4); }

    /* Utilities */
    .hidden-print { }
    .print-only { display: none; }

    /* Animations */
    @keyframes blob {
      0%   { transform: translate(0,0) scale(1); }
      33%  { transform: translate(32px,-40px) scale(1.08); }
      66%  { transform: translate(-20px,20px) scale(0.92); }
      100% { transform: translate(0,0) scale(1); }
    }
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after { animation: none !important; transition: none !important; }
    }

    /* Responsive */
    @media (max-width: 920px) {
      .section { padding: 76px 0; }
      .about-grid, .panel-grid, .service-grid, .metric-grid { grid-template-columns: 1fr; }
      .stats-header { align-items: flex-start; flex-direction: column; }
      .portfolio-track { grid-auto-columns: minmax(220px, 75vw); }
      .hero-inner { padding: 30px; }
      .about-grid { gap: 42px; }
      .age-treemap { min-height: 240px; border-radius: 24px; }
      .country-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .hero { min-height: auto; padding-top: 96px; }
      .hero-actions { flex-direction: column; align-items: stretch; }
      .button { width: 100%; }
      .audience-bars { min-height: auto; }
      .brand-list { gap: 14px 24px; }
      .hero-title { font-size: 4.4rem; }
      .hero-title-accent { display: block; margin-left: 0; }
      .hero-inner::before, .stats-section::before { display: none; }
      .service-card, .panel-card, .metric-card { padding-left: 22px; padding-right: 22px; }
      .age-tile-content, .age-tile-primary .age-tile-content { padding: 18px; }
      .age-tile-value { font-size: 1.9rem; }
      .age-tile-primary .age-tile-value { font-size: 2.8rem; }
      .country-list { grid-template-columns: 1fr; }
    }

    /* Print */
    @media print {
      @page { size: A4 portrait; margin: 12mm; }
      html, body { background: var(--page-bg) !important; }
      .site-shell::before { display: none !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-shadow: none !important; animation: none !important; transition: none !important; }
      .hero { min-height: auto !important; padding-top: 8mm !important; padding-bottom: 6mm !important; }
      .hero-inner { padding: 0 !important; background: transparent !important; border: 0 !important; backdrop-filter: none !important; }
      .hero-inner::before, .stats-section::before, .metric-card::after, .panel-card::after, .service-card::after { display: none !important; }
      .hero-title { font-size: 2.7rem !important; }
      .hero-tagline { font-size: 1rem !important; margin-top: 10px !important; }
      .section, .section-tight { padding-top: 6mm !important; padding-bottom: 6mm !important; }
      .about-grid { grid-template-columns: minmax(0,0.9fr) minmax(0,1.1fr) !important; align-items: center !important; gap: 6mm !important; padding: 0 !important; background: transparent !important; border: 0 !important; }
      .stats-header { align-items: flex-end !important; flex-direction: row !important; }
      .portfolio-track { grid-auto-flow: row; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 2.5mm !important; overflow: visible !important; padding: 0 !important; }
      .portfolio-container { padding: 0 !important; }
      .portfolio-item { aspect-ratio: 2/3 !important; page-break-inside: avoid; break-inside: avoid; }
      .hidden-print { display: none !important; }
      .print-only { display: block !important; }
      .metric-grid { grid-template-columns: repeat(4,minmax(0,1fr)); gap: 3mm !important; margin-bottom: 5mm !important; }
      .panel-grid, .service-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 4mm !important; }
      .print-page { display: flex; flex-direction: column; justify-content: flex-start; break-inside: avoid; page-break-inside: avoid; }
      .print-page-cover { min-height: calc(297mm - 24mm); break-after: page; page-break-after: always; }
      .print-page-stats, .print-page-offers { min-height: calc(297mm - 24mm); break-after: page; page-break-after: always; }
      .print-page-brands { min-height: calc(297mm - 24mm); justify-content: center; }
      .about-grid, .metric-card, .metric-grid, .panel-card, .panel-grid, .portfolio-item, .service-card, .service-grid, .brand-list { break-inside: avoid; page-break-inside: avoid; }
      .hero-backdrop, .portrait-card::after { display: none !important; }
      .metric-card { padding: 4mm 3mm !important; background: var(--surface-alt) !important; }
      .metric-label { font-size: 0.67rem !important; line-height: 1.3 !important; letter-spacing: 0.08em !important; }
      .age-treemap { min-height: 48mm !important; border-radius: 4mm !important; }
      .age-treemap-row { gap: 0 !important; }
      .age-tile { border-radius: 0 !important; }
      .age-tile-content, .age-tile-primary .age-tile-content { padding: 3.2mm !important; }
      .age-tile-label { font-size: 0.64rem !important; letter-spacing: 0.08em !important; }
      .age-tile-value { font-size: 1.12rem !important; }
      .age-tile-primary .age-tile-value { font-size: 1.9rem !important; }
      .age-tile-secondary .age-tile-value { font-size: 0.92rem !important; }
      .country-breakdown { gap: 3mm !important; }
      .country-stack-bar { height: 5mm !important; }
      .country-list { grid-template-columns: repeat(3,minmax(0,1fr)) !important; gap: 2mm 3mm !important; }
      .audience-donut-wrap { gap: 3mm !important; }
      .audience-donut-chart { width: 42mm !important; }
      .audience-donut-center { width: 21mm !important; height: 21mm !important; }
      .audience-legend { width: 100% !important; gap: 2mm !important; }
      .audience-legend-item { padding: 2mm 2.5mm !important; border-radius: 4mm !important; }
      .audience-legend-label, .audience-legend-value { font-size: 0.72rem !important; }
      .country-legend-item { padding: 2mm 2.5mm !important; border-radius: 4mm !important; gap: 2mm !important; }
      .country-legend-label, .country-value { font-size: 0.72rem !important; }
      .services-header { margin-bottom: 4mm !important; }
      .service-card { padding: 4mm !important; }
      .service-top { margin-bottom: 3mm !important; }
      .service-icon { width: 11mm !important; height: 11mm !important; }
      .service-price { font-size: 1.3rem !important; }
      .service-name { font-size: 1.02rem !important; margin-bottom: 1.5mm !important; }
      .service-copy { font-size: 0.8rem !important; line-height: 1.45 !important; }
      .brand-list { gap: 3mm 8mm !important; margin-top: 4mm !important; }
      .brand-chip { font-size: 1.2rem !important; }
      .print-page-brands .brands-section { border-top: 0 !important; display: flex; align-items: center; flex: 1; }
      .print-page-brands .brands-container { width: 100%; display: grid; align-content: center; gap: 4mm; }
      .print-page-brands .brand-list { display: grid !important; grid-template-columns: repeat(3,minmax(0,1fr)); align-items: center; gap: 10mm 8mm !important; margin-top: 8mm !important; }
      .print-page-brands .brand-chip { font-size: 1.8rem !important; }
      .hero-print-meta { display: flex !important; margin-top: 4mm !important; gap: 3mm !important; }
      .hero-print-link { padding: 3mm 4mm !important; }
      .print-page-cover .hero { padding-top: 3mm !important; padding-bottom: 3mm !important; }
      .print-page-cover .hero-title { font-size: 2.35rem !important; }
      .print-page-cover .hero-tagline { max-width: 100% !important; margin: 2.5mm auto 3mm !important; font-size: 0.92rem !important; line-height: 1.4 !important; }
      .print-page-cover .about-grid { display: block !important; }
      .print-page-cover .portrait-wrap { float: left; width: 39% !important; margin: 0 5mm 2mm 0; }
      .print-page-cover .portrait-card { aspect-ratio: 3/4 !important; }
      .print-page-cover .about-copy .section-title { margin-bottom: 3mm !important; max-width: none !important; font-size: 3.3rem !important; line-height: 0.92 !important; }
      .print-page-cover .about-copy p { margin-bottom: 2.2mm !important; font-size: 1.19rem !important; line-height: 1.4 !important; }
      .print-page-cover .chips { margin-top: 3mm !important; gap: 1.8mm !important; }
      .print-page-cover .chip { padding: 1.6mm 2.4mm !important; font-size: 0.75rem !important; letter-spacing: 0.08em !important; }
    }
  </style>
</head>
<body>
  <div class="site-shell">

    <div class="print-page print-page-cover">
      <header class="hero">
        <div class="hero-backdrop" aria-hidden="true">
          <div class="blob blob-one"></div>
          <div class="blob blob-two"></div>
          <div class="blob blob-three"></div>
        </div>
        <div class="hero-inner">
          <p class="eyebrow">${escapeHtml(mediaKit.periodLabel)}</p>
          <h1 class="hero-title">
            ${escapeHtml(leadingName)}${trailingName ? `<span class="hero-title-accent"> ${escapeHtml(trailingName)}</span>` : ''}
          </h1>
          <p class="hero-tagline">${escapeHtml(mediaKit.tagline)}</p>
          <div class="hero-print-meta print-only">
            ${mediaKit.contactEmail ? `<a class="hero-print-link" href="mailto:${escapeHtml(mediaKit.contactEmail)}">${escapeHtml(mediaKit.contactEmail)}</a>` : ''}
          </div>
          <div class="hero-actions hidden-print">
            ${socialLinks}
            ${mediaKit.contactEmail ? `<a class="button button-secondary" href="mailto:${escapeHtml(mediaKit.contactEmail)}"><i data-lucide="mail"></i>Contacto</a>` : ''}
            <button class="button button-accent" type="button" data-print-trigger><i data-lucide="download"></i>Descargar PDF</button>
          </div>
        </div>
      </header>

      <section class="section section-about">
        <div class="container about-grid">
          <div class="portrait-wrap">
            <div class="portrait-card">
              <img src="${escapeHtml(mediaKit.featuredImage || profile.avatar)}" alt="${escapeHtml(profile.name)}" />
            </div>
          </div>
          <div class="about-copy">
            <h2 class="section-title">${escapeHtml(mediaKit.aboutTitle)}</h2>
            ${aboutParagraphs}
            ${topicTags ? `<div class="chips">${topicTags}</div>` : ''}
          </div>
        </div>
      </section>
    </div>

    <div class="print-page print-page-stats">
      <section class="section stats-section">
        <div class="container">
          <div class="stats-header">
            <h2 class="section-title">Community Insights</h2>
            ${mediaKit.updatedLabel ? `<div class="stats-updated">${escapeHtml(mediaKit.updatedLabel)}</div>` : ''}
          </div>
          ${insightCards ? `<div class="metric-grid">${insightCards}</div>` : ''}
          <div class="panel-grid">
            ${genderChart ? `<article class="panel-card"><h3 class="panel-title">Audiencia</h3><div class="audience-bars">${genderChart}</div></article>` : ''}
            ${ageTreemap ? `<article class="panel-card"><h3 class="panel-title">Rango de Edad</h3><div class="range-list">${ageTreemap}</div></article>` : ''}
            ${countriesBar ? `<article class="panel-card panel-card-wide"><h3 class="panel-title">Top Countries</h3>${countriesBar}</article>` : ''}
          </div>
        </div>
      </section>
    </div>

    <div class="print-page print-page-offers">
      ${portfolioImages ? `
      <section class="section-tight section-portfolio">
        <div class="portfolio-container">
          <div class="portfolio-track">${portfolioImages}</div>
        </div>
      </section>` : ''}

      ${offerings ? `
      <section class="section section-services">
        <div class="container">
          <div class="services-header">
            <h2 class="section-title">${escapeHtml(mediaKit.servicesTitle)}</h2>
            ${mediaKit.servicesDescription ? `<p class="section-copy">${escapeHtml(mediaKit.servicesDescription)}</p>` : ''}
          </div>
          <div class="service-grid">${offerings}</div>
        </div>
      </section>` : ''}
    </div>

    ${trustedBrands ? `
    <div class="print-page print-page-brands">
      <section class="section brands-section">
        <div class="container brands-container">
          ${mediaKit.brandsTitle ? `<p class="eyebrow">${escapeHtml(mediaKit.brandsTitle)}</p>` : ''}
          <div class="brand-list">${trustedBrands}</div>
        </div>
      </section>
    </div>` : ''}

    <footer class="footer hidden-print">
      <div class="container">
        ${mediaKit.closingTitle ? `<h2 class="section-title">${escapeHtml(mediaKit.closingTitle)}</h2>` : ''}
        ${mediaKit.closingDescription ? `<p class="footer-copy">${escapeHtml(mediaKit.closingDescription)}</p>` : ''}
        ${mediaKit.contactEmail ? `<a class="footer-email" href="mailto:${escapeHtml(mediaKit.contactEmail)}">${escapeHtml(mediaKit.contactEmail)}</a>` : ''}
        ${mediaKit.footerNote ? `<p class="footer-legal">&copy; ${new Date().getFullYear()} ${escapeHtml(profile.name)}. ${escapeHtml(mediaKit.footerNote)}</p>` : ''}
      </div>
    </footer>

  </div>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>
    (function() {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
      var trigger = document.querySelector('[data-print-trigger]');
      if (trigger) trigger.addEventListener('click', function() { window.print(); });
    })();
  </script>
</body>
</html>`;
}

export function createMediaKitRouter(pool: pg.Pool) {
  const router = Router();

  router.get('/:handle', async (req, res) => {
    try {
      let handle = decodeURIComponent(req.params.handle).trim();
      if (!handle) {
        return res.status(404).send('No encontrado');
      }
      if (!handle.startsWith('@')) {
        handle = `@${handle}`;
      }

      const result = await pool.query(
        `SELECT up.name, up.avatar, up.handle, up.social_profiles, up.media_kit,
                s.accent_color
         FROM user_profile up
         JOIN user_settings s ON s.user_id = up.user_id
         WHERE LOWER(up.handle) = LOWER($1)
         LIMIT 1`,
        [handle],
      );

      if (result.rows.length === 0) {
        return res.status(404).send('Media Kit no encontrado');
      }

      const row = result.rows[0];
      const profile = {
        name: row.name || '',
        avatar: row.avatar || '',
        handle: row.handle || '',
        socialProfiles: { ...createEmptySocialProfiles(), ...(row.social_profiles || {}) },
      };
      const mediaKit: MediaKitProfile = { ...createDefaultMediaKitProfile(), ...(row.media_kit || {}) };
      const accentColor = row.accent_color || '#6366f1';

      const html = generateMediaKitHtml(profile, mediaKit, accentColor);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.send(html);
    } catch (error) {
      console.error('Error serving media kit:', error);
      res.status(500).send('Error interno');
    }
  });

  return router;
}
