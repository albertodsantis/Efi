# Efi - Implementation Plan

## 1. Purpose

This plan tracks the implementation progress of the Efi web app and defines the remaining work needed to reach production readiness. It reflects the actual state of the codebase as of April 2026.

## 2. Execution Language Policy

This document is written in English for implementation clarity.

Product constraints still apply:

- Efi is a Spanish-first product
- visible UI text should remain in Spanish
- internal planning and engineering docs remain in English

## 3. Completed Work

The following milestones have been fully completed.

### Milestone 0 — Canon Alignment [DONE]

- PRD, APP_FLOW, TECH_STACK, BACKEND_STRUCTURE, FRONTEND_GUIDELINES, and REPOSITORY_STRATEGY reviewed and approved
- MVP scope frozen as a web-first micro SaaS with mobile web support

### Milestone 1 — Repository Realignment [DONE]

- browser code moved into `apps/web`
- backend moved into `apps/api`
- shared domain types and contracts extracted into `packages/shared`
- build scripts normalized; repository builds and runs from root

### Milestone 2 — Foundation Hardening [DONE]

- backend route, service, integration, and config layers created inside `apps/api`
- frontend API client and centralized fetch layer created (`api.ts`)
- security: Helmet, express-rate-limit, httpOnly session cookies
- file upload infrastructure: multer + Supabase Storage (`lib/storage.ts`)
- Vercel deployment config: `vercel.json` + `api/index.js` (legacy, unused — deployed on Railway)

### Milestone 3 — PostgreSQL Persistence [DONE]

- `pg` pool initialized in `db/connection.ts`
- 17 SQL migrations in `db/migrations/` (001–017), run automatically on startup
- `PostgresAppStore` class in `db/repository.ts` handles all queries
- sessions persisted in PostgreSQL via `connect-pg-simple`
- full multi-tenant isolation: all tables have `user_id` FK; all queries filter by `user_id`
- row-level security enabled (migration 006)
- Supabase used as the managed PostgreSQL host

### Milestone 4 — Authentication and User Isolation [DONE]

- `users` table with email/password (`bcryptjs`, 10 rounds) and Google OAuth (`provider = 'google'`)
- `express-session` + `connect-pg-simple` for persistent sessions
- `requireAuth()` middleware applied to all `/api/v1/*` routes
- `GET /api/auth/me`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `POST /api/auth/change-password`, `DELETE /api/auth/account`
- Google OAuth app login flow (`/api/auth/google/login` + callback)
- `ensureUserData()` creates `user_profile` and `user_settings` rows on first login
- all queries scoped to the authenticated `userId`

### Milestone 5 — Core CRUD APIs [DONE]

All CRUD endpoints implemented against PostgreSQL:

- tasks API (with checklist items, gcalEventId, completedAt/cobradoAt, actualPayment)
- partners API (with financial tracking, deletion)
- contacts API (CRUD nested under partners)
- templates API (name + body, PATCH added)
- profile API (EfiProfile model: links + PDF + social profiles, profession fields)
- settings API
- strategic view API (`GET /api/v1/strategic-view` with aggregated metrics)
- notifications API (`GET /api/v1/notifications`, `PATCH /api/v1/notifications/seen`)
- bootstrap API (`GET /api/v1/bootstrap` returns `AppState` + `EfisystemSnapshot`)

### Milestone 6 — Frontend Views [DONE]

All views implemented with full features:

- **Dashboard** — summary metrics, GoalsMarquee, period filter, EfisystemWidget
- **Pipeline** — Kanban/List/Calendar with CRUD, drag-and-drop, goal selector, checklist
- **Directory** — partner/contact CRUD, message composer, outreach
- **StrategicView** — master-detail goal management with aggregated metrics
- **Profile** — EfiLink editor (links list + PDF + social profiles + accent/dark settings)
- **Settings** — accent/theme, notifications, Calendar integration, templates, account management
- **Landing** — email/password and Google OAuth login/register
- **WelcomeColorPicker** — new-user accent selection
- **WelcomeOnboarding** — profession picker and welcome screen

Frontend state management:

- `AppContext.tsx` — central state, optimistic mutations, gamification awards, push notifications, error tracking
- loading, empty, and error states handled across all views

### Milestone 7 — Google Calendar Integration [DONE]

- Google OAuth popup flow for Calendar access
- `POST /api/calendar/sync` — create or update Calendar events from tasks
- `POST /api/calendar/sync-down` — pull date changes back from Calendar
- Pipeline UI shows sync status per task

### Milestone 8 — Design System [DONE]

- reusable component library in `ui.tsx`: `cx()`, `SurfaceCard`, `ScreenHeader`, `MetricCard`, `StatusBadge`, `EmptyState`, `Button`, `IconButton`, `ToggleSwitch`, `ModalPanel`, `SettingRow`, `Avatar`
- standalone components: `AIAssistant`, `Confetti`, `ConfirmDialog`, `CustomSelect`, `EfisystemWidget`, `ErrorBoundary`, `ImageUpload`, `LegalModal`, `MoreOptionsMenu`, `NotificationBell`, `OnboardingTour`, `OverlayModal`, `Toaster`
- CSS token system in `index.css`: surfaces, text, borders, shadows, accent system, dark mode, CRT overlay
- accent color system (`accent.ts`): multi-modal (hex, gradient, conic, retro), WCAG contrast enforcement
- responsive layout: desktop sidebar + mobile bottom nav
- light/dark theme support
- shimmer loading animation, focus-visible outlines, radial gradients
- `@phosphor-icons/react` (duotone) globally via `IconContext.Provider`

### Milestone 9 — Additional Features [DONE]

- AI Assistant (Gemini + voice input) as experimental feature behind `GEMINI_API_KEY`
- Onboarding revamp: WelcomeColorPicker, WelcomeOnboarding (profession picker), Joyride tour
- Push notifications for task reminders (today/tomorrow)
- Template variable substitution in message composer
- Partner auto-creation during task creation
- Keyboard-accessible `CustomSelect`
- Portal-based modals (`OverlayModal`)
- Event-based toast system (`toast.ts` + `Toaster`)
- `NotificationBell` with `last_seen_notifications_at` tracking
- `MoreOptionsMenu` with legal links (`LegalModal`)
- `ImageUpload` component (multer backend + Supabase Storage)
- `Confetti` component (canvas-confetti, triggered by `efi-confetti` custom event)
- Pull-to-refresh on mobile

### Milestone 10 — Strategic View [DONE]

- `goal_id` FK on `tasks` and `partners` tables (ON DELETE SET NULL)
- `GET /api/v1/strategic-view` endpoint with aggregated metrics per goal
- `StrategicView` component: master-detail layout, goal CRUD, linked tasks/partners
- Goal selector dropdown in Pipeline task creation/edit form
- Dashboard GoalsMarquee using active goals
- Goals timeframe stored as months (integer) with computed `targetDate`

### Milestone 11 — Gamification (Efisystem) [DONE]

- 3 tables: `efisystem_transactions` (append-only), `efisystem_badges`, `efisystem_summary`
- `GamificationService` in `services/gamification.ts`
- 11 point event types; 9 badge definitions
- Awards returned inline in mutation API responses (`EfisystemAward`)
- `GET /api/v1/efisystem` endpoint
- `EfisystemWidget` component on Dashboard
- Bootstrap response includes `EfisystemSnapshot`

### Milestone 12 — EfiLink Public Profile [DONE]

- `EfiProfile` type: `{ links: ProfileLink[], pdf_url, pdf_label }` (replaces `MediaKitProfile` block composer)
- `profileAccentColor` and `profileForceDark` added to `AppState` / `user_settings`
- `lib/profileRenderer.ts` — server-side EfiLink HTML renderer
- `POST /api/v1/preview-profile` — live preview without DB write
- Public EfiLink served at `/@:handle` via `routes/mediakit.ts` (HTML, no auth)
- LinkedIn added as 6th platform in `SocialProfiles`
- `tagline` field (required string) replaces legacy `bio` on `UserProfile`

### Milestone 13 — Profession and User Identity [DONE]

- `FreelancerType` enum with 12 profession values
- `primary_profession` and `secondary_professions` columns on `user_profile`
- `WelcomeOnboarding` screen with profession picker
- `professions.ts` library with labels and catalogue

## 4. Remaining Work

The following milestones represent the work still needed for production readiness.

### Milestone A — CI/CD Pipeline

#### Step A.1

- work: set up CI with typecheck, lint, and build verification on every PR
- dependency: none

#### Step A.2

- work: add automated deployment pipeline for preview and production environments
- dependency: Step A.1

### Milestone B — Production Deployment

#### Step B.1

- work: prepare production environment (hosting, domain, SSL, environment variables)
- dependency: Step A.2

#### Step B.2

- work: run manual QA against PRD acceptance criteria

#### Step B.3

- work: decide AI Assistant release state (if it still exposes secrets or lacks cost controls, it stays disabled in production)
- dependency: Step B.2

#### Step B.4

- work: production launch
- dependency: Step B.3

## 5. Mobile App Readiness Gate

Creating a native mobile app becomes valid only when:

- auth is stable and proven in production
- core domain contracts are stable
- the backend is the confirmed source of truth
- shared contracts are reusable without depending on the web app

Before that point, mobile effort must stay focused on mobile web quality.

## 6. Remaining Effort Estimate

- CI/CD pipeline: ~0.5 week
- production deployment and QA: ~1 week

Estimated total remaining for production readiness: **1 to 2 weeks**

## 7. Definition of Done

An implementation task is complete only when:

- code is merged
- types pass (`npm run lint`)
- build passes (`npm run build`)
- the main error path is covered
- affected documentation is updated
