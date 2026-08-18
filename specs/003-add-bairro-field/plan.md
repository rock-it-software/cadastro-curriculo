# Implementation Plan: Adicionar campo Bairro

**Branch**: `003-add-bairro-field` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-add-bairro-field/spec.md`

## Summary

Add a new required field "Bairro" (neighborhood), positioned immediately
before "Cidade" everywhere city currently appears: the registration form
(`/app`), the recruiter-search filter, and the recruiter-search results grid
(`/app/recrutador`). `bairro` mirrors `city`'s existing constraint shape
exactly (free text, required, 1–100 trimmed chars, optional case-insensitive
partial-match filter, blur-triggered search). Existing `registrations` rows
have no bairro, so a one-off idempotent backend script
(`backend/scripts/backfill-bairro.ts`) backfills them from a curated
per-city real-neighborhood map, skipping and reporting rows whose city isn't
recognized rather than assigning a generic value. The database column starts
nullable and is only switched to `NOT NULL` once that report is empty.

Technical approach: extend the existing layered backend (types → validation
→ repository → routes → search service) and the existing Angular reactive
forms/services, following the exact `city` pattern throughout — no new
architecture, dependency, or infrastructure. No schema migration tooling is
introduced; the column change is manual SQL, consistent with 001/002's
established pattern.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 24.15.0 (both frontend and
backend) — unchanged from 001/002

**Primary Dependencies**: Angular 22.1.2 (standalone components, reactive
forms, Angular Material), Express 5.2.1, `@supabase/supabase-js` 2.112.3 —
all already dependencies; no new packages required, including for the
backfill script (reuses `tsx` + the existing `getSupabaseClient()` singleton)

**Storage**: Supabase free tier (same project as 001/002) — one new nullable
column (`bairro`) added to the existing `registrations` table via manual SQL;
no new table, bucket, or provider

**Testing**: Backend — Node built-in `node:test`, extending the existing
`validation.service.test.ts`, `registration.service.test.ts`, and
`registration-search.service.test.ts` suites with `bairro` fixtures/cases.
Frontend — Vitest, extending the existing `registration.service.spec.ts` and
`recruiter-search.service.spec.ts`. No new component-level spec files (none
exist today for `registration-form`/`recruiter-search`; Constitution
Principle IV exempts presentational UI). See [research.md § R4](./research.md#r4-testing-approach).

**Target Platform**: Modern evergreen browsers, desktop and mobile web;
backend runs as the same Vercel serverless function shape as 001/002 (but
note: `backend/vercel.json` and `frontend/vercel.json` are **separate**
deployables — see research.md § R3)

**Project Type**: Web application (same frontend + backend pair as 001/002;
this feature adds one column, extends existing types/services/components —
no new deployable)

**Performance Goals**: No new performance target — reuses the existing
search endpoint's SC-001 budget (≤2s) from 002; adding one `ILIKE` predicate
to an already-indexless prototype-scale query has no material impact

**Constraints**: Zero infrastructure cost (no new provider, no paid
geocoding/places API — see research.md § R2); backend must reject any
registration missing `bairro` from the moment the updated form ships,
independent of how far along the historical-data backfill/manual-fixup is
(spec FR-011); the `NOT NULL` DB constraint is deliberately delayed until
that backfill/fixup is verified complete (spec FR-009, data-model.md Rollout)

**Scale/Scope**: Prototype scale — 1 new DB column, 1 new standalone script,
extends 2 existing screens (no new screen/route) and 1 existing search
endpoint's request/response shape; low tens to low hundreds of existing rows
to backfill

**Routing**: No routing change — extends the existing `/app` and
`/app/recrutador` routes/components in place

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluated against Constitution v2.3.0.

| Principle | Requirement | Status | How this plan complies |
|-----------|-------------|--------|------------------------|
| I. Angular Frontend Standards | Standalone components, strict TS, reactive forms for validated forms, logic in services, Angular Material for UI | ✅ PASS | Extends the existing standalone `RegistrationForm`/`RecruiterSearch` components' reactive `FormGroup`s with one control each; no new component; all new UI is `mat-form-field`/`mat-select`-equivalent, matching `city`'s existing Material usage exactly |
| II. Node.js Backend Standards | Layered routes/services/repositories, no DB queries in handlers, env-var config, REST conventions | ✅ PASS | Changes stay within the existing routes → services → repositories layers, mirroring `city`'s wiring at each layer; the backfill script uses the existing `getSupabaseClient()`/env-var pattern from `seed-registrations.ts`, not ad-hoc config |
| III. Free-Tier Persistence | DB + storage on a permanently free tier; free-tier limits documented in plan | ✅ PASS | No new provider; one `text` column added to the existing free-tier Supabase table — negligible storage impact (see research.md § R2 for why no paid geocoding API is used) |
| IV. Pragmatic Testing | Tests required for validation logic, data-mutating endpoints, data transforms; presentational UI exempt | ✅ PASS | `bairro` validation, insert, and search-filter logic get `node:test`/Vitest coverage mirroring `city`'s existing tests (research.md § R4); the new form/filter/grid template markup is presentational and untested, consistent with the pre-existing pattern for `registration-form`/`recruiter-search` |
| V. Simplicity & Prototype Speed | Simplest structure, no speculative abstraction, defer non-functional polish | ✅ PASS | No migration tool introduced for one column (research.md § R1); no geocoding API/package introduced for the backfill (research.md § R2); no deploy-ordering compatibility shim introduced (research.md § R3) — every alternative considered and rejected as disproportionate for a prototype |
| VI. Design & Usability Consistency (incl. responsive layout, v2.3.0) | One theme, one spacing rhythm, one control per job, one feedback channel, consistent wording/field presentation, baseline a11y, correct rendering at the 4 reference widths | ✅ PASS | See compliance notes below the table |
| Tech Stack: Hosting | Frontend and backend on a permanently free hosting tier, no card-gated trial | ✅ PASS | Same Vercel Hobby deployables as 001/002; no new deployable, domain, or route |

**Principle VI compliance for this feature**:

- **Theme/spacing**: no new theme, color, or spacing value — the new Bairro
  field/column reuses the exact same `mat-form-field`/`mat-card`/spacing
  tokens (`--app-space-*`) already used for Cidade in both screens.
- **One control per job**: one `mat-form-field` text input for Bairro in the
  registration form, one in the recruiter-search filter, one `mat-table`
  column — no new control type introduced, directly copying Cidade's
  pattern.
- **One feedback channel**: no new feedback channel — a missing/invalid
  Bairro on the registration form surfaces through the exact same
  `mat-error` (inline, invalid+touched) mechanism already used for every
  other field; no dialog/snackbar change.
- **Wording**: all copy in pt-BR — "Bairro" label, "Informe seu bairro."
  error text, mirroring "Cidade"/"Informe sua cidade." exactly.
- **Field presentation**: identical `mat-form-field` shape, label position,
  and error position as Cidade, just relocated one position earlier in each
  form/grid.
- **Baseline usability**: the new inputs get the same `mat-label`
  association and keyboard reachability as every existing field; no new
  interaction pattern to validate.
- **Responsive layout (v2.3.0)**: no new layout structure is introduced —
  the registration form's Bairro card stacks exactly like every other
  single-column card (already verified responsive at all four reference
  widths, per 001's plan.md re-check); the recruiter-search filter's Bairro
  field joins the existing `flex-wrap: wrap` filter row (already verified
  responsive); the grid's new Bairro column sits inside the
  `.recruiter-search__table-wrapper` `overflow-x: auto` container added in
  002's responsive fix, so an additional column only extends the scrollable
  width, it does not reintroduce page-level horizontal scroll. No new
  manual-width check is required beyond confirming this column addition
  during implementation.

**Free-tier limits acknowledged** (Principle III): adding one `text` column
to `registrations` has negligible impact on Supabase's 500 MB database cap
(same table, same row count, one more short string per row); no other
free-tier limit is affected.

**Result**: All gates pass. No entries required in Complexity Tracking.

*Post-Phase 1 re-check*: Re-evaluated after generating data-model.md,
contracts/bairro-field-addendum.md, and quickstart.md — the design
introduces no new dependency, no new abstraction layer, no new provider, and
no new deployable. **All gates still pass.**

## Project Structure

### Documentation (this feature)

```text
specs/003-add-bairro-field/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/             # Phase 1 output (/speckit-plan command)
│   └── bairro-field-addendum.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Extends the existing `backend/` and `frontend/` from
[001-cadastro-curriculo](../001-cadastro-curriculo/plan.md) and
[002-filtrar-curriculos](../002-filtrar-curriculos/plan.md) — no new
top-level directory. Changed/new files only:

```text
backend/
├── src/
│   ├── types/
│   │   └── registration.ts                # extended: bairro on RegistrationInput, RegistrationsSearchQuery, CandidateSummary
│   ├── services/
│   │   ├── validation.service.ts          # extended: isValidBairro + validateRegistrationFields
│   │   └── registration-search.service.ts # extended: bairro optional/trim pass-through
│   ├── repositories/
│   │   └── registration.repository.ts     # extended: insertRegistration + findRegistrations
│   └── routes/
│       └── registrations.routes.ts        # extended: POST body parsing adds bairro
├── scripts/
│   └── backfill-bairro.ts                 # NEW: one-off idempotent backfill script
├── tests/
│   ├── validation.service.test.ts         # extended
│   ├── registration.service.test.ts       # extended
│   └── registration-search.service.test.ts # extended
└── package.json                            # extended: "backfill:bairro" script entry

frontend/
├── src/
│   ├── app/
│   │   ├── models/
│   │   │   ├── registration.model.ts       # extended: bairro on RegistrationFormValue
│   │   │   └── candidate-summary.model.ts  # extended: bairro on CandidateSummary + RegistrationsSearchFilter
│   │   ├── features/
│   │   │   ├── registration-form/
│   │   │   │   ├── registration-form.ts    # extended: FormGroup + resetForm()
│   │   │   │   └── registration-form.html  # extended: new Bairro card before Cidade
│   │   │   └── recruiter-search/
│   │   │       ├── recruiter-search.ts     # extended: FormGroup, onBairroBlur, query build, displayedColumns, summary text
│   │   │       └── recruiter-search.html   # extended: new Bairro filter field + grid column, before Cidade
│   │   └── services/
│   │       ├── registration.service.ts     # extended: formData.append('bairro', ...)
│   │       └── recruiter-search.service.ts # extended: HttpParams
│   └── services/
│       ├── registration.service.spec.ts        # extended
│       └── recruiter-search.service.spec.ts     # extended
```

**Structure Decision**: No new project, directory, or deployable — purely
additive within the existing `backend/` + `frontend/` structure, following
the same layered backend split and standalone-component + service Angular
pattern already established.

## Implementation Phases

**Phase 0 — Research** ✅ complete → [research.md](./research.md)
Resolved: DB rollout strategy for a required column on an existing table
(R1), backfill neighborhood data source (R2), deploy sequencing across two
separate Vercel deployables (R3), testing approach (R4).

**Phase 1 — Design & Contracts** ✅ complete
- [data-model.md](./data-model.md) — `bairro` column shape and phased
  rollout SQL, extended `CandidateSummary`/request-parameter shapes, curated
  city→neighborhood map for the backfill script
- [contracts/bairro-field-addendum.md](./contracts/bairro-field-addendum.md)
  — delta to 001's POST contract and 002's search contract (both already
  updated in place to include `bairro`)
- [quickstart.md](./quickstart.md) — local setup (including the Step A SQL
  and backfill script run), and end-to-end validation scenarios per user
  story

**Phase 2 — Task breakdown** — produced by `/speckit-tasks`, not this
command.

## Out of Scope

Explicitly deferred (consistent with Principle V and the spec's Assumptions):

- Validating `bairro` against a real municipality/neighborhood database at
  input time — matches the existing, unvalidated treatment of `city`.
- Automatically resolving skipped (unrecognized-city) rows — the spec
  requires manual fixup, not an automated fallback (FR-009).
- A DB migration tool for this or future schema changes — out of scope per
  research.md § R1; the manual-SQL pattern established in 001/002 continues.
- A compatibility shim to close the backend/frontend deploy-ordering gap —
  out of scope per research.md § R3; a short window of the old error message
  is accepted.
- Sorting or additional filter operators (e.g. "starts with", multi-bairro)
  for the new field — mirrors `city`'s existing single partial-match
  behavior only.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — all Constitution v2.3.0 gates pass before and after Phase 1
design. This section is intentionally empty.
