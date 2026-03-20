# TIA - Repository Strategy

## 1. Purpose

This document defines how the repository must evolve to support TIA as a micro SaaS.

It is not a product roadmap. It is the engineering and repository strategy that keeps product delivery aligned with the intended distribution model.

## 2. Product Delivery Strategy

TIA will be delivered in this order:

1. web application as the primary product surface
2. mobile web experience from the same responsive web application
3. native mobile application only after backend and domain contracts are stable

This means the repository must optimize for `web-first`, `API-first`, and `shared-domain-first` development.

## 3. Non-Negotiable Repository Principles

- the web app is the primary product client until further notice
- mobile web is a required quality target, not a separate codebase
- backend APIs are the source of truth for business state
- critical business logic must not live only in the client
- shared types and contracts must be reusable by future clients
- native mobile is a later delivery surface, not a current implementation driver

## 4. Canonical Repository Shape

The approved repository shape is:

```text
apps/
  api/
  web/

packages/
  shared/
```

Responsibilities:

- `apps/web`
  Responsive web application for desktop and mobile browsers.
- `apps/api`
  Backend application, auth flows, business rules, persistence access, and external integrations.
- `packages/shared`
  Shared domain models, API contracts, and pure reusable helpers with no React-specific or Express-specific assumptions.

`apps/mobile` is intentionally not created yet. It becomes valid only after the web and API contracts are stable enough to justify a second client runtime.

## 5. What This Strategy Changes

Compared with the prototype-oriented repository, the new direction requires:

- frontend and backend source code to stop living in the same flat root structure
- API and domain contracts to become explicit
- the current client-side demo state to be treated as transitional, not canonical
- external integrations such as Google Calendar and AI providers to remain backend-owned
- the repository to be ready for more than one client without prematurely building them

## 6. Near-Term Migration Rules

During the current transition phase:

- keep one repository
- avoid microservices
- avoid a native mobile app codebase
- prefer incremental structural changes over a rewrite
- preserve the current web runtime while moving files into the new shape

## 7. Approved Sequencing

The migration order is:

1. align the documentation canon with the micro SaaS strategy
2. move the current web code into `apps/web`
3. move the backend into `apps/api`
4. extract shared domain types and contracts into `packages/shared`
5. replace prototype client state with backend-driven state
6. introduce persistence, auth hardening, and production API contracts
7. revisit a native mobile client only after the API is mature

## 8. Definition of Success

The repository is aligned with this strategy when:

- a contributor can identify where web, backend, and shared code belong
- product logic is no longer trapped in the browser
- the web app can evolve without blocking a future mobile client
- the backend contracts are reusable for future channels
- the repository structure reflects the intended business model of a micro SaaS
