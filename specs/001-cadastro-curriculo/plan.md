# Implementation Plan: Cadastro de Currículo

**Branch**: `001-cadastro-curriculo` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-cadastro-curriculo/spec.md`

## Summary

Deliver a single-page, Google Forms-styled Angular Material form titled
"Cadastre seu currículo" — the system's entry screen, served at the
application root `/app` — that collects a candidate's CV file (Word/PDF, max
4 MB, exactly one) plus name, birth date, email, Brazilian phone, city, state
(UF, chosen from a 27-item dropdown) and one-or-more desired job roles, then
persists everything to Supabase. A fixed header carries the system name and an
"Área do Recrutador" button routing to `/recrutador`; that recruiter screen
("Filtrar currículos") is a **separate future feature** and ships here only as
a themed placeholder.

Technical approach: an Angular 22 standalone frontend using reactive forms and
Angular Material components, talking same-origin to an Express 5 backend
(layered routes → services → repositories) deployed alongside it on Vercel's
free tier. Clicking "Salvar" sends **one multipart request** carrying both the
metadata and the CV file; the backend validates every field, uploads the file
to Supabase Storage, and inserts the row into Supabase Postgres. At a 4 MB
file cap the maximum request is ~4.19 MB, inside Vercel's 4.5 MB serverless
body limit, so no client-side upload orchestration is needed and all storage
credentials stay server-side.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 24.15.0 (both frontend and backend)

**Primary Dependencies**: Angular 22.1.2 (standalone components, reactive
forms), Angular Material 22.1.2, Express 5.2.1, Multer 2.2.0 (multipart
parsing), `@supabase/supabase-js` 2.112.3

**Storage**: Supabase free tier — Postgres table `registrations` for metadata,
Supabase Storage private bucket `curriculos` for the CV files

**Testing**: Backend — Node built-in `node:test` runner (validation service +
registration service). Frontend — Karma + Jasmine (Angular default) for
`RegistrationService` and form validator wiring. Risk-based per Constitution
Principle IV; no tests for presentational styling.

**Target Platform**: Modern evergreen browsers (Chrome/Edge/Firefox/Safari),
desktop and mobile web; backend runs as a Vercel serverless function

**Project Type**: Web application (separate frontend + backend)

**Performance Goals**: Form submission (metadata + 2 MB file upload) completes
in under 5 seconds on a typical broadband connection; initial page interactive
in under 3 seconds — supports spec SC-001 (full form completed in under 3
minutes)

**Constraints**: Zero infrastructure cost (no paid tier, no credit card);
CV file uploads capped at 4 MB, keeping a maximum multipart request (~4.19 MB)
inside Vercel's 4.5 MB serverless body limit; all UI text in Brazilian
Portuguese

**Scale/Scope**: Prototype scale — 1 functional screen (the entry screen at
`/app`) plus a placeholder screen at `/recrutador`, 1 REST endpoint, 2
entities, low tens of submissions during demos; bounded by Supabase free tier
(500 MB DB, 1 GB storage)

**Routing**: Angular `baseHref` = `/app/`; route `''` renders the registration
form, route `recrutador` renders the recruiter-area placeholder, `**`
redirects to `''`. At the edge, `/` redirects to `/app`, the bare
`/recrutador` redirects to `/app/recrutador`, and `/api/*` goes to the backend
function (FR-001a, FR-001b, FR-001d)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluated against Constitution v2.1.0.

| Principle | Requirement | Status | How this plan complies |
|-----------|-------------|--------|------------------------|
| I. Angular Frontend Standards | Standalone components, strict TS, reactive forms for validated forms, logic in services, **Angular Material for UI** | ✅ PASS | Angular 22 standalone; `strict: true`; the whole form is a reactive `FormGroup`; all HTTP in `RegistrationService`; every control is a Material component (`mat-card`, `mat-form-field`, `mat-datepicker`, `mat-checkbox`, `mat-dialog`, `mat-button`) |
| II. Node.js Backend Standards | Layered routes/services/repositories, no DB queries in handlers, env-var config, REST conventions | ✅ PASS | `routes/` → `services/` → `repositories/`; Supabase client only instantiated in `repositories/` and `lib/supabase.ts`; `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` read from env, never committed; resource-based `POST /api/registrations` returning `201`/`400`/`500` |
| III. Free-Tier Persistence | DB + storage on a permanently free tier; free-tier limits documented in plan | ✅ PASS | Supabase free Postgres + Storage; limits table documented in [research.md](./research.md) §R4 and summarised below |
| IV. Pragmatic Testing | Tests required for validation logic, data-mutating endpoints, data transforms; presentational UI exempt | ✅ PASS | `node:test` covers every field validation rule and the create-registration success/failure paths (including file-cleanup-on-insert-failure); frontend `RegistrationService` unit-tested with mocked HTTP; Google-Forms styling untested by design |
| V. Simplicity & Prototype Speed | Simplest structure, no speculative abstraction, defer non-functional polish | ✅ PASS | Two folders, one endpoint, one request per submission, no monorepo tooling, no shared library for two regexes (duplication explicitly preferred), no i18n layer, no animations, no auth |
| VI. Design & Usability Consistency | One theme, one spacing rhythm, one control per job, one feedback channel, consistent wording and field presentation, baseline a11y | ✅ PASS | See the compliance notes below the table |
| Tech Stack: Hosting | Frontend and backend on a permanently free hosting tier, no card-gated trial | ✅ PASS | Vercel Hobby hosts both from one project; documented in [research.md](./research.md) §R5 |

**Principle VI compliance for this feature**:

- **Theme**: one Angular Material theme defined once in `frontend/src/styles.scss`;
  the Google Forms look is achieved through that theme plus layout rules, with no
  per-component color or font overrides.
- **One header**: a single `HeaderComponent` (`mat-toolbar`) is rendered once in
  `app.ts`, above the `<router-outlet>`, so both the form and the recruiter
  placeholder share the identical header rather than each drawing its own
  (FR-001c). The placeholder screen reuses the same theme and spacing, so the
  recruiter area does not look like a different product.
- **Spacing**: a single set of spacing variables in `styles.scss`, reused by every
  question card.
- **One control per job**: one `mat-datepicker` (birth date), one `mat-checkbox`
  group (desired roles), one `mat-select` (UF), one file-attachment control (CV),
  one primary/secondary button pair ("Salvar" / "Limpar").
- **One feedback channel**: **all** success, validation-failure, and system-error
  messages go through the single `MessageDialogComponent` (`MatDialog`), per
  spec FR-016/FR-017/FR-019. No snackbars, inline banners, or `alert()` anywhere.
- **Wording**: all copy in pt-BR. The strings "Cadastre seu currículo",
  "Anexar currículo", "Preencha todos os campos", "Salvo com sucesso", "Salvar"
  and "Limpar" are fixed by the spec and MUST appear verbatim.
- **Field presentation**: every field is a `mat-form-field` in its own card with
  the label above the control, the required marker in the same position, and
  errors rendered in `mat-error` beneath the control.
- **Baseline usability**: every control has an associated `<label>`/`mat-label`,
  the whole form is keyboard-navigable in visual order, and each `mat-error`
  names the field it belongs to.

**Free-tier limits acknowledged** (Principle III): Supabase 500 MB database,
1 GB total storage, 50 MB per-file cap, project auto-pauses after 7 days of
inactivity (must be resumed from the dashboard before a demo). Vercel Hobby:
100 GB bandwidth/month, 4.5 MB serverless request body — satisfied with ~11%
headroom by the 4 MB CV cap, as analysed in [research.md](./research.md) §R5–R6.

**Result**: All gates pass. No entries required in Complexity Tracking.

*Post-Phase 1 re-check*: Re-evaluated after generating data-model.md,
contracts/ and quickstart.md — the design introduces no new dependencies,
no additional abstraction layers, and no paid services. **All gates still pass.**

*Re-check against Constitution v2.2.0*: Principle VI (Design & Usability
Consistency) was added after this plan was written. Re-evaluated — the design
already routed every message through one dialog component and every control
through Angular Material, so it passes without changes; the compliance notes
above make that explicit rather than implicit.

## Project Structure

### Documentation (this feature)

```text
specs/001-cadastro-curriculo/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── registrations-api.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── index.ts                          # Express app assembly + local listen
│   ├── lib/
│   │   └── supabase.ts                   # Supabase client from env vars
│   ├── routes/
│   │   └── registrations.routes.ts       # HTTP layer only: Multer, delegate, respond
│   ├── services/
│   │   ├── registration.service.ts       # Orchestration: validate → upload → insert
│   │   └── validation.service.ts         # Field rules (name, date, email, phone, city, UF, roles, file)
│   ├── repositories/
│   │   ├── registration.repository.ts    # Postgres insert
│   │   └── storage.repository.ts         # File upload + delete (rollback)
│   └── types/
│       └── registration.ts               # Shared request/response/domain types
├── tests/
│   ├── validation.service.test.ts
│   └── registration.service.test.ts
├── package.json
└── tsconfig.json

frontend/
├── src/
│   ├── app/
│   │   ├── app.config.ts                 # Standalone bootstrap providers + router
│   │   ├── app.routes.ts                 # '' → form; 'recrutador' → placeholder; '**' → ''
│   │   ├── app.ts                        # Root: <app-header> + <router-outlet>
│   │   ├── features/
│   │   │   ├── registration-form/
│   │   │   │   ├── registration-form.ts        # Reactive form component
│   │   │   │   ├── registration-form.html      # Google Forms-style Material layout
│   │   │   │   └── registration-form.scss
│   │   │   └── recruiter-area/
│   │   │       └── recruiter-area-placeholder.ts  # "Em construção" + link back to /app
│   │   ├── shared/
│   │   │   ├── header/
│   │   │   │   └── header.ts             # mat-toolbar: system name + "Área do Recrutador"
│   │   │   ├── dialogs/
│   │   │   │   └── message-dialog.ts     # MatDialog for success/error messages
│   │   │   ├── validators/
│   │   │   │   └── br-validators.ts      # Phone, not-future-date validators
│   │   │   └── constants/
│   │   │       └── uf.constant.ts        # The 27 Brazilian UF codes
│   │   ├── services/
│   │   │   └── registration.service.ts   # Builds the FormData and POSTs it
│   │   └── models/
│   │       └── registration.model.ts
│   ├── styles.scss                       # Material theme + Google Forms page styling
│   └── index.html
├── proxy.conf.json                       # Dev: proxy /api → localhost:3000
├── angular.json                          # baseHref: /app/
├── package.json
└── tsconfig.json                         # strict: true

api/
└── index.ts                              # Vercel entrypoint re-exporting the Express app

vercel.json                               # Build both; / → /app, /app/* → SPA, /api/* → function
```

**Structure Decision**: Web application structure (frontend + backend), chosen
because the feature requires both an Angular UI and a Node REST API per
Constitution Principles I and II. `backend/` and `frontend/` stay independently
runnable in development (`ng serve` proxies `/api` to Express on port 3000),
while the thin `api/index.ts` adapter and root `vercel.json` let both deploy as
a single Vercel project so the browser calls the API same-origin with no CORS
setup. The one domain carries two reserved prefixes that cannot collide:
`/app` (the Angular entry screen, FR-001a) and `/api` (the backend). No
npm-workspace tooling is introduced — the two sides share no code, per
Principle V.

## Implementation Phases

**Phase 0 — Research** ✅ complete → [research.md](./research.md)
Resolved: framework versions, Google Forms styling approach, Supabase as the
single free DB+storage provider, Vercel hosting, the single-request multipart
upload flow, BR phone/city/UF rules, testing approach, repo layout.

**Phase 1 — Design & Contracts** ✅ complete
- [data-model.md](./data-model.md) — `registrations` table, `job_roles` enum,
  field-by-field validation rules, record lifecycle
- [contracts/registrations-api.md](./contracts/registrations-api.md) — the
  single `POST /api/registrations` multipart endpoint, request/response
  shapes, status codes, error payloads
- [quickstart.md](./quickstart.md) — Supabase + local setup, run commands, and
  the end-to-end validation scenarios that prove each user story

**Phase 2 — Task breakdown** — produced by `/speckit-tasks`, not this command.

## Out of Scope

Explicitly deferred (consistent with Principle V and the spec's Assumptions):

- Candidate authentication, duplicate-submission detection, LGPD consent
  checkbox, free-text detail for the "Outros" role
- The "Filtrar currículos" recruiter screen itself — listing, filtering,
  sorting, pagination, and CV download — plus the `GET` endpoints it will
  need. Planned as a **separate feature**; this feature delivers only the
  header button, the `/recrutador` route, and a placeholder screen (FR-001e).
- Authentication/authorisation for the recruiter area. Deliberately deferred
  to that feature, where it must be decided before any candidate personal data
  is exposed — see the note below.
- Validating that the typed city exists or belongs to the selected UF (no IBGE
  municipality dataset or lookup API); a dependent City dropdown driven by UF
- Virus scanning of uploaded files, i18n, animations, dark theme

> **Carry-forward for the "Filtrar currículos" feature**: that screen will read
> back every candidate's name, email, phone, city/UF and CV file. Whether it
> requires authentication MUST be decided as part of specifying it — an
> unauthenticated recruiter area would publish personal data to anyone holding
> the link. Nothing in this feature exposes that data, since `/recrutador`
> renders only a static placeholder and no `GET` endpoint exists yet.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — all Constitution v2.2.0 gates pass before and after Phase 1
design. This section is intentionally empty.
