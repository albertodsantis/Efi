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

function generateMediaKitHtml(
  profile: { name: string; avatar: string; handle: string; socialProfiles: SocialProfiles },
  mediaKit: MediaKitProfile,
  accentColor: string,
) {
  const socialLinks = socialPlatforms
    .map(({ key }) => {
      const value = (profile.socialProfiles?.[key] || '').trim();
      const href = buildSocialHref(key, value);
      if (!value || !href) return '';
      return `<a class="pill-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`;
    })
    .filter(Boolean)
    .join('');

  const insightCards = safeArr(mediaKit.insightStats)
    .filter((item: any) => item?.label?.trim() || item?.value?.trim())
    .map(
      (item) => `
        <article class="metric-card">
          <div class="metric-value">${escapeHtml(item.value || '-')}</div>
          <div class="metric-label">${escapeHtml(item.label || 'Dato')}</div>
        </article>`,
    )
    .join('');

  const audienceCards = safeArr(mediaKit.audienceGender)
    .filter((item: any) => item?.label?.trim() || item?.value?.trim())
    .map(
      (item) => `
        <article class="list-card">
          <div class="list-label">${escapeHtml(item.label || 'Segmento')}</div>
          <div class="list-value">${escapeHtml(item.value || '-')}</div>
        </article>`,
    )
    .join('');

  const ageCards = safeArr(mediaKit.ageDistribution)
    .filter((item: any) => item?.label?.trim() || item?.value?.trim())
    .map(
      (item) => `
        <article class="list-card">
          <div class="list-label">${escapeHtml(item.label || 'Rango')}</div>
          <div class="list-value">${escapeHtml(item.value || '-')}</div>
        </article>`,
    )
    .join('');

  const countryRows = safeArr(mediaKit.topCountries)
    .filter((item: any) => item?.label?.trim() || item?.value?.trim())
    .map(
      (item) => `
        <div class="country-row">
          <span>${escapeHtml(item.label || 'Pais')}</span>
          <strong>${escapeHtml(item.value || '-')}</strong>
        </div>`,
    )
    .join('');

  const aboutParagraphs = safeArr(mediaKit.aboutParagraphs)
    .filter((p: any) => p?.trim())
    .map((p: string) => `<p>${escapeHtml(p)}</p>`)
    .join('');

  const topicTags = safeArr(mediaKit.topicTags)
    .filter((t: any) => t?.trim())
    .map((t: string) => `<span class="tag">#${escapeHtml(t.replace(/^#/, ''))}</span>`)
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
      (item) => `
        <article class="offer-card">
          <div class="offer-price">${escapeHtml(item.price || '-')}</div>
          <h3>${escapeHtml(item.title || 'Colaboracion')}</h3>
          <p>${escapeHtml(item.description || '')}</p>
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
  <style>
    :root { --accent: ${accentColor}; --text: #1f2937; --muted: #64748b; --surface: #ffffff; --soft: #f8fafc; --line: rgba(148, 163, 184, 0.22); }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--text); background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%); -webkit-font-smoothing: antialiased; }
    .page { max-width: 1120px; margin: 0 auto; padding: 48px 28px 72px; }
    .hero, .section { background: rgba(255,255,255,0.92); border: 1px solid var(--line); border-radius: 28px; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.06); }
    .hero { padding: 40px; }
    .eyebrow { font-size: 12px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
    h1 { margin: 14px 0 0; font-size: 64px; line-height: 0.96; letter-spacing: -0.06em; }
    .accent { color: var(--accent); }
    .tagline { margin: 18px 0 0; max-width: 680px; font-size: 18px; line-height: 1.6; color: #334155; }
    .pill-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
    .pill-link { display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 999px; background: var(--soft); color: var(--text); font-size: 13px; font-weight: 700; text-decoration: none; }
    .pill-link.primary { background: var(--accent); color: white; }
    .grid { display: grid; gap: 24px; margin-top: 24px; }
    .two-col { grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr); }
    .section { padding: 32px; }
    .section h2 { margin: 0; font-size: 30px; letter-spacing: -0.04em; }
    .section-head { display: flex; justify-content: space-between; gap: 16px; align-items: end; margin-bottom: 24px; }
    .section-copy { margin-top: 10px; color: var(--muted); line-height: 1.7; }
    .about-layout { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 28px; align-items: start; }
    .about-image { width: 100%; height: 420px; object-fit: cover; border-radius: 24px; }
    .about-copy p { margin: 0 0 16px; line-height: 1.8; color: #334155; }
    .tag-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
    .tag { display: inline-flex; align-items: center; min-height: 38px; padding: 0 14px; border-radius: 999px; background: rgba(15, 23, 42, 0.04); font-size: 12px; font-weight: 700; color: #334155; }
    .metrics-grid, .list-grid, .offer-grid { display: grid; gap: 16px; }
    .metrics-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .list-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .metric-card, .list-card, .offer-card { border-radius: 22px; background: var(--soft); padding: 22px; }
    .metric-value, .list-value, .offer-price { font-size: 32px; font-weight: 800; letter-spacing: -0.05em; }
    .metric-label, .list-label { margin-top: 8px; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
    .country-list { display: grid; gap: 12px; }
    .country-row { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 16px 18px; border-radius: 18px; background: var(--soft); }
    .country-row span { color: #334155; font-weight: 600; }
    .portfolio-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .portfolio-item { margin: 0; border-radius: 22px; overflow: hidden; background: var(--soft); min-height: 220px; }
    .portfolio-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .offer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .offer-card h3 { margin: 16px 0 0; font-size: 20px; letter-spacing: -0.03em; }
    .offer-card p { margin: 10px 0 0; color: var(--muted); line-height: 1.7; }
    .brand-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .brand-chip { display: inline-flex; align-items: center; min-height: 42px; padding: 0 16px; border-radius: 999px; background: var(--soft); font-size: 13px; font-weight: 700; }
    .footer-section { text-align: center; padding: 36px 32px; }
    .footer-section a { color: var(--text); font-weight: 700; text-decoration: none; }
    .footer-note { margin-top: 18px; color: var(--muted); font-size: 13px; }
    @media (max-width: 900px) { h1 { font-size: 48px; } .two-col, .about-layout, .metrics-grid, .offer-grid, .list-grid, .portfolio-grid { grid-template-columns: 1fr; } .hero, .section { padding: 24px; } }
    @media print { body { background: white; } .page { padding: 0; } }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div class="eyebrow">${escapeHtml(mediaKit.periodLabel)}</div>
      <h1>${escapeHtml(leadingName)}${trailingName ? ` <span class="accent">${escapeHtml(trailingName)}</span>` : ''}</h1>
      <p class="tagline">${escapeHtml(mediaKit.tagline)}</p>
      <div class="pill-row">
        ${socialLinks}
        <a class="pill-link" href="mailto:${escapeHtml(mediaKit.contactEmail)}">${escapeHtml(mediaKit.contactEmail)}</a>
        <a class="pill-link primary" href="#" onclick="window.print(); return false;">Descargar PDF</a>
      </div>
    </section>

    <div class="grid two-col">
      <section class="section">
        <div class="about-layout">
          <img class="about-image" src="${escapeHtml(mediaKit.featuredImage || profile.avatar)}" alt="${escapeHtml(profile.name)}" />
          <div class="about-copy">
            <h2>${escapeHtml(mediaKit.aboutTitle)}</h2>
            <div class="section-copy">${aboutParagraphs}</div>
            <div class="tag-row">${topicTags}</div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <h2>Community Insights</h2>
            <p class="section-copy">Actualizado: ${escapeHtml(mediaKit.updatedLabel)}</p>
          </div>
        </div>
        <div class="metrics-grid">${insightCards}</div>
        <div class="grid">
          <div>
            <h2 style="font-size:24px;">Audiencia</h2>
            <div class="list-grid" style="margin-top:16px;">${audienceCards}</div>
          </div>
          <div>
            <h2 style="font-size:24px;">Rango de Edad</h2>
            <div class="list-grid" style="margin-top:16px;">${ageCards}</div>
          </div>
          <div>
            <h2 style="font-size:24px;">Top Countries</h2>
            <div class="country-list" style="margin-top:16px;">${countryRows}</div>
          </div>
        </div>
      </section>
    </div>

    <section class="section" style="margin-top:24px;">
      <div class="section-head">
        <div>
          <h2>Portfolio</h2>
          <p class="section-copy">Seleccion de imagenes y piezas destacadas para mostrar el estilo de trabajo.</p>
        </div>
      </div>
      <div class="portfolio-grid">${portfolioImages}</div>
    </section>

    <section class="section" style="margin-top:24px;">
      <div class="section-head">
        <div>
          <h2>${escapeHtml(mediaKit.servicesTitle)}</h2>
          <p class="section-copy">${escapeHtml(mediaKit.servicesDescription)}</p>
        </div>
      </div>
      <div class="offer-grid">${offerings}</div>
    </section>

    <section class="section" style="margin-top:24px;">
      <div class="section-head">
        <div>
          <h2>${escapeHtml(mediaKit.brandsTitle)}</h2>
        </div>
      </div>
      <div class="brand-row">${trustedBrands}</div>
    </section>

    <section class="section footer-section" style="margin-top:24px;">
      <h2>${escapeHtml(mediaKit.closingTitle)}</h2>
      <p class="section-copy">${escapeHtml(mediaKit.closingDescription)}</p>
      <p style="margin-top:18px;">
        <a href="mailto:${escapeHtml(mediaKit.contactEmail)}">${escapeHtml(mediaKit.contactEmail)}</a>
      </p>
      <p class="footer-note">&copy; ${new Date().getFullYear()} ${escapeHtml(profile.name)}. ${escapeHtml(mediaKit.footerNote)}</p>
    </section>
  </main>
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
      // Normalize: ensure it starts with @
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
