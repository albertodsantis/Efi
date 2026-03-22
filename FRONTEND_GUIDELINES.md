# Tia - Frontend Guidelines

## 1. Purpose

This document defines the frontend implementation rules for Tia MVP v1.

The canonical design authority lives in `design-system/MASTER.md`.

This file translates that master into implementation-facing guidance for the web app and should not become a second competing design source of truth.

## 2. Language and Brand Policy

This document is written in English because technical documentation in this repository is standardized for AI-friendly implementation work.

Product rules:

- Tia is designed for a Spanish-speaking audience
- brand tone is Spanish-first
- visible navigation labels, product copy, and screen text should remain in Spanish
- a single screen should not mix English and Spanish labels unless there is a clear product reason

## 3. Design Authority

Precedence order:

1. `design-system/MASTER.md`
2. `FRONTEND_GUIDELINES.md`
3. implementation details in `apps/web`

Use this document to explain how the frontend should implement the master, not to redefine the master independently.

## 4. Design System Lock

Approved design system: `Tia Internal Mobile CRM System`

Technical base:

- Tailwind CSS `4.x`
- CSS tokens for color, typography, radius, and shadow
- `lucide-react` for iconography

Introducing another full UI system such as Material UI or Ant Design is not approved for the MVP.

## 5. Frontend Translation of the Master

The frontend must implement the master with:

- CSS tokens for color, typography, radius, and shadow
- shared app-shell framing across breakpoints
- reusable primitives before one-off view styling
- Spanish-first UI copy
- accent-aware states that preserve contrast
- compact operational layouts over decorative dashboard chrome
- the chosen identity direction: `Soft Studio Console`
- calm surface hierarchy and restrained composition
- cardless or low-card layouts as the default starting point

## 6. Token Implementation Rules

The web app should expose the design system through CSS variables and shared primitives.

Implementation expectations:

- `apps/web/src/index.css` owns global tokens and base element behavior
- `apps/web/src/lib/accent.ts` derives runtime accent variants
- `apps/web/src/components/ui.tsx` holds reusable UI primitives
- screen-level files should consume the system instead of redefining it locally
- if a new token becomes reusable across screens, promote it into the token layer instead of leaving it in a single view

## 7. App Shell Rules

The application shell should preserve these behaviors:

- mobile may use bottom navigation
- desktop may use top navigation, rail navigation, or sidebar navigation
- section headers should be compact and inside scrollable content
- desktop should feel intentionally laid out, not like an enlarged phone frame
- background atmosphere may use subtle accent gradients, but work surfaces must remain highly legible
- the primary workspace should visually dominate the screen
- avoid turning the shell into a grid of equally loud panels
- prefer tonal grouping and spacing before bordered segmentation

## 8. Reusable Component Policy

Before creating a one-off pattern, check whether the need belongs in the shared component layer.

For `Soft Studio Console`, reusable primitives should bias toward:

- quiet surfaces
- strong typography
- compact controls
- tactile but restrained interaction feedback
- low-noise states and separators

The minimum required reusable library remains:

- `ScreenHeader`
- `MetricCard`
- `StatusBadge`
- `TaskCard`
- `PartnerCard`
- `ContactCard`
- `PrimaryButton`
- `IconButton`
- `TextField`
- `SelectField`
- `ToggleSwitch`
- `ModalSheet`
- `SegmentedControl`
- `EmptyState`
- `LoadingState`
- `ErrorState`

## 9. Desktop Scroll Safety

Desktop scrolling is a protected shell behavior in Tia and must not be changed casually.

Current implementation contract:

- desktop uses the main workspace panel as the primary vertical scroll container
- desktop shell wrappers may clip overflow, but the active `main` region must remain scrollable
- section headers stay inside the same scrollable workspace instead of living outside it
- mobile continues to use the page scroll model unless a feature explicitly requires a local scroll region
- the desktop sidebar may forward wheel input into the main workspace only when the sidebar itself cannot consume that scroll

Do not introduce these regressions:

- do not move desktop back to `window` scroll while keeping shell wrappers height-locked
- do not add `wheel` interception on the main workspace to synthesize scroll manually unless there is a proven bug and a regression test
- do not add `overflow: hidden` or viewport-height locks on new desktop wrappers without confirming which element owns scroll
- do not split header and body into different vertical scroll containers unless the UX explicitly requires it and the keyboard behavior is revalidated

Required regression check after shell changes:

- verify desktop wheel scroll over the main content area
- verify desktop wheel scroll still works when the pointer is over the left sidebar
- verify `PageDown`, `PageUp`, `Home`, `End`, and spacebar still move the desktop workspace correctly
- verify mobile still scrolls normally

## 10. Component States

Every reusable component must account for:

- default
- hover
- active
- focus-visible
- disabled
- loading when applicable
- error when applicable

## 11. Motion

Approved motion:

- durations between `200ms` and `500ms`
- soft screen transitions
- tactile micro-interactions using `scale`
- clear loaders for sync or save flows

Long animations, excessive bounce, or decorative effects that slow the app are not approved.

## 12. Accessibility

- minimum WCAG AA contrast
- icon-only buttons require `aria-label`
- keyboard focus must remain visible
- text should not go below 12px except for auxiliary overlines
- destructive actions require confirmation

## 13. External Design Inputs

External proposal sources such as UI/UX Pro Max are approved as design inputs.

Rules for adoption:

- compare new ideas against `design-system/MASTER.md` first
- merge reusable accepted ideas into the master before repeating them broadly
- translate external references into Tia-specific language and patterns
- do not let generated systems create a second token set or an unrelated dashboard aesthetic
- prefer proposals that improve calmness, credibility, and day-to-day usability over flashy novelty

## 14. Consistency Rules

- do not mix visible languages inside the same screen
- do not introduce another primary typeface
- do not use multiple modal patterns for the same action category
- the customizable accent color must never break legibility or semantic feedback
- desktop and mobile web must preserve the same core product capabilities even when layout changes
