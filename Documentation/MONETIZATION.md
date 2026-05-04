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
  - `PLAN_PRICING` — US$5.99/mes, US$57/año (~US$4.75/mes equivalente), 20% descuento anual
  - `PLAN_FEATURES` — filas de la tabla comparativa del modal
  - `isPro(state)` — helper puro; respeta `earlyAccess`, `subscribedUntil`, `trialEndsAt`
  - `trialDaysRemaining(state)` — días restantes de trial (o `null`)
- `packages/shared/src/contracts/auth.ts` — `SessionUser` extendido con campos de plan.

### Frontend
- `apps/web/src/context/AppContext.tsx` — expone `planState: PlanState`.
- `apps/web/src/components/UpgradeModal.tsx` — modal de planes (toggle Mensual/Anual, comparativa Free vs Pro, CTA deshabilitado con aviso de acceso anticipado).
- `apps/web/src/views/Settings.tsx` — sección "Plan" arriba con badge y botón "Ver planes".

## Sistema de referidos

Implementado y activo desde el inicio de beta. Los usuarios acumulan créditos mientras `EARLY_ACCESS=true`; al apagar el flag se canjean en tiempo de suscripción.

### Reglas
- Link de invitación: `https://efidesk.com/?ref=<code>` (code de 8 chars generado al registrarse).
- Un referido **califica** cuando, dentro de 60 días desde su registro, hace ≥10 cambios de status en sus tareas a lo largo de ≥7 días distintos.
- Al calificar: 1 mes para el referidor (tope 3) y 1 mes para el referido.
- Anti-abuso: no self-referral, no misma IP que un referido previo del mismo referidor, un solo referidor por usuario.

### Dónde vive
- Reglas y tipos: `packages/shared/src/contracts/referrals.ts`.
- Lógica backend: `apps/api/src/services/referrals.ts`.
- Evaluador: corre inline en `PATCH /api/v1/tasks/:id` al cambiar status (no hay cron).
- UI usuario: sección "Invita a un amigo" en Settings (`apps/web/src/components/ReferralsSection.tsx`).
- Endpoint de canje: `POST /api/admin/referrals/redeem-all` (protegido con `ADMIN_API_KEY`).
- Schema: migración `028_referrals.sql` (tablas `referrals`, `referral_credits`; columna `users.referral_code`).

## Switch a modo pago — el día D

Los 3 pasos se ejecutan el mismo día, en orden, sin pausas largas entre ellos. **No correr ninguno antes de decidir cerrar la beta** — los tres están acoplados y fuera de orden dejan a los usuarios en estados incorrectos.

Orden correcto: **backfill de trials → canje de créditos → apagar flag**. Duración estimada: 3-5 minutos.

### Paso 1 — Backfill de trials para usuarios existentes

Corré este SQL en la consola de Supabase. Le da a todos los usuarios actuales 30 días de trial a partir de ese momento:

```sql
UPDATE users
SET trial_ends_at = NOW() + INTERVAL '30 days'
WHERE trial_ends_at IS NULL
  AND subscribed_until IS NULL;
```

### Paso 2 — Canjear créditos de referidos

Convierte los créditos acumulados en `referral_credits` (redeemed_at=NULL) en meses extra sumados a `users.subscribed_until`. Es idempotente — si se corre dos veces, la segunda no hace nada.

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_API_KEY" \
  https://efidesk.com/api/admin/referrals/redeem-all
```

Responde con el resumen: `{ usersAffected, creditsRedeemed, monthsGranted }`.

### Paso 3 — Apagar early access

En Railway, setear `EARLY_ACCESS=false` y redeployar. A partir de ahí, `isPro()` respeta fechas reales: `subscribed_until` (que ya incluye los meses de referidos) tiene prioridad, y cuando vence cae al `trial_ends_at` del Paso 1.

### Por qué el orden importa
- **Paso 1 antes del 3**: si apagás el flag sin trial, todos los usuarios pasan a Free de golpe.
- **Paso 2 antes del 3**: si apagás el flag sin canjear, los meses ganados no aparecen todavía en `subscribed_until` y los usuarios ven paywall pese a haberlos ganado.
- **Paso 2 después del 1**: el canje suma meses sobre `subscribed_until` directamente, así que no depende del trial. Pero si se invierte el orden (canje antes de backfill) el efecto neto es el mismo — lo dejamos en este orden para mantener el flujo "primero base, luego beneficios".

### Paso 4 — Nuevos usuarios (ya cableado)

Cada `INSERT INTO users` en `auth.ts` (registro email + 2 callbacks de Google) ya setea `trial_ends_at = NOW() + INTERVAL '30 days'`. Mientras `EARLY_ACCESS=true` el campo es irrelevante (el flag bypasea todo); cuando se apague, los usuarios nuevos nacen con 30 días de trial automáticos. Sin tarjeta requerida — al expirar caen a Free.

## TODOs antes de activar pagos

### Integración de pagos
- [ ] Elegir proveedor: **Stripe** (global, simple) vs **MercadoPago** (AR-friendly, mejor conversión local). Posible combo: MP para AR/LatAm, Stripe para resto.
- [ ] Webhook endpoint (`/api/billing/webhook`) que actualice `subscribed_until` al confirmar pago.
- [ ] Endpoint `/api/billing/checkout` que cree la sesión de pago y redirija.
- [ ] Tabla `subscriptions` si se necesita historial (opcional — `subscribed_until` alcanza para MVP).
- [ ] Portal de gestión (cancelar, cambiar tarjeta). Stripe Customer Portal resuelve esto gratis.

### Gating en la app
Aplicar `isPro(planState)` en estos puntos (límites en `PLAN_LIMITS`):
- [ ] **Directory**: bloquear crear partner #3+ en Free → mostrar paywall inline.
- [ ] **Pipeline**: bloquear crear task #4+ activa → mismo patrón.
- [ ] **AIAssistant**: si no es Pro, esconder widget o mostrar CTA al modal.
- [ ] **Google Calendar**: en Settings, deshabilitar el toggle para Free con nota "Disponible en Pro".
- [ ] **Export de datos**: botón de Settings solo para Pro.
- [ ] **EfiLink**: el perfil público `/@handle` solo se sirve si el usuario es Pro. Free → 404 o landing con CTA al modal. Verificar en `apps/api/src/routes/mediakit.ts`.
- [ ] **Branding** (EfiLink sin marca Efi): chequear Pro al renderizar (relevante solo si EfiLink es Pro).

### UX del trial expirando
- [ ] Banner en dashboard cuando `trialDaysRemaining <= 7`.
- [ ] Email (via Resend) a los 7 días, 1 día, y al expirar.
- [ ] Al expirar: downgrade automático — `plan='free'`, UI muestra paywall pero datos se conservan.
- [ ] Estado "grace period" opcional (ej. 7 días después del vencimiento antes de aplicar límites duros).

### Modal y pricing
- [ ] Confirmar precios finales (hoy: US$5.99/mes, US$57/año).
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
