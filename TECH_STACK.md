# Tía - Technology Stack Definition

## 1. Purpose

This document locks the approved technical stack for taking Tía from the current prototype to a production-ready micro SaaS baseline.

## 2. Language and Product Context

This document is written in English for technical consistency across AI-driven workflows.

Product context still matters:

- Tía is a Spanish-first product
- visible UI copy remains in Spanish
- brand tone remains in Spanish
- engineering documentation remains in English

## 3. Stack Principles

- preserve the current React + TypeScript + Express baseline
- optimize for a web-first micro SaaS, not a native-mobile-first build
- keep the backend as the source of truth for business state
- extract shared contracts that can later serve a native mobile app
- avoid unnecessary rewrites and avoid microservices for MVP

## 4. Approved Repository Topology

The approved source layout is:

```text
apps/
  api/
  web/

packages/
  shared/
```

Rules:

- `apps/web` owns browser delivery for desktop and mobile web
- `apps/api` owns auth, business rules, persistence access, and integrations
- `packages/shared` owns shared types, contracts, and pure utilities
- `apps/mobile` is not approved yet as an active runtime

## 5. Approved Frontend

### 5.1 Runtime and Language

- TypeScript `5.8.2`
- React `19.0.0`
- React DOM `19.0.0`
- Vite `6.2.0`

### 5.2 Styling and UI

- Tailwind CSS `4.1.14`
- `@tailwindcss/vite` `4.1.14`
- `@vitejs/plugin-react` `5.0.4`
- `lucide-react` `0.546.0`
- `react-colorful` `5.6.1`
- `react-joyride` `2.9.3`
- `motion` `12.23.24`

### 5.3 Frontend Conventions

- responsive SPA architecture
- web-first delivery with strong mobile web support
- remote data consumed through REST
- no secrets in the client bundle
- local state reserved for UI state and temporary optimistic state
- business state should originate from the backend

## 6. Approved Backend

### 6.1 Runtime and Framework

- Node.js `20 LTS` target for deployment
- Express `4.21.2`
- `express-session` `1.19.0` as the temporary HTTP session layer until auth is revisited
- `dotenv` `17.2.3` for local development
- `googleapis` `171.4.0`

### 6.2 Build and Tooling

- `tsx` `4.21.0` for development
- `esbuild` `0.27.4` for the backend bundle
- server build target: `node20`

## 7. Approved Shared Layer

The shared layer may contain:

- domain types
- request and response contracts
- validation schemas
- pure utilities

The shared layer must not depend on:

- React
- Express
- browser globals
- Node-only runtime behavior unless explicitly isolated

## 8. Approved External Integrations

- Google OAuth 2.0 for app sign-in
- Google Calendar API for deliverable synchronization

Rules:

- production AI integrations must run server-side
- `@google/genai` `1.29.0` is allowed only for prototype or controlled beta work
- direct browser-side production consumption is not approved

## 9. Approved Persistence and Infrastructure

### 9.1 Database

- PostgreSQL `16`

### 9.2 Hosting

- web application: served by the backend deployment during MVP, or split into dedicated web hosting later if needed
- backend: persistent Node hosting
- database: Neon PostgreSQL or equivalent managed PostgreSQL provider

### 9.3 CI/CD

- GitHub Actions as the official pipeline
- automatic preview deployment on every pull request
- production deployment only from a protected branch

## 10. Approved Architecture

The system is defined as a `modular monolith`.

Approved modules:

- auth
- dashboard
- tasks
- partners
- contacts
- templates
- profile-settings
- integrations-google-calendar

Microservices are not approved for MVP v1.

## 11. Mandatory Technical Policies

- every new API must live under `/api/v1`
- every mutation must be validated on the backend
- every authenticated endpoint must require an application user
- critical business logic must not live only in the frontend
- the repository must stay ready for a future second client without prematurely creating it

## 12. Notes on the Current Repository

The current repository already contains:

- React + Vite + Tailwind
- an Express backend
- basic Google Calendar OAuth
- application state still held primarily in client memory
- a prototype-era AI assistant implementation

Required migration work to match the canonical stack:

- keep moving frontend and backend code into the approved topology
- extract shared domain contracts
- introduce a real database
- introduce real app authentication
- replace demo state with backend-driven data

## 13. Versions Confirmed From the Repository

Versions verified from `package.json` and `package-lock.json`:

- `@google/genai` `1.29.0`
- `@tailwindcss/vite` `4.1.14`
- `@vitejs/plugin-react` `5.0.4`
- `express` `4.21.2`
- `express-session` `1.19.0`
- `dotenv` `17.2.3`
- `googleapis` `171.4.0`
- `lucide-react` `0.546.0`
- `motion` `12.23.24`
- `react` `19.0.0`
- `react-colorful` `5.6.1`
- `react-dom` `19.0.0`
- `react-joyride` `2.9.3`
- `esbuild` `0.27.4`
- `tailwindcss` `4.1.14`
- `tsx` `4.21.0`
- `typescript` `5.8.2`
- `vite` `6.2.0`
