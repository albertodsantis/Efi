# Tía - Product Requirements Document

## 1. Purpose

This document defines the target product for the `MVP Production Baseline` version of Tía. Any functional change that conflicts with this document requires an explicit update to the canon.

## 2. Product Vision

Tía is a micro SaaS for content creators and creator operators who need to manage deliverables, brand relationships, contacts, templates, and follow-up work without relying on scattered spreadsheets, notes, reminders, and inbox threads.

The delivery sequence is:

1. a production web app
2. a strong responsive web mobile experience using the same product
3. a native mobile app later

The MVP goal is to turn the current prototype into a real, persistent web application that can become the commercial foundation of the SaaS:

- centralize the collaboration pipeline
- maintain an actionable directory of brands and contacts
- visualize deadlines and pipeline value
- support reusable outreach workflows
- sync deliverables with Google Calendar
- establish a backend-owned source of truth for future clients

## 3. Language and Audience

Tía is built for Spanish-speaking users.

Rules:

- brand tone is Spanish-first
- product copy and visible UI text should be written in Spanish
- technical documentation in this repository is written in English so AI agents and automation can work against a consistent source of truth

## 4. Problem Statement

Many creators and small creator operators currently manage commercial operations across WhatsApp, email, Google Calendar, notes, and spreadsheets. That leads to:

- lost context between a brand, a contact, and a deliverable
- weak visibility into pipeline status and value
- missed or poorly synchronized deadlines
- inconsistent outreach and follow-up
- fragmented work across desktop and mobile browsing contexts

## 5. Target Users

Primary user:

- independent content creator
- pays for and uses their own workspace
- needs a lightweight but credible operational SaaS
- expects a good experience on both desktop web and mobile web
- works primarily in Spanish, but may operate with international brands

Secondary user:

- creator manager or assistant supporting one creator account
- uses the app to keep a small operational workflow organized

Near-future expansion user:

- small creator team sharing an account context

Shared multi-user collaboration is not part of MVP v1, but the system should not be designed in a way that blocks it.

## 6. Release Goal

Release target: `Tía MVP v1`

The v1 release must be an authenticated, persistent, commercially credible web application that is ready for daily use and works correctly across desktop and mobile browsers.

Experimental AI functionality is not part of the MVP GA scope. It may exist behind a feature flag or remain disabled until provider, security, and cost decisions are final.

Native mobile apps are explicitly not required for MVP v1.

## 7. In-Scope Features

### 7.1 Authentication and Session

- Google sign-in for access to the application
- persistent and secure session handling
- clear separation between app authentication and Google Calendar permission grants

### 7.2 Dashboard

Summary view with:

- total active pipeline value
- tasks due today
- upcoming deliverables ordered by date

### 7.3 Task Pipeline

- create, edit, and delete tasks
- associate each task with a brand
- required task statuses:
- `Pendiente`
- `En Progreso`
- `En Revision`
- `Completada`
- `Cobro`
- supported views:
- kanban by phase
- full list
- monthly calendar
- monetary value per task
- required due date

### 7.4 Brand and Contact Directory

- create, edit, and archive brands
- manage relationship status per brand
- create, edit, and delete contacts associated with a brand
- search brands by name

Approved brand statuses:

- `Prospecto`
- `En Negociacion`
- `Activo`
- `Inactivo`
- `On Hold`
- `Relacion Culminada`

### 7.5 Templates and Outreach

- create, edit, and delete message templates
- supported variables:
- `{{brandName}}`
- `{{contactName}}`
- `{{creatorName}}`
- `{{deliverable}}`
- generate a draft that opens in the user's email client

### 7.6 Profile and Settings

- edit display name, handle, avatar, and goals
- choose light or dark theme
- choose accent color
- enable or disable notifications
- manage Google Calendar connection

### 7.7 Google Calendar Integration

- connect and disconnect the account
- create or update events from a task
- pull date changes from Calendar back into the task
- show sync status per task

### 7.8 Onboarding

- first-run tour for primary navigation
- the system must remember whether the user has already seen it

## 8. Canonical User Stories

### 8.1 Access

- As a creator, I want to sign in with Google so I can enter my workspace without creating a manual password.
- As a creator, I want to log out securely so my data is protected on shared devices.

### 8.2 Pipeline

- As a creator, I want to create a task with title, brand, value, and date so I can register a new deliverable.
- As a creator, I want to change the status of a task so I always know which pipeline phase it is in.
- As a creator, I want to view my tasks in kanban, list, and calendar layouts so I can operate in the best context.
- As a creator, I want to edit an existing task so I can correct value, description, or date.
- As a creator, I want to delete a task so I can keep the pipeline clean.

### 8.3 Brands and Contacts

- As a creator, I want to create a brand even when I do not yet have contacts so I do not lose opportunities.
- As a creator, I want to add multiple contacts to a brand so I can centralize stakeholders.
- As a creator, I want to update the commercial status of a brand so I can understand relationship health.
- As a creator, I want to search a brand quickly so I can recover context in seconds.

### 8.4 Templates and Communication

- As a creator, I want to save reusable templates so I can accelerate outreach.
- As a creator, I want to preview a template with resolved variables so I can avoid mistakes before opening my email client.

### 8.5 Calendar and Reminders

- As a creator, I want to sync a task with Google Calendar so I do not miss deadlines.
- As a creator, I want to pull date changes from Calendar so Tía stays aligned.
- As a creator, I want to enable notifications so I can remember upcoming deliverables.

### 8.6 Cross-Device Use

- As a creator, I want the same account to work well on desktop and mobile web so I can use Tía from wherever I am.
- As a creator, I want the backend to preserve my data consistently so switching devices does not change my operational context.

## 9. Out of Scope

Everything below is explicitly out of scope for MVP v1:

- real-time multi-user collaboration
- shared workspaces with granular permissions
- invoicing, collections, or advanced accounting
- sending email from Tía-owned servers
- internal messaging
- native iOS or Android apps
- automatically imported social media analytics
- advanced enterprise CRM automations
- production AI features with client-exposed secrets
- template marketplace
- subscription billing implementation

## 10. Non-Functional Requirements

- full data persistence across sessions and devices
- desktop web and mobile web must both be first-class supported experiences
- initial load under 2.5 seconds on broadband
- standard CRUD flows with immediate visual feedback
- external integration failures handled with understandable messages
- secrets and tokens live only on the backend
- frontend clients treat the backend as the source of truth

## 11. Success Metrics

Primary product metrics for the first 90 days:

- activation: at least 60 percent of registered users create their first task on the same day
- weekly retention: at least 35 percent of active users return within 7 days
- real usage: at least 70 percent of active users create or update 3 or more tasks per week
- captured value: at least 50 percent of users with 5 or more tasks record monetary value in 80 percent of those tasks
- integration: at least 30 percent of active users connect Google Calendar
- mobile web usage: the product remains operationally usable for at least 90 percent of core workflows on a standard mobile browser

Operational metrics:

- API error rate below 1 percent on critical endpoints
- Google Calendar sync succeeds in at least 95 percent of valid attempts
- zero secrets exposed in the client bundle

## 12. MVP Acceptance Criteria

The MVP is ready when:

- real user authentication exists
- core entities persist in a database
- the frontend no longer depends on demo in-memory state
- Google Calendar works through a secure OAuth flow
- the user can operate Dashboard, Pipeline, Directory, Profile, and Settings against real data
- desktop web and mobile web are both viable for normal daily usage
- experimental AI functionality does not compromise security, cost control, or the main product experience
