---

description: "Task list for Adicionar campo Bairro implementation"
---

# Tasks: Adicionar campo Bairro

**Input**: Design documents from `/specs/003-add-bairro-field/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/bairro-field-addendum.md, quickstart.md

**Tests**: Test tasks ARE included, as required by Constitution Principle IV
(Pragmatic Testing) — `bairro` participates in the same validation/insert/
search-filter code paths already covered for `city`. Strict TDD is **not**
required. Presentational form/filter/grid template markup is deliberately
untested, consistent with the pre-existing pattern for these components (no
component-level `.spec.ts` exists today).

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story. This feature extends the existing
`backend/` and `frontend/` created in 001-cadastro-curriculo and
002-filtrar-curriculos — no new project or dependency.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Web app structure per plan.md: `backend/src/`, `frontend/src/`, both already
initialized. No new top-level directory.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the database column and the shared type shapes this feature
introduces, before any validation/insert/search logic references them

- [X] T001 Apply the Step A migration from data-model.md — run `alter table registrations add column bairro text check (bairro is null or char_length(trim(bairro)) between 1 and 100);` against the local/dev Supabase project via the SQL editor (see [data-model.md § Rollout](./data-model.md#rollout-on-an-existing-database-phased--see-researchmd--r1))
- [X] T002 [P] Add `bairro: string` to `RegistrationInput` (before `city`), `bairro?: string` to `RegistrationsSearchQuery` (before `city`), and `bairro: string` to `CandidateSummary` (before `city`) in `backend/src/types/registration.ts`
- [X] T003 [P] Add `bairro: string` to `RegistrationFormValue` (before `city`) in `frontend/src/app/models/registration.model.ts`, and `bairro: string` to `CandidateSummary` / `bairro?: string` to `RegistrationsSearchFilter` (both before `city`) in `frontend/src/app/models/candidate-summary.model.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend validation, persistence, and search-filter support for
`bairro` — required by both the registration form (US1) and the
recruiter-search filter/grid (US2/US3)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add `isValidBairro(value: string): boolean` (identical shape to `isValidCity`) and call it in `validateRegistrationFields()` immediately before the `isValidCity` check, pushing `'bairro'` into `invalidFields` on failure, in `backend/src/services/validation.service.ts` (depends on T002)
- [X] T005 Add `bairro: input.bairro.trim(),` immediately before `city:` in `insertRegistration()` in `backend/src/repositories/registration.repository.ts` (depends on T002)
- [X] T006 In `findRegistrations()` in `backend/src/repositories/registration.repository.ts`, add `bairro` to the select column list immediately before `city`, and add an `.ilike('bairro', \`%${bairro}%\`)` block immediately before the existing city `.ilike` block, guarded the same way (depends on T002, T005)
- [X] T007 Add `bairro: String(body.bairro ?? ''),` immediately before `city: String(body.city ?? ''),` when building `RegistrationInput` in the POST handler in `backend/src/routes/registrations.routes.ts` (depends on T002)
- [X] T008 Add the `bairro` optional/trim/`bairro || undefined` pass-through, placed immediately before the equivalent `city` line, in `searchRegistrations()` in `backend/src/services/registration-search.service.ts` (depends on T002, T006)

**Checkpoint**: The backend validates, persists, and filters on `bairro`. User story implementation (UI + script) can now begin.

---

## Phase 3: User Story 1 - Informar bairro ao cadastrar currículo (Priority: P1) 🎯 MVP

**Goal**: A candidate filling the registration form sees "Bairro" immediately
before "Cidade", cannot submit without it, and the value is saved.

**Independent Test**: Submit the form at `/app` without filling "Bairro" and
confirm the existing "Preencha todos os campos" error blocks submission;
fill it in and confirm the registration saves successfully with the bairro
value (quickstart.md Scenario A).

### Implementation for User Story 1

- [X] T009 [US1] Add `bairro: ['', [Validators.required, Validators.maxLength(100)]]` to the `FormGroup` immediately before `city`, and `bairro: ''` to `resetForm()`'s defaults immediately before `city`, in `frontend/src/app/features/registration-form/registration-form.ts`
- [X] T010 [US1] Add a "Bairro" `mat-card`/`mat-form-field` block (copied from the Cidade block: same `mat-error` invalid+touched pattern, label "Bairro", error text "Informe seu bairro.") immediately before the Cidade card, in `frontend/src/app/features/registration-form/registration-form.html`
- [X] T011 [US1] Add `formData.append('bairro', value.bairro);` immediately before the `city` append, in `frontend/src/app/services/registration.service.ts`
- [X] T012 [P] [US1] In `backend/tests/validation.service.test.ts`, add `bairro` to the shared valid-input fixture, add `isValidBairro` unit tests mirroring `isValidCity`'s (accepts a normal value, rejects empty, rejects >100 chars), and assert `validateRegistrationFields` flags `'bairro'` when missing/invalid
- [X] T013 [P] [US1] Add `bairro` to the fixture in `backend/tests/registration.service.test.ts`
- [X] T014 [P] [US1] In `frontend/src/app/services/registration.service.spec.ts`, add `bairro` to the test `RegistrationFormValue` and assert it is appended to the multipart body

**Checkpoint**: User Story 1 is fully functional — the registration form requires and saves "Bairro". This is the deployable MVP.

---

## Phase 4: User Story 4 - Migrar registros existentes para incluir bairro (Priority: P1)

**Goal**: A one-off, idempotent script backfills `bairro` on existing rows
using a curated real-neighborhood list per recognized city, skipping and
reporting rows with an unrecognized city rather than guessing.

**Independent Test**: Run the script against a mix of recognized-city and
unrecognized-city rows and confirm recognized rows get a real neighborhood
while unrecognized rows are left untouched and listed in the printed report;
re-run and confirm zero rows are updated the second time (quickstart.md
Scenario D).

### Implementation for User Story 4

- [X] T015 [US4] Create `backend/scripts/backfill-bairro.ts` following `backend/scripts/seed-registrations.ts`'s conventions (top-level `async function main()`, `getSupabaseClient()`, run via `tsx --env-file=.env`): select rows where `bairro is null`; for each, look up its `city` in a hardcoded `NEIGHBORHOODS_BY_CITY` map (Recife, Olinda, Paulista, João Pessoa, Maceió, São Paulo — see [data-model.md § Migration Script Data](./data-model.md#migration-script-data-curated-city--neighborhood-map)) and `update` with any neighborhood from that city's list; if the city isn't in the map, add it to a `skipped` list instead of updating; print counts updated and the full skipped list with a reminder not to add `NOT NULL` until it's empty (depends on T001)
- [X] T016 [US4] Add `"backfill:bairro": "tsx --env-file=.env scripts/backfill-bairro.ts"` to `backend/package.json` scripts

**Checkpoint**: User Story 4 is independently functional — the backfill script can be run against seeded/existing data at any time after Setup.

---

## Phase 5: User Story 2 - Filtrar candidatos por bairro (Priority: P2)

**Goal**: The recruiter-search filter offers an optional "Bairro" field,
positioned immediately before "Cidade", that narrows results via
case-insensitive partial match, combined by AND with the other filters, and
triggers search on blur.

**Independent Test**: With a vaga selected, type part of a known
neighborhood into "Bairro" and blur the field; confirm the list narrows to
matching candidates only, combined with any other filled criteria
(quickstart.md Scenario B).

### Implementation for User Story 2

- [X] T017 [US2] Add `bairro: this.fb.control<string>('')` to the `FormGroup` immediately before `city`, and add an `onBairroBlur()` method mirroring `onCityBlur()`, in `frontend/src/app/features/recruiter-search/recruiter-search.ts`
- [X] T018 [US2] Add `bairro` trim/undefined-if-empty logic to the query-building code immediately before the equivalent `city` line, and add the bairro-conditional segment to the filter-summary text immediately before the city segment, in `frontend/src/app/features/recruiter-search/recruiter-search.ts` (depends on T017)
- [X] T019 [US2] Add a "Bairro" `mat-form-field` (copied from Cidade's, with `(blur)="onBairroBlur()"`) immediately before the Cidade filter field, in `frontend/src/app/features/recruiter-search/recruiter-search.html`
- [X] T020 [US2] Add `bairro` to the `HttpParams` construction (appended only if present) immediately before `city`, in `frontend/src/app/services/recruiter-search.service.ts`
- [X] T021 [P] [US2] In `backend/tests/registration-search.service.test.ts`, add `bairro` to the fixture, add a case mirroring the existing "trims city before querying" test for bairro, and extend the no-filters test to also assert `bairro: undefined` when absent
- [X] T022 [P] [US2] In `frontend/src/app/services/recruiter-search.service.spec.ts`, add a case asserting `bairro` is appended to `HttpParams` only when present

**Checkpoint**: User Stories 1, 4, and 2 all work together — the form requires bairro, the backfill script can populate historical data, and the filter narrows by bairro.

---

## Phase 6: User Story 3 - Ver bairro na listagem de candidatos (Priority: P2)

**Goal**: The results grid shows a "Bairro" column immediately before the
"Cidade" column.

**Independent Test**: Apply any filter that returns results and confirm the
"Bairro" column renders immediately to the left of "Cidade" with the correct
value per row (quickstart.md Scenario C).

### Implementation for User Story 3

- [X] T023 [US3] Insert `'bairro'` into `displayedColumns` immediately before `'city'` in `frontend/src/app/features/recruiter-search/recruiter-search.ts`
- [X] T024 [US3] Add a `matColumnDef="bairro"` grid column (header "Bairro", cell `{{ candidate.bairro }}`) immediately before the `city` column def, in `frontend/src/app/features/recruiter-search/recruiter-search.html`

**Checkpoint**: All four user stories are independently functional — form, migration script, filter, and grid column all work together.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect the whole feature

- [X] T025 [P] Audit the new `registration-form`/`recruiter-search` markup against Constitution Principle VI — confirm exact strings "Bairro" and "Informe seu bairro." appear verbatim, and that no ad-hoc theme/spacing value was introduced
- [X] T026 [P] Confirm the recruiter-search results table (`frontend/src/app/features/recruiter-search/recruiter-search.scss`) still renders without page-level horizontal scroll at the four Constitution reference widths (390px, 430px, 810px, 1280px+) now that a sixth column has been added; adjust `.recruiter-search__table`'s `min-width` only if needed — the existing `.recruiter-search__table-wrapper` `overflow-x: auto` container (added in 002) should already contain any overflow
- [X] T027 Run the full backend and frontend test suites (`cd backend && npm test`, `cd frontend && npm test`) and confirm all suites pass, including the pre-existing 001/002 suites
- [X] T028 Execute every quickstart.md validation scenario (A–D) against the local environment, including running `npm run backfill:bairro` twice to confirm idempotency (FR-010)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately (T001 is a manual SQL step; T002/T003 are code and can proceed in parallel with T001)
- **Foundational (Phase 2)**: Depends on Setup completion (T001, T002) — BLOCKS User Stories 1, 2, 3 (not US4, which only needs T001)
- **User Stories (Phases 3–6)**: US1, US2, US3 depend on Foundational (Phase 2) completion; US4 depends only on Setup (T001)
- **Polish (Phase 7)**: Depends on all four user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational. Delivers the required-bairro registration form — the MVP.
- **User Story 4 (P1)**: Depends only on Setup (T001, the DB column). Independent of US1/US2/US3 — can be built and run in parallel with them, though it's most useful once real data exists to backfill.
- **User Story 2 (P2)**: Depends on Foundational. Extends the same `RecruiterSearch` component as US3 (shared files), so most naturally built before or after US3 by the same developer, though its backend test coverage (T021) is independent.
- **User Story 3 (P2)**: Depends on Foundational. Small, additive change to the same table/component touched by US2 (`displayedColumns`, template) — can be done immediately after US2 or interleaved with it.

### Within Each User Story

- Repository/validation functions before service functions (Foundational)
- Service functions before route handlers (Foundational)
- Foundational backend before any frontend UI that calls it (US1, US2, US3)
- Frontend models before the components/services that consume them (Setup before all UI stories)
- Tests may be written alongside or immediately after implementation (Constitution Principle IV — no strict TDD)

### Parallel Opportunities

- T002, T003 (Setup) can run in parallel with each other and with T001
- Within Foundational: T004, T005 can start once T002 lands; T006 depends on T005 (same file); T007, T008 can proceed once their respective upstream types/repository pieces exist
- Within US1: T012, T013, T014 (tests) can each run in parallel once their corresponding implementation (T009–T011) exists
- US4 (T015, T016) can run in parallel with US1/US2/US3 entirely, needing only T001
- Within US2: T021 and T022 (tests) can run in parallel once T017–T020 are done
- Polish tasks T025 and T026 can run in parallel

---

## Parallel Example: Setup + Foundational

```bash
# Launch the independent setup pieces together:
Task: "Add bairro to backend/src/types/registration.ts"
Task: "Add bairro to frontend/src/app/models/registration.model.ts and candidate-summary.model.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (including the manual DB migration, T001)
2. Complete Phase 2: Foundational (CRITICAL — blocks US1/US2/US3)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md Scenario A — the registration form must require and save "Bairro"
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → backend fully validates/persists/filters on bairro
2. Add User Story 1 → Scenario A passes → Deploy/Demo (**MVP**)
3. Add User Story 4 → Scenario D passes → historical data can be backfilled (can be done any time after Setup, in parallel with the above)
4. Add User Story 2 → Scenario B passes → recruiters can filter by bairro
5. Add User Story 3 → Scenario C passes → recruiters can see bairro in results
6. Polish → full quickstart sweep, responsive re-check

### Parallel Team Strategy

With two developers, after Foundational completes:

- Developer A: US1 (registration form) → then US4 (backfill script, independent)
- Developer B: US2 → US3 (both extend `recruiter-search.ts`/`.html`, naturally sequential on the same files)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- No new dependency and no new deployable are introduced by this feature —
  see plan.md Constitution Check
- The DB `NOT NULL` constraint (data-model.md Step D) is deliberately **not**
  a task here — it is a manual, deliberately-delayed operational step, gated
  on the backfill script's skip-report being manually resolved to empty,
  documented in quickstart.md's Deployment section rather than as
  implementation work
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
