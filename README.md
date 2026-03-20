<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TIA

TIA is a web-first micro SaaS for content creators and influencer operators. The product must work first as a desktop web app and mobile web experience, with a native mobile app reserved for a later phase.

## Documentation Language Policy

This repository uses English for:

- technical documentation
- architecture notes
- implementation plans
- code comments when needed
- file and section naming conventions

TIA itself is designed for a Spanish-speaking audience. Product copy, brand tone, and user-facing labels should remain in Spanish unless a specific feature requires another language.

## Repository Direction

The repository is now aligned to a `web-first`, `API-first`, and `shared-domain-first` strategy.

That means:

- the web application is the primary product client
- mobile web quality is required from the same web codebase
- backend APIs become the source of truth for product state
- native mobile is a later channel, not the current implementation driver

See [REPOSITORY_STRATEGY.md](./REPOSITORY_STRATEGY.md) for the canonical repository direction.

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

## Local Development

Requirement:

- Node.js

Setup:

1. Install dependencies with `npm install`.
2. If you want to test external integrations, create a local environment file from `.env.example`.
3. Start the unified local app with `npm run dev`.

Useful scripts:

- `npm run dev`: runs the local application through the API server
- `npm run build`: builds the web app and backend bundle
- `npm run lint`: runs the TypeScript checks

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

- [PRD.md](./PRD.md)
- [APP_FLOW.md](./APP_FLOW.md)
- [TECH_STACK.md](./TECH_STACK.md)
- [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md)
- [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md)
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- [REPOSITORY_STRATEGY.md](./REPOSITORY_STRATEGY.md)
