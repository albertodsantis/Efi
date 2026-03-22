<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Tía

Tía is a web-first micro SaaS for content creators and influencer operators. The product must work first as a desktop web app and mobile web experience, with a native mobile app reserved for a later phase.

## Documentation Language Policy

This repository uses English for:

- technical documentation
- architecture notes
- implementation plans
- code comments when needed
- file and section naming conventions

Tía itself is designed for a Spanish-speaking audience. Product copy, brand tone, and user-facing labels should remain in Spanish unless a specific feature requires another language.

## Repository Direction

The repository is now aligned to a `web-first`, `API-first`, and `shared-domain-first` strategy.

That means:

- the web application is the primary product client
- mobile web quality is required from the same web codebase
- backend APIs become the source of truth for product state
- native mobile is a later channel, not the current implementation driver

See [REPOSITORY_STRATEGY.md](./REPOSITORY_STRATEGY.md) for the canonical repository direction.

## Design System Authority

The repository now uses a single design authority:

- `design-system/MASTER.md` is the canonical source of truth for the visual system and reusable UI rules
- `FRONTEND_GUIDELINES.md` translates that master into implementation-facing frontend guidance

If an external design helper such as UI/UX Pro Max is used, its proposals should be treated as inputs to improve Tia, not as a parallel authority. Reusable accepted ideas should be merged into `design-system/MASTER.md`.

## Current Repository Shape

```text
apps/
  api/
  web/

packages/
  shared/
```

Current responsibilities:

- `apps/web`: responsive React application for desktop and mobile browsers
- `apps/api`: Express-based backend and integration layer
- `packages/shared`: reusable domain types and API contracts

The repository is still in transition from prototype decisions. Some product state still lives in the client and will be moved behind API contracts over time.

## Current Product Shape

The current app favors a compact operational workspace over heavy dashboard chrome.

Current UX characteristics:

- navigation and section headers are compact and sit inside the scrollable content
- Inicio is intentionally simplified, with redundant hero text removed
- Pipeline prioritizes the workspace controls first: Kanban, Lista, Mes, `Nueva tarea`, and `Actualizar Calendar`
- Pipeline no longer uses a large summary block above the workspace
- the task status flow is `Pendiente` -> `En Progreso` -> `En Revisión` -> `Completada` -> `Cobrado`
- the UI reduces nested cards and repeated labels in favor of cleaner grouped layouts

## Local Development

Requirement:

- Node.js

Setup:

1. Install dependencies with `npm install`.
2. If you want to test external integrations, create a local environment file from `.env.example`.
3. Start the unified local app with `npm run dev`.

Default local URL:

- `http://127.0.0.1:3000`
- `http://localhost:3000`

Development notes:

- `npm run dev` starts the Express server and mounts Vite in middleware mode.
- The base UI can be opened without a local `.env` file.
- Google OAuth and Calendar integration require the environment variables from `.env.example`.
- Health check: `GET /api/health` returns `{ "ok": true }` when the local server is healthy.

### Local Server Runbook

Use this lightweight flow when a new session needs the app running quickly:

1. Check whether the app is already running by opening `http://127.0.0.1:3000/api/health`.
2. If the health check does not respond with `{ "ok": true }`, start the app from the repository root with `npm run dev`.
3. Confirm the app loads at `http://127.0.0.1:3000` or `http://localhost:3000`.
4. Share the local URL back to the user once the health check and root page both respond successfully.

If the session needs the server to keep running without blocking the terminal, it is acceptable to start `npm run dev` in the background and write logs to local files such as `local-server.out.log` and `local-server.err.log`.

Useful scripts:

- `npm run dev`: runs the local application through the API server
- `npm run build`: builds the web app and backend bundle
- `npm run lint`: runs the TypeScript checks

## Session Restart Checklist

When resuming work in a new editor or agent session, include these points in the first message:

- what feature, bug, or document was last in progress
- a request to start the project and confirm that the local web app loads
- whether the session should avoid commits or code changes
- whether the session should run `npm run lint` after changes
- whether the session needs Google OAuth or Calendar flows to be tested

Suggested resume prompt:

```text
We are continuing work on Tía.
Last time we were working on [topic].
Start the project, confirm the local web app loads, and share the local URL.
Today we want to work on [goal].
Constraints: [no commits / read-only / run lint / test Google OAuth].
```

## Environment Variables

Current environment variables reflect the transition from prototype to micro SaaS baseline:

- `GEMINI_API_KEY`
  Optional. Used only by the inherited Gemini-based assistant implementation.
- `GOOGLE_CLIENT_ID`
  Required for local Google OAuth and Calendar integration.
- `GOOGLE_CLIENT_SECRET`
  Required for local Google OAuth and Calendar integration.
- `APP_URL`
  Base application URL used for OAuth callbacks. Example: `http://localhost:3000`.

## Current Runtime Shape

- frontend: React + TypeScript + Vite
- backend: Express
- styling: Tailwind CSS
- external integration: Google Calendar via Google OAuth

## Canonical Documents

- [design-system/MASTER.md](./design-system/MASTER.md)
- [PRD.md](./PRD.md)
- [APP_FLOW.md](./APP_FLOW.md)
- [TECH_STACK.md](./TECH_STACK.md)
- [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md)
- [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md)
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- [REPOSITORY_STRATEGY.md](./REPOSITORY_STRATEGY.md)
