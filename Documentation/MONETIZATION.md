# Monetization Plan

Estado y playbook para activar el modelo freemium de Efi. Mientras `EARLY_ACCESS=true`, todos los usuarios tienen Pro gratis sin restricciones.

## Decisión clave

**Flag global (`EARLY_ACCESS`), no trial individual largo.**

- Descartado: asignar `trial_ends_at = NOW() + 365d` a cada usuario al registrarse. Motivo: cuando llegue la fecha de monetización, los early adopters verían la app caerse en Free de forma abrupta y desigual según cuándo se registraron.
- Elegido: flag global que bypasea cualquier chequeo. Cuando se apague, se corre un backfill único que le da a todos los usuarios existentes el mismo período de trial (ej. 30 días desde hoy). Más control, transición simétrica.

## Qué está armado hoy

### Base de datos
- `apps/api/src/db/migrations/023_plans.sql` — agrega a `users`:
  - `plan TEXT NOT NULL DEFAULT 'pro'`
  - `trial_ends_at TIMESTAMPTZ` (NULL)
  - `subscribed_until TIMESTAMPTZ` (NULL)

### Backend
- `apps/api/src/config/env.ts` — `EARLY_ACCESS: boolean` (default `true`; se apaga con `EARLY_ACCESS=false`).
- `apps/api/src/routes/auth.ts` — `/me`, `/login`, `/register` y callbacks de Google devuelven `plan`, `trialEndsAt`, `subscribedUntil`, `earlyAccess` en el `SessionUser`.

### Shared
- `packages/shared/src/plans.ts` — fuente única de verdad:
  - `PLAN_LIMITS` — límites Free vs Pro (partners, tasks, IA, GCal sync, branding, export)
  - `PLAN_PRICING` — US$9/mes, US$86/año, 20% descuento anual
  - `PLAN_FEATURES` — filas de la tabla comparativa del modal
  - `isPro(state)` — helper puro; respeta `earlyAccess`, `subscribedUntil`, `trialEndsAt`
  - `trialDaysRemaining(state)` — días restantes de trial (o `null`)
- `packages/shared/src/contracts/auth.ts` — `SessionUser` extendido con campos de plan.

### Frontend
- `apps/web/src/context/AppContext.tsx` — expone `planState: PlanState`.
- `apps/web/src/components/UpgradeModal.tsx` — modal de planes (toggle Mensual/Anual, comparativa Free vs Pro, CTA deshabilitado con aviso de acceso anticipado).
- `apps/web/src/views/Settings.tsx` — sección "Plan" arriba con badge y botón "Ver planes".

## Switch a modo pago

Cuando se decida activar la monetización:

### 1. Backfill de trials para usuarios existentes

```sql
UPDATE users
SET trial_ends_at = NOW() + INTERVAL '30 days'
WHERE trial_ends_at IS NULL
  AND subscribed_until IS NULL;
```

### 2. Apagar early access

Setear `EARLY_ACCESS=false` en el entorno de producción (Railway). A partir de ahí, `isPro()` respeta fechas reales.

### 3. Nuevos usuarios

Agregar en `auth.ts` (register + callbacks Google): al crear el `users` row, setear `trial_ends_at = NOW() + INTERVAL '30 days'`. Hoy esto no se hace porque con el flag prendido es irrelevante.

## TODOs antes de activar pagos

### Integración de pagos
- [ ] Elegir proveedor: **Stripe** (global, simple) vs **MercadoPago** (AR-friendly, mejor conversión local). Posible combo: MP para AR/LatAm, Stripe para resto.
- [ ] Webhook endpoint (`/api/billing/webhook`) que actualice `subscribed_until` al confirmar pago.
- [ ] Endpoint `/api/billing/checkout` que cree la sesión de pago y redirija.
- [ ] Tabla `subscriptions` si se necesita historial (opcional — `subscribed_until` alcanza para MVP).
- [ ] Portal de gestión (cancelar, cambiar tarjeta). Stripe Customer Portal resuelve esto gratis.

### Gating en la app
Aplicar `isPro(planState)` en estos puntos (límites en `PLAN_LIMITS`):
- [ ] **Directory**: bloquear crear partner #11+ en Free → mostrar paywall inline.
- [ ] **Pipeline**: bloquear crear task #21+ activa → mismo patrón.
- [ ] **AIAssistant**: si no es Pro, esconder widget o mostrar CTA al modal.
- [ ] **Google Calendar**: en Settings, deshabilitar el toggle para Free con nota "Disponible en Pro".
- [ ] **Export de datos**: botón de Settings solo para Pro.
- [ ] **Branding** (EfiLink sin marca Efi): chequear Pro al renderizar.

### UX del trial expirando
- [ ] Banner en dashboard cuando `trialDaysRemaining <= 7`.
- [ ] Email (via Resend) a los 7 días, 1 día, y al expirar.
- [ ] Al expirar: downgrade automático — `plan='free'`, UI muestra paywall pero datos se conservan.
- [ ] Estado "grace period" opcional (ej. 7 días después del vencimiento antes de aplicar límites duros).

### Modal y pricing
- [ ] Confirmar precios finales (hoy placeholders: US$9/mes, US$86/año).
- [ ] Decidir monedas: ¿mostrar ARS local? ¿conversión automática?
- [ ] Quitar el "Próximamente" del CTA en `UpgradeModal.tsx` y cablear al checkout real.
- [ ] Agregar testimonios/social proof al modal (opcional).

### Legal y admin
- [ ] Actualizar Términos y Política de privacidad con condiciones del plan pago.
- [ ] Facturación: ¿requerimos CUIT/datos fiscales? (Depende de si se emite factura local vs solo recibo Stripe.)
- [ ] Dashboard admin para ver MRR, churn, usuarios por plan. Puede empezar siendo queries SQL directas.

## Notas para Claude / devs futuros

- **La fuente de verdad de límites está en `packages/shared/src/plans.ts`**. No duplicar valores en el front o el back — importar de ahí.
- **No integrar Stripe/MP antes de que el usuario lo pida explícitamente.** Hoy es estructura vacía a propósito.
- **El helper `isPro()` ya respeta el flag `earlyAccess`** — cuando se aplique gating, usar ese helper, no chequear `plan === 'pro'` a mano.
- Si se cambian los límites de Free, actualizar `PLAN_LIMITS` y `PLAN_FEATURES` en paralelo (ambos en `plans.ts`).
