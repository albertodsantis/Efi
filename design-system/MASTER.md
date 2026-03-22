# Tia - Master Design System

## 1. Purpose

This document is the single design authority for Tia.

It defines the canonical visual system, interaction tone, and adoption rules for any UI work created by humans, Codex, or external design-assist tools such as UI/UX Pro Max.

If another design-oriented source proposes a conflicting rule, this file wins until it is explicitly updated.

## 2. Scope and Precedence

This file governs:

- brand direction
- visual tokens
- component behavior
- layout principles
- motion and accessibility expectations
- the workflow for adopting external UI proposals

Precedence order:

1. `design-system/MASTER.md`
2. `FRONTEND_GUIDELINES.md`
3. implementation details in `apps/web`
4. exploratory external references, prompts, screenshots, or generated ideas

## 3. Product Context

Tia is a Spanish-first micro SaaS for creators and creator operators.

The product must feel:

- operational, not decorative
- warm, soft, and credible
- mobile-first in hierarchy, but fully usable as a desktop workspace
- compact enough for daily work without looking dense or hostile

Visible product copy should remain in Spanish unless there is a product-specific reason not to.

## 4. Core Design Principles

Mandatory principles:

- desktop and mobile web must feel like the same product, not two separate designs
- interfaces should reduce chrome and keep the working area prominent
- rounded surfaces and calm contrast are preferred over sharp enterprise styling
- cards should be used when they add structure, not by default
- the system should look polished from day one without becoming visually noisy
- hierarchy must come from spacing, type, grouping, and contrast before decoration
- accent color is customizable, but legibility and semantic clarity are never negotiable

## 5. Brand Direction

Approved identity direction: `Soft Studio Console`

Visual thesis:

- a calm creator-operations console with soft materials, restrained contrast, and a highly usable daily-work rhythm

Approved visual direction:

- soft workspace SaaS
- tactile surfaces
- subtle accent gradients in app framing
- strong readability
- compact headers inside content, not oversized page heroes
- operational calm over dashboard spectacle
- polished restraint over decorative flourish

Material direction:

- low-noise surfaces with soft separation
- blurred or translucent treatment only when readability stays excellent
- thin borders, diffused shadows, and tonal grouping before heavy card framing
- panels should feel layered, not boxed

Composition direction:

- primary workspace first
- navigation should feel quiet and supportive
- secondary context should be present but not visually louder than the task surface
- avoid KPI mosaics as the main identity signal
- prefer grouped rows, sections, split layouts, and list rhythm before adding more cards

Tone direction:

- warm
- composed
- modern
- premium without luxury theatrics
- creator-friendly without becoming playful or juvenile

Disallowed drift:

- adding a second primary design language
- switching to a hard-cornered corporate dashboard look
- introducing a heavy component framework with its own visual identity
- using external inspiration as direct canon without translating it to Tia
- turning routine app views into marketing-style hero compositions
- using dense card grids as the default product language

## 6. Canonical Tokens

### 6.1 Color Foundations

Light base:

- `bg-app-light`: `#F6F3EE`
- `bg-surface-light`: `#FFFDF9`
- `bg-subtle-light`: `#F2EEE8`
- `text-primary-light`: `#201A17`
- `text-secondary-light`: `#6B625C`
- `border-light`: `#E5DED6`

Dark base:

- `bg-app-dark`: `#171311`
- `bg-surface-dark`: `#231D1A`
- `bg-subtle-dark`: `#332B27`
- `text-primary-dark`: `#F7F2EC`
- `text-secondary-dark`: `#B6ABA2`
- `border-dark`: `#3A312C`

Semantic colors:

- `success`: `#10B981`
- `warning`: `#F59E0B`
- `danger`: `#F43F5E`
- `info`: `#3B82F6`

### 6.2 Accent System

Default accent:

- target branded default: `#C96F5B`
- current runtime default may remain temporarily unchanged until the shell refresh is implemented

Supporting identity accents:

- warm clay accent for primary action and selected state
- muted eucalyptus or sea-glass tones may appear as secondary atmospheric support, never as a second competing CTA color

Accent rules:

- the user may change the accent color
- every accent variant must preserve AA contrast on light and dark surfaces
- derived accent tokens should include foreground, soft, strong-soft, border, and glow variants
- semantic states must remain visually distinct from accent states
- accent should feel warm and intentional, not neon or candy-like

### 6.3 Typography

Primary typeface:

- preferred direction: a modern grotesk or soft neo-grotesk sans
- approved interim implementation: native system stack until a branded typeface is adopted

Mono typeface:

- `Geist Mono`

Scale:

- `H1`: 30px, weight 800, tight tracking
- `H2`: 24px, weight 700 to 800
- `H3`: 18px, weight 700
- `Body Large`: 15px, weight 500
- `Body`: 13px, weight 400
- `Caption`: 12px, weight 600
- `Label / Overline`: 10px to 11px, weight 700, uppercase, wide tracking

Typography behavior:

- headlines should feel calm and assured, not loud or startup-generic
- interface labels should rely on weight and spacing instead of color noise
- avoid overly geometric or futuristic display treatments

### 6.4 Spacing

Approved spacing system:

- base unit: `4px`
- primary scale: `4 / 8 / 12 / 16 / 20 / 24 / 32`
- mobile screen padding: `24px`
- primary gap between cards: `16px`

### 6.5 Radius

Approved radii:

- `radius-sm`: `12px`
- `radius-md`: `16px`
- `radius-lg`: `24px`
- `radius-xl`: `32px`
- `radius-pill`: `9999px`

### 6.6 Shadow

Approved shadows:

- `shadow-soft`: `0 8px 30px rgba(0,0,0,0.03)`
- `shadow-medium`: `0 20px 60px rgba(0,0,0,0.08)`
- `shadow-floating`: `0 8px 30px rgba(0,0,0,0.12)`

## 7. Canonical Layout Rules

- app framing may use subtle accent-led atmosphere, but content areas must stay readable
- shared spacing and surface logic should exist across breakpoints
- mobile may use bottom navigation
- desktop may use rail or sidebar navigation
- section headers belong inside the scrollable content
- avoid hero-sized page intros for routine product views
- reduce redundant summary blocks when the workspace itself is the main value
- routine app screens should feel like a console, not a marketing page
- the main column should carry the visual weight
- secondary regions should support scanning, not fragment the interface
- when deciding between another card and a cleaner layout, prefer the cleaner layout

## 8. Canonical Components

The minimum approved reusable component set is:

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

Behavior expectations:

- inputs keep a visible accent-led focus state
- icon-only buttons require labels
- badges never rely on color alone
- mobile modals open as sheets when appropriate
- desktop modals center in the viewport
- components should feel soft and precise, not bubbly or toy-like
- default surfaces should be quiet enough that the content and state carry the hierarchy

## 9. Motion

Approved motion:

- durations between `200ms` and `500ms`
- soft transitions between screens and states
- small tactile scale feedback on direct manipulation
- loaders and sync states should feel clear, not flashy
- the interface should feel responsive and composed, never dramatic

Disallowed motion:

- long decorative animation
- excessive bounce
- motion that makes the app feel slower
- theatrical transitions that make the product feel performative instead of useful

## 10. Accessibility

- minimum WCAG AA contrast
- visible keyboard focus
- body text should not go below 12px except auxiliary overlines
- destructive actions require confirmation
- accent personalization must not reduce readability or semantic clarity

## 11. Implementation Contract

The frontend should implement this master through:

- CSS variables or tokens for color, typography, radius, and shadow
- shared primitives in `apps/web/src/components/ui.tsx`
- app-wide token application in `apps/web/src/index.css`
- accent derivation utilities in `apps/web/src/lib/accent.ts`

Implementation may evolve, but the visual decisions above should not drift silently.

## 12. External Proposal Intake

UI/UX Pro Max and similar tools are approved as idea generators and consistency enhancers, not as parallel authorities.

When external proposals are used:

- treat them as inputs, not canon
- map their suggestions to Tia's product context
- preserve Spanish-first copy and the current product shape
- merge useful ideas into this file before treating them as reusable rules
- avoid adopting another library's naming, token structure, or style language verbatim unless intentionally approved

## 13. Adoption Workflow For New UI Ideas

When Codex or a teammate uses UI/UX Pro Max:

1. gather the proposal, reference, or generated system
2. compare it against this master
3. keep any idea that improves clarity, hierarchy, conversion, or polish without breaking the current identity
4. translate the accepted idea into Tia-specific language and tokens
5. update this file if the idea becomes reusable system guidance
6. update `FRONTEND_GUIDELINES.md` only with implementation-facing guidance derived from this master

## 14. Current Project Translation

For the current repository, this means:

- the existing frontend already follows the approved rounded, compact workspace direction
- current accent utilities and shared UI primitives are part of the intended system
- future UI/UX Pro Max output should refine layout, hierarchy, calmness, and polish around that base
- external output must not replace the current system with a generic dashboard aesthetic
- the next redesign phase should prioritize shell, surface hierarchy, and component language before decorative brand flourishes
