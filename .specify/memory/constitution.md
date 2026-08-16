<!--
Sync Impact Report
Version change: 2.1.0 → 2.2.0
Modified principles:
  - V. Simplicity & Prototype Speed (clarified: its "defer polish" rule does not
    license inconsistency; cross-reference to new Principle VI added)
Added sections:
  - VI. Design & Usability Consistency (new principle)
Removed sections: none
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (generic "Constitution Check" gate references this file dynamically, no edits needed)
  - .specify/templates/spec-template.md ✅ (no constitution-specific references found)
  - .specify/templates/tasks-template.md ✅ (no constitution-specific references found)
  - .claude/skills/*/SKILL.md ✅ (no agent-specific constitution references found)
  - specs/001-cadastro-curriculo/plan.md ✅ (active plan's Constitution Check table updated with Principle VI row)
Follow-up TODOs: none
-->

# Cadastro Curriculo Constitution
<!-- Fast, simple fullstack prototype: Angular frontend, Node.js backend, free-tier database, storage, and hosting. -->

## Core Principles

### I. Angular Frontend Standards
The frontend MUST be built with Angular using standalone components and the
Angular CLI project structure. Strict TypeScript mode MUST be enabled
(`strict: true` in `tsconfig.json`). Reactive forms MUST be used for any form
with validation logic; template-driven forms are reserved for trivial,
validation-free inputs only. State and API access MUST be encapsulated in
injectable services, never called directly from component templates or
constructors' bodies without a service boundary. Components MUST stay
presentation-focused: business logic and HTTP calls belong in services.
UI components (buttons, forms, inputs, tables, dialogs, navigation, layout,
etc.) MUST use Angular Material wherever a suitable Material component
exists; custom-built UI components are reserved for cases with no Material
equivalent.

**Rationale**: A single, consistently applied frontend architecture keeps the
codebase navigable as it grows and avoids the mixed patterns (template-driven
vs reactive, logic-in-component vs logic-in-service) that make Angular
codebases hard to maintain. Standardizing on Angular Material avoids
hand-rolling UI primitives, which is faster and matches the project's
fast-prototype goal (Principle V).

### II. Node.js Backend Standards
The backend MUST be built with Node.js using a layered structure that
separates HTTP routing/controllers, business logic (services), and data
access (repositories/models). Route handlers MUST NOT contain direct
database queries. All external configuration (database URLs, API keys,
storage credentials) MUST be supplied via environment variables and MUST
NOT be hardcoded or committed to the repository. The API MUST follow REST
conventions (resource-based URLs, correct HTTP verbs and status codes) for
any client-facing endpoint.

**Rationale**: A layered backend keeps persistence and transport concerns
separable, which is required to swap or scale the free-tier persistence
provider (Principle III) without rewriting business logic.

### III. Free-Tier Persistence Constraint
The persistence layer (database and file/object storage) MUST run entirely
on a provider tier that is free in production at the project's expected
scale (e.g., MongoDB Atlas Free, Supabase Free, Firebase Spark, or
equivalent) — no feature MAY be designed in a way that requires a paid tier
or paid add-on to function. Any dependency on a specific provider's free-tier
limit (storage cap, request rate, connection limit) MUST be documented in
the relevant feature's plan.md so the limit is visible before implementation.

**Rationale**: This project's operating constraint is zero infrastructure
cost. Designing against paid-tier assumptions (e.g., unlimited storage,
dedicated connections) would silently break the project the moment real
usage arrives.

### IV. Pragmatic Testing for a Prototype
Strict up-front TDD is NOT required. Tests MUST still exist for the
project's core value-critical paths: any data-validation logic, any
endpoint that writes/mutates persisted data, and any resume/CV data
transformation. These tests MAY be written alongside or immediately after
the implementation rather than strictly before it. Purely presentational
UI, exploratory spikes, and throwaway wiring MAY ship without tests.
Whenever a bug is found in a tested area, a regression test MUST be added
before the fix is considered done.

**Rationale**: The project's stated goal is a fast, simple prototype, not a
long-lived production system. Mandating strict Red-Green-Refactor TDD on
every line would slow delivery beyond what the prototype goal justifies;
testing effort is instead concentrated where a defect would actually lose
or corrupt user data.

### V. Simplicity & Prototype Speed
Implementations MUST start with the simplest structure that satisfies the
current requirement, and MUST favor shipping a working feature over
polishing it. New abstractions (base classes, generic utilities, shared
libraries, design patterns beyond what Angular/Node idioms already provide)
MUST NOT be introduced speculatively for hypothetical future needs — they
are justified only once a second concrete use case exists. Duplication of a
few lines across two places is preferred over a premature shared
abstraction. Non-functional polish (custom theming, animations, advanced
error recovery, i18n) MUST be deferred unless explicitly requested by the
user. Deferring polish MUST NOT be used to justify inconsistency: shipping
two different ways of doing the same thing is not simpler than shipping one
(see Principle VI).

**Rationale**: The project is an intentionally fast, simple prototype
running on free-tier infrastructure; abstraction layers and non-essential
polish cost more in time than the value they add at this stage.

### VI. Design & Usability Consistency
The interface MUST present one coherent design and interaction language.
Specifically:

- **One theme**: a single Angular Material theme MUST be defined once in the
  global stylesheet. Component-level hard-coded colors, fonts, or
  one-off overrides of Material defaults MUST NOT be introduced; if a token
  is missing, it is added to the theme, not inlined at the call site.
- **One spacing and layout rhythm**: spacing MUST come from a single set of
  values reused across the app rather than ad-hoc pixel values per component.
- **One control per job**: a given interaction MUST use the same component
  everywhere it appears — one date control, one multi-select pattern, one
  file-attachment pattern, one primary/secondary button pairing.
- **One feedback channel**: user feedback for a given class of event
  (success, validation failure, system error) MUST use a single consistent
  mechanism across the app; mixing dialogs, snackbars, inline banners, and
  native `alert()` for the same class of event is prohibited.
- **Consistent wording**: user-facing copy MUST use one language
  (pt-BR for this project) and consistent terminology and casing for the same
  concept across labels, buttons, dialogs, and error messages. Where the
  specification fixes exact strings, those strings MUST be used verbatim.
- **Consistent field presentation**: every form field MUST follow the same
  label placement, required-field marker, helper-text position, and
  error-message position and tone.
- **Baseline usability**: every input MUST have a programmatically associated
  label, MUST be reachable and operable by keyboard, and validation errors
  MUST identify the field they belong to.

**Rationale**: Consistency is what makes an interface learnable — a user who
learns one field learns them all. It is also the *cheaper* path for a
prototype: reusing one theme, one pattern, and one feedback mechanism is less
work than inventing variations, so this principle reinforces rather than
competes with Principle V. Deviations here are the most visible kind of defect
to a stakeholder reviewing a demo.

## Technology Stack

- **Frontend**: Angular (latest stable LTS release), Angular Material for
  UI components, TypeScript strict mode, Angular CLI tooling.
- **Backend**: Node.js (latest stable LTS release), REST API.
- **Database**: Any provider with a permanently free production tier
  (e.g., MongoDB Atlas Free, Supabase Free Postgres, Firebase Firestore
  Spark). The specific provider is selected and documented per-feature in
  plan.md's Technical Context, not fixed here, so long as it satisfies
  Principle III.
- **File/object storage**: Any provider with a permanently free production
  tier (e.g., Supabase Storage, Firebase Storage Spark, Cloudinary free
  tier). Selected and documented per-feature in plan.md, subject to
  Principle III.
- **Hosting**: The frontend and backend MUST be deployed on a platform with
  a permanently free tier (e.g., Vercel, Netlify, Render, Railway free tier,
  GitHub Pages for static frontend hosting). Deployment MUST NOT require a
  paid plan, a credit card-gated trial, or usage that predictably exceeds
  the free tier's limits at prototype scale. The chosen host is documented
  in the relevant plan.md's Technical Context.
- Paid services, paid API tiers, or infrastructure requiring a credit card
  commitment beyond free-tier usage MUST NOT be introduced without an
  explicit, separately approved exception recorded in the relevant
  plan.md's Complexity Tracking section.

## Development Workflow

- Every feature MUST go through spec.md → plan.md → tasks.md before
  implementation begins, per the Spec Kit workflow already in use in this
  repository.
- Every plan.md MUST complete the Constitution Check gate against this
  document before Phase 0 research begins, and again after Phase 1 design
  before proceeding to tasks.
- Pull requests / merges MUST NOT be completed with failing tests for the
  affected area.
- Any deviation from Principles I–VI MUST be recorded and justified in the
  plan.md Complexity Tracking section; unjustified deviations are grounds
  for rejecting the plan.

## Governance

This constitution supersedes all other project practices and templates
where a conflict exists. Amendments require: (1) a documented rationale for
the change, (2) a version bump per the policy below, and (3) propagation of
any resulting changes to `.specify/templates/*.md` and agent guidance files
in the same change set. All feature plans MUST verify compliance with this
constitution at the Constitution Check gate in plan-template.md; unresolved
violations MUST be justified in Complexity Tracking or the plan MUST be
revised.

Versioning policy (semantic versioning applied to governance):
- **MAJOR**: Backward-incompatible principle removals or redefinitions.
- **MINOR**: A new principle or section is added, or existing guidance is
  materially expanded.
- **PATCH**: Wording clarifications, typo fixes, non-semantic refinements.

**Version**: 2.2.0 | **Ratified**: 2026-08-15 | **Last Amended**: 2026-08-15
