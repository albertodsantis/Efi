# Efi - Repository Strategy

## 1. Purpose

This document defines how the repository is structured to support Efi as a micro SaaS and how it should evolve as the product matures.

It is not a product roadmap. It is the engineering and repository strategy that keeps product delivery aligned with the intended distribution model.

## 2. Product Delivery Strategy

Efi is delivered in this order:

1. Web application as the primary product surface
2. Mobile web experience from the same responsive web application
3. Native mobile application only after backend and domain contracts are stable

The repository is optimized for `web-first`, `API-first`, and `shared-domain-first` development.

## 3. Non-Negotiable Repository Principles

- The web app is the primary product client until further notice
- Mobile web is a required quality target, not a separate codebase
- Backend APIs are the source of truth for business state
- Critical business logic must not live only in the client
- Shared types and contracts must be reusable by future clients
- Native mobile is a later delivery surface, not a current implementation driver

## 4. Repository Structure

The monorepo is organized into three workspaces:

```text
efi/
├── Documentation/          # all project documentation
│   ├── PRD.md
│   ├── APP_FLOW.md
│   ├── TECH_STACK.md
│   ├── BACKEND_STRUCTURE.md
│   ├── FRONTEND_GUIDELINES.md
│   ├── IMPLEMENTATION_PLAN.md
│   └── REPOSITORY_STRATEGY.md
├── design-system/
│   └── MASTER.md
├── apps/
│   ├── api/                # Express backend
│   │   └── src/
│   │       ├── server.ts   # entry point
│   │       ├── app.ts      # app factory (DB, auth, routes)
│   │       ├── config/     # env.ts
│   │       ├── routes/     # auth.ts, calendar.ts, mediakit.ts, v1.ts
│   │       ├── db/         # connection.ts, migrate.ts, repository.ts, migrations/
│   │       ├── lib/        # storage.ts
│   │       └── services/   # gamification.ts
│   └── web/                # React SPA
│       └── src/
│           ├── App.tsx, main.tsx, index.css
│           ├── context/    # AppContext.tsx
│           ├── views/      # Dashboard, Pipeline, Directory, Profile, Settings,
│           │               # StrategicView, Landing, WelcomeColorPicker, WelcomeOnboarding
│           ├── components/ # ui.tsx and all standalone components
│           └── lib/        # api.ts, accent.ts, blockTemplates.ts, date.ts, ...
├── packages/
│   └── shared/             # shared domain types and contracts
│       └── src/
│           ├── domain.ts
│           ├── contracts/  # appData.ts, auth.ts, googleCalendar.ts
│           └── index.ts
├── api/
│   └── index.js            # Vercel serverless entry point
├── docker-compose.yml      # local PostgreSQL container
├── vercel.json             # Vercel deployment config
├── README.md
├── CLAUDE.md
├── package.json
└── tsconfig.json
```

### Responsibilities

- **apps/web** — Responsive web application for desktop and mobile browsers. React 19, TypeScript, Vite, Tailwind CSS 4. All views, UI components, and the client-side application context.

- **apps/api** — Backend application: auth flows (email/password + Google OAuth), business rules, PostgreSQL persistence (`PostgresAppStore`), file uploads (multer + Supabase Storage), gamification service, and external integrations (Google Calendar, Gemini AI).

- **packages/shared** — Shared domain models (`domain.ts`), API contracts (`contracts/`), and pure reusable helpers. No React-specific or Express-specific assumptions. Consumed by both `apps/web` and `apps/api`.

- **api/index.js** — Vercel serverless entry point that imports the built Express app.

- **Documentation/** — All project documentation: PRD, application flow, tech stack, backend structure, frontend guidelines, implementation plan, and this repository strategy.

- **design-system/** — Canonical design system authority (`MASTER.md`). The single source of truth for the visual system and reusable UI rules.

## 5. What Has Been Completed

The following structural and feature milestones have been completed:

- Frontend and backend code organized into `apps/web` and `apps/api`
- API and domain contracts extracted into `packages/shared`
- PostgreSQL persistence: 14 migrations, full multi-tenant isolation via `user_id`
- Real authentication: email/password (bcryptjs) and Google OAuth (Supabase redirect); sessions persisted in PostgreSQL via `connect-pg-simple`
- All core CRUD features: tasks, partners, contacts, templates, profile, settings, goals
- Profile revamped as a modular block composer with 16+ block types
- Public profile served at `/mk/:handle` (no authentication required)
- Google Calendar integration (sync up, sync down)
- AI Assistant (Gemini) behind `GEMINI_API_KEY` feature flag
- Gamification system (Efisystem): XP, levels, and 9 badges
- Onboarding revamp: WelcomeColorPicker + WelcomeOnboarding + Joyride tour
- Push notifications for task reminders
- File uploads via multer + Supabase Storage
- Security: Helmet, express-rate-limit, httpOnly session cookies
- Vercel deployment config: `vercel.json` + `api/index.js`
- Unified dev server: Express + Vite middleware mode

## 6. Current Development Rules

- Keep one repository (monorepo)
- Avoid microservices
- Avoid a native mobile app codebase
- Prefer incremental structural changes over rewrites
- Run `npm run lint` (TypeScript type checking) to validate changes
- All queries must be scoped by `user_id` to preserve multi-tenant isolation

## 7. Forward-Looking Roadmap

Remaining work for production readiness, in order:

1. **CI/CD pipeline** — automated typecheck, build, and smoke tests on every PR
2. **Production deployment** — finalize hosting environment, domain, SSL, environment variables, and monitoring

`apps/mobile` is intentionally not created. It becomes valid only after the API contracts are stable and the web delivery is proven in production.

## 8. Definition of Success

The repository is aligned with this strategy when:

- A contributor can identify where web, backend, and shared code belong
- Product logic is not trapped in the browser
- The web app can evolve without blocking a future mobile client
- The backend contracts are reusable for future channels
- The repository structure reflects the intended business model of a micro SaaS
- All data access is scoped by user so the system is safe for multi-tenant operation
