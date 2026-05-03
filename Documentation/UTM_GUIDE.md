# UTM Guide

Guía rápida para etiquetar URLs de Efi cuando se comparten en redes, email o cualquier canal externo. PostHog detecta los UTMs automáticamente y los asocia al usuario en su person profile (vía `$initial_utm_*`).

---

## Reglas básicas

- **Siempre** usa `utm_source`, `utm_medium`, `utm_campaign`. Los otros (`utm_content`, `utm_term`) solo si haces A/B testing.
- Mantén nombres en minúsculas y sin espacios (usa `_` o `-`).
- `utm_campaign` cambia con cada iniciativa (`launch_2026`, `black_friday`, `feature_x`); el resto se mantiene estable.
- Para URLs **internas que generan los usuarios** (compartir EfiLink, link de referido) los UTMs ya se añaden automáticamente desde el código — no hacer nada manual ahí.

---

## Tabla de URLs listas para copy-paste

Para compartir la **landing principal** (`https://efidesk.com/`):

| Canal | URL |
|---|---|
| Twitter / X | `https://efidesk.com/?utm_source=twitter&utm_medium=social&utm_campaign=launch_2026` |
| Instagram (bio o post) | `https://efidesk.com/?utm_source=instagram&utm_medium=social&utm_campaign=launch_2026` |
| LinkedIn | `https://efidesk.com/?utm_source=linkedin&utm_medium=social&utm_campaign=launch_2026` |
| TikTok bio | `https://efidesk.com/?utm_source=tiktok&utm_medium=social&utm_campaign=launch_2026` |
| YouTube descripción | `https://efidesk.com/?utm_source=youtube&utm_medium=social&utm_campaign=launch_2026` |
| Newsletter / email masivo | `https://efidesk.com/?utm_source=newsletter&utm_medium=email&utm_campaign=launch_2026` |
| ProductHunt | `https://efidesk.com/?utm_source=producthunt&utm_medium=referral&utm_campaign=launch_2026` |
| WhatsApp (grupos, broadcast) | `https://efidesk.com/?utm_source=whatsapp&utm_medium=social&utm_campaign=launch_2026` |
| Telegram | `https://efidesk.com/?utm_source=telegram&utm_medium=social&utm_campaign=launch_2026` |
| Reddit | `https://efidesk.com/?utm_source=reddit&utm_medium=social&utm_campaign=launch_2026` |
| Discord | `https://efidesk.com/?utm_source=discord&utm_medium=social&utm_campaign=launch_2026` |
| Firma de email personal | `https://efidesk.com/?utm_source=email_signature&utm_medium=email&utm_campaign=evergreen` |
| Podcast (descripción episodio) | `https://efidesk.com/?utm_source=podcast&utm_medium=referral&utm_campaign=launch_2026` |
| Blog post de terceros | `https://efidesk.com/?utm_source=guest_post&utm_medium=referral&utm_campaign=launch_2026` |
| Anuncio Meta (Facebook/IG) | `https://efidesk.com/?utm_source=meta&utm_medium=cpc&utm_campaign=launch_2026` |
| Anuncio Google Ads | `https://efidesk.com/?utm_source=google&utm_medium=cpc&utm_campaign=launch_2026` |

---

## Convención de valores

### `utm_source` (de dónde viene)
La plataforma específica: `twitter`, `instagram`, `linkedin`, `tiktok`, `newsletter`, `producthunt`, `whatsapp`, `meta`, `google`, etc.

### `utm_medium` (tipo de canal)
- `social` → redes sociales
- `email` → newsletters, firmas, emails directos
- `cpc` → tráfico pagado (anuncios)
- `referral` → menciones en blogs/podcasts/sitios de terceros
- `organic` → SEO (no suele ponerse manualmente)

### `utm_campaign` (qué iniciativa)
Cambia según lo que estés impulsando. Ejemplos:
- `launch_2026` → campaña de lanzamiento general
- `evergreen` → contenido que no caduca (firma de email, bio)
- `feature_efilink_v2` → push de una feature nueva
- `black_friday`, `cyber_monday` → ofertas estacionales
- `referral_program` → empuje del programa de referidos

---

## URLs auto-etiquetadas por el código

Estas ya llevan UTMs sin que tengas que hacer nada — cuando un usuario las copia/comparte:

| Origen | UTMs añadidos |
|---|---|
| Botón "Copiar EfiLink" en `Profile.tsx` | `utm_source=efilink&utm_medium=user_share&utm_campaign=user_profile` |
| Link de referido en `ReferralsSection.tsx` | `utm_source=referral&utm_medium=user&utm_campaign=referral_program` (además de `?ref=CODIGO`) |

---

## Cómo ver los datos en PostHog

- **Web analytics → Sources** — ranking automático por `utm_source` en visitas
- **Insights → New** → filtrar por `$initial_utm_source = twitter` (etc.) para medir conversiones
- **Persons** → cada usuario tiene `initial_utm_source`, `initial_utm_medium`, `initial_utm_campaign` y `initial_referrer` como propiedades persistidas — filtrables en cualquier dashboard

---

## Atajo: builder mental

Si tienes dudas sobre cómo etiquetar algo nuevo:

1. **¿De qué plataforma?** → eso es `utm_source`
2. **¿Es red social, email, anuncio o mención?** → eso es `utm_medium`
3. **¿Para qué push estás compartiendo esto?** → eso es `utm_campaign`

Si no sabés `utm_campaign`, default a `evergreen`.
