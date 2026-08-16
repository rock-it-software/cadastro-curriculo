# Implementation Plan: Filtrar Currículos

**Branch**: `002-filtrar-curriculos` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-filtrar-curriculos/spec.md`

## Summary

Deliver the recruiter-facing search screen at `/app/recrutador` (Angular
Material, replacing feature 001's placeholder), consisting of a filter form
("Vagas" required single-select, "Cidade" optional text, "UF" optional
single-select), a filter summary, and a paginated, sorted table of matching
candidates with a per-row CV download action. All data is read from the
`registrations` table and `curriculos` bucket created by
[001-cadastro-curriculo](../001-cadastro-curriculo/plan.md) — no schema
change and no new provider.

Technical approach: two new read-only Express endpoints —
`GET /api/registrations` (filtered, sorted, paginated list with an exact
total count, built with Supabase's `.contains`/`.ilike`/`.eq`/`.range` query
builder) and `GET /api/registrations/:id/cv` (proxies the private bucket
object through the backend as an attachment download) — consumed by a new
Angular `RecruiterSearch` feature component using reactive forms, a
Material table, and server-side `MatPaginator`. Both endpoints are added to
the same layered backend and deployed as part of the same Vercel project;
no new infrastructure, dependency, or hosting decision is introduced.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 24.15.0 (both frontend and
backend) — unchanged from 001

**Primary Dependencies**: Angular 22.1.2 (standalone components, reactive
forms, Angular Material — `mat-table`, `mat-paginator`, `mat-select`,
`mat-form-field`, `mat-snack-bar`), Express 5.2.1,
`@supabase/supabase-js` 2.112.3 — all already dependencies of this
repository from 001; no new packages required

**Storage**: Supabase free tier (same project as 001) — reads from the
existing Postgres `registrations` table and the existing private Storage
bucket `curriculos`; no migration, no new table or bucket

**Testing**: Backend — Node built-in `node:test` for the search-query
builder and the age-calculation function. Frontend — Vitest
(`@angular/build:unit-test`) for the new recruiter-search HTTP service.
Risk-based per Constitution Principle IV; no tests for the table/paginator
presentation itself

**Target Platform**: Modern evergreen browsers (Chrome/Edge/Firefox/Safari),
desktop and mobile web; backend runs as the same Vercel serverless function
as 001

**Project Type**: Web application (same frontend + backend pair as 001;
this feature adds routes/components, it does not add a new deployable)

**Performance Goals**: Filter results reflect a changed criterion within 2
seconds (spec SC-001); list query + count round trip stays well under that
budget at prototype data volumes (low hundreds of rows)

**Constraints**: Zero infrastructure cost (reuses 001's free-tier Supabase
+ Vercel setup, no new paid service); unauthenticated route, so the list
response includes only the five fields the table needs (name, age, city,
UF, id) and never email/phone (data-model.md); all UI text in Brazilian
Portuguese

**Scale/Scope**: Prototype scale — 1 functional screen (`/app/recrutador`,
replacing the 001 placeholder), 2 new REST endpoints, 0 new entities (reads
the existing `registrations` row shape), low tens to low hundreds of rows
during demos

**Routing**: No routing change — `frontend/src/app/app.routes.ts` already
reserves the `recrutador` path (FR-001c/d in 001); this feature only swaps
the component that path resolves to, from `RecruiterAreaPlaceholder` to the
new `RecruiterSearch` component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluated against Constitution v2.2.0.

| Principle | Requirement | Status | How this plan complies |
|-----------|-------------|--------|------------------------|
| I. Angular Frontend Standards | Standalone components, strict TS, reactive forms for validated forms, logic in services, Angular Material for UI | ✅ PASS | `RecruiterSearch` is a standalone component under the existing `strict: true` config; the filter is a reactive `FormGroup`; the HTTP call and query-param building live in a new `RecruiterSearchService`; every control (`mat-select`, `mat-form-field`, `mat-table`, `mat-paginator`, `mat-icon`, `mat-snack-bar`) is Angular Material |
| II. Node.js Backend Standards | Layered routes/services/repositories, no DB queries in handlers, env-var config, REST conventions | ✅ PASS | New `routes/registrations-search.routes.ts` (or an added route on the existing router) → `services/registration-search.service.ts` → `repositories/registration.repository.ts` (extended with a `findRegistrations`/`getCvById` query); no new env vars — reuses `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`; resource-based `GET /api/registrations` and `GET /api/registrations/:id/cv` returning `200`/`400`/`404`/`500` |
| III. Free-Tier Persistence | DB + storage on a permanently free tier; free-tier limits documented in plan | ✅ PASS | No new provider or table — reuses 001's Supabase free project; this feature only adds read queries, which do not change the storage/DB limits already documented in [001's data-model.md](../001-cadastro-curriculo/data-model.md) |
| IV. Pragmatic Testing | Tests required for validation logic, data-mutating endpoints, data transforms; presentational UI exempt | ✅ PASS | `node:test` covers the query-building logic (job role required, city/UF optional, combination) and the age-calculation transform — see [research.md § R6](./research.md#r6-testing-approach); frontend `RecruiterSearchService` unit-tested with `HttpTestingController`; the Material table/paginator wiring is exempt as presentational |
| V. Simplicity & Prototype Speed | Simplest structure, no speculative abstraction, defer non-functional polish | ✅ PASS | No new table, no join, no signed-URL flow, no client-side filtering duplicate of the server query (see research.md R1–R2 alternatives-rejected); reuses the existing `JOB_ROLES`/`BRAZILIAN_STATES` constants instead of redefining them; server-side pagination avoids building a second client-side paging mechanism |
| VI. Design & Usability Consistency | One theme, one spacing rhythm, one control per job, one feedback channel, consistent wording and field presentation, baseline a11y | ✅ PASS | See compliance notes below the table |
| Tech Stack: Hosting | Frontend and backend on a permanently free hosting tier, no card-gated trial | ✅ PASS | Same Vercel Hobby project as 001; no new deployable, no new domain/route prefix |

**Principle VI compliance for this feature**:

- **Theme**: no new theme or component-level color/font override — the
  filter form, summary, and table use the single Material theme already
  defined in `frontend/src/styles.scss`.
- **One header**: the recruiter screen renders under the same
  `HeaderComponent` already shared across `/app` and `/app/recrutador`
  (unchanged from 001) — this feature swaps only the routed content below it.
- **Spacing**: reuses the existing `--app-space-*` custom properties from
  `styles.scss` rather than introducing new pixel values (as the current
  placeholder already does).
- **One control per job**: one `mat-select` for Vagas, one `mat-form-field`
  text input for Cidade, one `mat-select` for UF, one `mat-table` +
  `mat-paginator` pair for the results — no alternate list/grid pattern is
  introduced.
- **One feedback channel per event class**: form-level feedback classes
  (validation-blocking, system error) are not introduced by this feature at
  all — there is no submit action. The one feedback event this feature adds,
  per-row download failure, uses `MatSnackBar` exclusively and consistently
  for that specific event class, as justified in
  [research.md § R5](./research.md#r5-download-failure-feedback-mechanism);
  it does not reuse or conflict with the existing `MessageDialogComponent`
  channel, which remains reserved for the registration form's own
  submit-result feedback.
- **Wording**: all copy in pt-BR, matching the exact spec strings — "Buscar
  candidatos", the vaga option labels, "Nome completo", "Idade", "Cidade",
  "UF", "Baixar currículo", and the empty-result message.
- **Field presentation**: each filter control is a `mat-form-field` /
  `mat-select` with the label above the control, matching the pattern
  already established in `RegistrationForm` (001).
- **Baseline usability**: every filter control has an associated
  `mat-label`; the paginator and table are keyboard-navigable (native
  Material behavior); the download icon button has an `aria-label`
  naming the action and the candidate.

**Free-tier limits**: unchanged from 001 — this feature adds `SELECT`
queries and object downloads only, well within the same Supabase 500 MB
DB / 1 GB storage / 5 GB egress monthly free-tier envelope documented in
[001's data-model.md](../001-cadastro-curriculo/data-model.md) and
[001's research.md § R4](../001-cadastro-curriculo/research.md#r4-database-and-file-storage-provider).

**Result**: All gates pass. No entries required in Complexity Tracking.

*Post-Phase 1 re-check*: Re-evaluated after generating data-model.md,
contracts/registrations-search-api.md, and quickstart.md — the design
introduces no new dependencies, no additional abstraction layer beyond the
existing routes → services → repositories split, and no paid services.
**All gates still pass.**

## Project Structure

### Documentation (this feature)

```text
specs/002-filtrar-curriculos/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/             # Phase 1 output (/speckit-plan command)
│   └── registrations-search-api.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Extends the existing `backend/` and `frontend/` from
[001-cadastro-curriculo](../001-cadastro-curriculo/plan.md) — no new
top-level directory. New/changed files only:

```text
backend/
├── src/
│   ├── routes/
│   │   └── registrations.routes.ts        # extended: adds GET / and GET /:id/cv
│   ├── services/
│   │   └── registration-search.service.ts # NEW: builds filter args, computes age
│   ├── repositories/
│   │   └── registration.repository.ts     # extended: findRegistrations, getCvById
│   └── types/
│       └── registration.ts                # extended: search request/response types
├── tests/
│   └── registration-search.service.test.ts # NEW

frontend/
├── src/
│   ├── app/
│   │   ├── app.routes.ts                   # unchanged: 'recrutador' path stays, target component swapped
│   │   ├── features/
│   │   │   └── recruiter-search/           # NEW, replaces recruiter-area/ placeholder
│   │   │       ├── recruiter-search.ts     # Reactive filter form + table + paginator
│   │   │       ├── recruiter-search.html
│   │   │       └── recruiter-search.scss
│   │   ├── services/
│   │   │   └── recruiter-search.service.ts # NEW: GET /api/registrations + CV download call
│   │   └── models/
│   │       └── candidate-summary.model.ts  # NEW: CandidateSummary + paginated envelope types
│   └── services/
│       └── recruiter-search.service.spec.ts # NEW
```

`frontend/src/app/features/recruiter-area/recruiter-area-placeholder.ts` is
removed once `recruiter-search` takes over the `recrutador` route.

**Structure Decision**: No new project or top-level directory — this
feature is purely additive within the existing web-application structure
(`backend/` + `frontend/` + `api/` + `vercel.json`) established in 001. It
follows the same layered backend split (routes → services → repositories)
and the same standalone-component + service Angular pattern, so both sides
stay independently runnable in development exactly as before.

## Implementation Phases

**Phase 0 — Research** ✅ complete → [research.md](./research.md)
Resolved: filter/query strategy against `registrations` (R1), CV download
proxy approach (R2), server-side age calculation (R3), frontend component
structure and server-side pagination (R4), download-failure feedback
mechanism (R5), testing approach (R6).

**Phase 1 — Design & Contracts** ✅ complete
- [data-model.md](./data-model.md) — read-side `CandidateSummary` shape,
  paginated envelope, filter query-parameter validation, reused `job_roles`
  and `state_uf` value sets
- [contracts/registrations-search-api.md](./contracts/registrations-search-api.md)
  — `GET /api/registrations` and `GET /api/registrations/:id/cv`,
  request/response shapes, status codes, error payloads
- [quickstart.md](./quickstart.md) — local setup (reusing 001's Supabase
  project), run commands, and end-to-end validation scenarios per user story

**Phase 2 — Task breakdown** — produced by `/speckit-tasks`, not this
command.

## Out of Scope

Explicitly deferred (consistent with Principle V and the spec's Assumptions):

- Authentication/authorization for `/app/recrutador` — the spec explicitly
  states no authentication for this screen; anyone with the link can search
  and download. Revisiting this is a decision for a future feature, not this
  one.
- Multi-select or "OR" combination for the "Vagas" filter — exactly one vaga
  per search, per spec FR-002.
- Free-text search across all fields, saved/named filters, filter
  persistence across sessions or in the URL.
- Sorting the table by any column other than data de inclusão (e.g.
  clickable column-header sorting) — the spec fixes the sort order (FR-013).
- Audit logging of who searched or downloaded what — no authentication
  means no identity to log against.
- Municipality-aware city search (e.g. validating the city exists or belongs
  to the selected UF) — city/UF pairing was never validated at registration
  time (001's Assumptions) and this feature only queries existing data as-is.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — all Constitution v2.2.0 gates pass before and after Phase 1
design. This section is intentionally empty.
