# I18N Progress — Spanish + English

## Goal

Soportar dos idiomas en Efi: **Español (default)** y **English**. Cada usuario elige idioma en Ajustes; visitantes no logueados pueden cambiarlo en el toggle del Landing.

## Tech stack

- **Library:** `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- **Bundle strategy:** todos los locales cargados al inicio (no lazy). Si crece el bundle, migrar a lazy loading después.
- **Persistence:** columna `users.locale` (`'es' | 'en'`, default `'es'`, CHECK constraint). Migration `031_user_locale.sql`.
- **Detection (no logged):** `navigator.language` → `localStorage` (`efi:locale`). Visitor toggle persiste en `localStorage`.
- **Logged user:** locale viaja en `SessionUser.locale` (en `/api/auth/me` y endpoints de login). Cambios via `PATCH /api/auth/locale`.

## Phase 1 — Foundation (DONE)

Files touched:

- `apps/api/src/db/migrations/031_user_locale.sql` — added `locale` column.
- `packages/shared/src/contracts/auth.ts` — added `Locale`, `SUPPORTED_LOCALES`, `UpdateLocaleRequest`, `UpdateLocaleResponse`. Extended `SessionUser` with `locale`.
- `apps/api/src/routes/auth.ts` — `loadPlanFields` and `withPlan` include locale; new `PATCH /locale` endpoint.
- `apps/web/src/lib/api.ts` — `authApi.updateLocale`.
- `apps/web/src/i18n/index.ts` — bootstrap with detection, `setI18nLocale` helper, `isSupportedLocale`, `resolveLocale`, `DEFAULT_LOCALE`.
- `apps/web/src/main.tsx` — imports `./i18n` before render.
- `apps/web/src/context/AppContext.tsx` — exposes `locale`, `setLocale`. Sincroniza i18next, hace rollback si la API falla.
- `apps/web/src/App.tsx` — pasa `initialLocale` y `onLocaleChange` al `AppProvider`.
- `apps/web/src/views/Settings.tsx` — selector ES/EN segmentado en sección Preferencias.
- `apps/web/src/views/Landing.tsx` — toggle ES/EN en el nav.

## Phase 2 — String extraction by view (IN PROGRESS)

Patrón establecido por vista:

1. Crear `apps/web/src/i18n/locales/es/<view>.json` y `en/<view>.json`.
2. Registrar en `apps/web/src/i18n/index.ts` (resources + ns array).
3. En la view: `const { t } = useTranslation('<view>')`.
4. Sacar `locale` del `useAppContext()` para fechas/monedas.
5. Helper top-level: `const localeToBcp47 = (locale: Locale): string => locale === 'en' ? 'en-US' : 'es-ES';`
6. Parametrizar `formatCurrency(value, locale)` y `formatTaskDate(value, locale, options?)` — NO hardcodear `'es-ES'`.
7. Reemplazar todos los string literales españoles con `t('key')`.
8. **Status canónico**: `task.status` sigue siendo `'Pendiente' | 'En Progreso' | 'En Revisión' | 'Completada' | 'Cobrado'` (clave que viaja al backend). El display usa `t(`taskStatus.${task.status}`)`.
9. **Pluralización**: usar `key_one` / `key_other` con `{{count}}` (i18next nativo).
10. **Strings con HTML embebido** (ej. `<strong>`): usar `<Trans>` de `react-i18next` con `components={{ strong: <strong className="..." /> }}`.
11. **Placeholder con `{{var}}` literal** (ej. `"Hola {{contactName}}..."` que NO debe interpolarse): déjalo como key normal — si no pasas `{ contactName: ... }` en options, i18next devuelve el string tal cual.
12. Ignorar warnings IDE de Tailwind canonical syntax (`bg-[var(--x)]` → `bg-(--x)`) — son preexistentes en el proyecto, fuera del alcance de i18n.
13. Correr `npm run lint` al final de cada view.

### Vistas completadas

- ✅ **Landing** (655 líneas) — `landing.json`. Hero con `<Trans>` para `<strong>` embebidos. Footer con interpolación de año.
- ✅ **Settings** (1340 líneas) — `settings.json`. 8 secciones (plan, templates, pipeline, appearance, onboarding, preferences, account + modales). Pluralización en `disabledToastWithMoves` y `descriptionWithTasks`.
- ✅ **Dashboard** (1522 líneas) — `dashboard.json`. **29 placas/badges** (label + descripción + 5 secciones + sistema de placas secretas). `BadgeDef` refactorizado a solo `{ key, icon, secret? }`; labels/descriptions vienen del JSON. `SECRET_REVEALED_ICONS` solo guarda iconos.
- ✅ **Pipeline** (2652 líneas) — `pipeline.json`. Días de semana + monthCalendarWeekdays. WeekCalendar + MonthCalendar + Kanban + List + modales con form completo. Status display traducido pero clave canónica preservada.

### Vistas pendientes (orden recomendado)

1. **Directory** (`apps/web/src/views/Directory.tsx`) — clientes y contactos
2. **Profile / EfiLink** (`apps/web/src/views/Profile.tsx`) — composer del enlace público
3. **StrategicView** (`apps/web/src/views/StrategicView.tsx`) — metas y métricas
4. **WelcomeOnboarding** + **WelcomeColorPicker** — flujo de primer uso
5. **ResetPassword** — vista de reset de contraseña

### Componentes compartidos pendientes

`AIAssistant`, `Toaster`, `ConfirmDialog`, `MoreOptionsMenu`, `NotificationBell`, `LegalModal`, `OnboardingTour`, `EfisystemWidget`, `LevelsModal`, `UpgradeModal`, `ReferralsSection`, `ImageUpload`, `ErrorBoundary`.

Estrategia: agruparlos en un namespace `components.json` o crear uno por componente cuando sea grande (ej. `aiAssistant.json`).

## Phase 3 — Backend i18n (PENDING)

- Emails (Resend templates) — usar el `locale` del usuario receptor.
- AI Assistant (Gemini) system prompt — ramificar según `req.user.locale`.
- Mensajes de error de la API — middleware que elija el idioma según sesión.

## Phase 4 — QA visual (PENDING)

- Inglés ~20-30% más corto en general, pero CTAs y términos legales pueden ser más largos. Revisar overflow en botones, nav, badges.
- Probar fechas/monedas en ambos idiomas.
- Probar flujo completo: registro nuevo (debe detectar `navigator.language`), cambio en Ajustes, persistencia entre dispositivos.

## Decisiones tomadas (no re-litigar)

- Columna `locale` va en `users` (identitaria, junto a `provider`), no en `user_settings`.
- Bundle único, no lazy loading por ahora.
- Detección por `navigator.language` para usuarios nuevos; fallback a `'es'` si no es `en*`.
- EfiLink público (`/@handle`) respetará el locale del **dueño**, no del visitante (más simple).
- AI Assistant + emails se localizarán en Phase 3.
- "Español neutro" — ya hay memoria de no usar argentinismos. Mantener tono tuteo estándar.

## Cómo retomar mañana

1. Lee este archivo.
2. Lee la vista pendiente (empieza con Directory).
3. Sigue el patrón de Phase 2.
4. Crea JSON, registra namespace, reemplaza strings, lint.
5. Actualiza este archivo marcando la vista como completada.

## Comando útil

```bash
npm run lint  # tsc --noEmit, validación rápida
```
