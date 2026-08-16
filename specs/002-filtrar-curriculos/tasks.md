---

description: "Task list for Filtrar Currículos implementation"
---

# Tasks: Filtrar Currículos

**Input**: Design documents from `/specs/002-filtrar-curriculos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/registrations-search-api.md, quickstart.md

**Tests**: Test tasks ARE included, as required by Constitution Principle IV
(Pragmatic Testing) — the search query logic and the CV download path are a
data-transformation/data-serving surface that must be covered. Strict TDD is
**not** required. Presentational table/paginator wiring is deliberately
untested.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story. This feature adds no new project
or dependency — it extends the existing `backend/` and `frontend/` created in
001-cadastro-curriculo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Web app structure per plan.md: `backend/src/`, `frontend/src/`, both already
initialized by 001-cadastro-curriculo. No new top-level directory.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the shared type/model shapes this feature introduces,
before any query logic or UI consumes them

- [ ] T001 [P] Add `CandidateSummary`, `RegistrationsSearchQuery`, and `PaginatedRegistrations` types to `backend/src/types/registration.ts` per data-model.md Response/Request Shapes
- [ ] T002 [P] Add the `CandidateSummary` and paginated-envelope models in `frontend/src/app/models/candidate-summary.model.ts` per data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The backend query/download layer that every user story's UI
progressively exposes. Built once here because the filter is a single
Supabase query (research.md §R1) rather than per-criterion endpoints.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [US: shared] Implement `findRegistrations({ jobRole, city, uf, page, pageSize })` in `backend/src/repositories/registration.repository.ts` — `.contains('desired_roles', [jobRole])`, optional `.ilike('city', ...)`, optional `.eq('state_uf', ...)`, `.order('created_at', { ascending: true })`, `.range(...)`, `{ count: 'exact' }` per research.md §R1
- [ ] T004 [P] Implement `getRegistrationCvMeta(id)` (returns `cv_storage_path`, `cv_file_name`, `cv_content_type` or `null`) in `backend/src/repositories/registration.repository.ts`
- [ ] T005 [P] Implement `calculateAge(birthDate: string): number` (completed years as of today) in `backend/src/services/registration-search.service.ts` per research.md §R3
- [ ] T006 Implement `searchRegistrations(query)` in `backend/src/services/registration-search.service.ts` — validates `jobRole` (required, one of the 9 slugs) and `uf` (optional, one of the 27 codes), clamps `page`/`pageSize` to the allowed set (default 1/20), calls T003, maps each row to `CandidateSummary` using T005 (depends on T001, T003, T005)
- [ ] T007 Implement `downloadRegistrationCv(id)` in `backend/src/services/registration-search.service.ts` — calls T004, downloads the object from the `curriculos` bucket via `supabase.storage.from('curriculos').download(path)`, returns the buffer plus `fileName`/`contentType`, or a `not_found`/`internal_error` result (depends on T004)
- [ ] T008 Add `GET /` (query-param parsing → T006 → `200`/`400`/`500` per contracts/registrations-search-api.md) and `GET /:id/cv` (→ T007 → streams with `Content-Disposition: attachment`, or `404`/`500`) handlers in `backend/src/routes/registrations.routes.ts` (depends on T006, T007)
- [ ] T009 [P] Implement `RecruiterSearchService` in `frontend/src/app/services/recruiter-search.service.ts` — `search(filter)` builds the query string and calls `GET /api/registrations`; `downloadCv(id, fileName)` calls `GET /api/registrations/:id/cv` and triggers a browser download of the returned blob (depends on T002)

**Checkpoint**: The backend fully filters, sorts, paginates, and serves CV downloads; the frontend has a typed service to call it. User story implementation (UI) can now begin.

---

## Phase 3: User Story 1 - Buscar candidatos por vaga (Priority: P1) 🎯 MVP

**Goal**: A recruiter opens `/app/recrutador`, selects a vaga, and sees a
list of matching candidates (name, age, city, UF), sorted oldest-first, with
no list shown before a vaga is chosen.

**Independent Test**: Select only "Eletricista" in the Vagas field and
verify the table shows exactly the candidates who indicated that role,
oldest submission first, and that no table renders before selection
(quickstart.md Scenario A).

### Implementation for User Story 1

- [ ] T010 [US1] Create the `RecruiterSearch` standalone component skeleton with a reactive `FormGroup` containing the required `jobRole` control in `frontend/src/app/features/recruiter-search/recruiter-search.ts`
- [ ] T011 [US1] Build the "Buscar candidatos" filter form template with a `mat-select` for "Vagas" listing the 9 role labels (reusing the existing `JOB_ROLES` constant) in `frontend/src/app/features/recruiter-search/recruiter-search.html`
- [ ] T012 [US1] Subscribe to `jobRole.valueChanges`, call `RecruiterSearchService.search()` when it has a value, and keep the results table hidden/empty when it does not, in `frontend/src/app/features/recruiter-search/recruiter-search.ts` (FR-003, FR-007, FR-012)
- [ ] T013 [US1] Render the results `mat-table` with columns "Nome completo", "Idade", "Cidade", "UF" bound to the service response's `items`, preserving server-provided order, in `frontend/src/app/features/recruiter-search/recruiter-search.html` (FR-013, FR-014 — download column added in US3)
- [ ] T014 [US1] Point the `recrutador` route at `RecruiterSearch` in `frontend/src/app/app.routes.ts` and delete `frontend/src/app/features/recruiter-area/recruiter-area-placeholder.ts`
- [ ] T015 [P] [US1] Write `node:test` coverage in `backend/tests/registration-search.service.test.ts` asserting: missing `jobRole` is rejected before any query runs, and a candidate is returned only when the selected role is present in `desired_roles`
- [ ] T016 [P] [US1] Write Vitest coverage in `frontend/src/app/services/recruiter-search.service.spec.ts` asserting `search({ jobRole })` calls `GET /api/registrations?jobRole=...` with no other query params, using `HttpTestingController`

**Checkpoint**: User Story 1 is fully functional — selecting a vaga alone renders the correct, correctly-ordered list. This is the deployable MVP.

---

## Phase 4: User Story 2 - Refinar busca por cidade e UF (Priority: P2)

**Goal**: The recruiter can add cidade and/or UF to the already-selected
vaga; all filled criteria combine with AND; a summary below the form
reflects the current filters with the vaga highlighted.

**Independent Test**: With a vaga selected, type a city and blur the field,
then select a UF — the list narrows to candidates matching all filled
criteria, and the summary updates after each change (quickstart.md
Scenario B).

### Implementation for User Story 2

- [ ] T017 [US2] Add `city` and `uf` controls to the `FormGroup` — `uf` as a `mat-select` populated from the existing `BRAZILIAN_STATES` constant, `city` as a text `mat-form-field` — in `frontend/src/app/features/recruiter-search/recruiter-search.ts` / `.html`
- [ ] T018 [US2] Trigger a new search immediately on `uf.valueChanges`, and only on the city input's native `(blur)` event rather than `valueChanges`, in `frontend/src/app/features/recruiter-search/recruiter-search.ts` (FR-006, FR-007, FR-008)
- [ ] T019 [US2] Render the filter summary below the form — selected vaga visually highlighted (e.g. bold/chip), plus cidade/UF only when filled — in `frontend/src/app/features/recruiter-search/recruiter-search.html` (FR-010)
- [ ] T020 [US2] Render a "Nenhum candidato encontrado" message in place of the table body when `items` is empty, in `frontend/src/app/features/recruiter-search/recruiter-search.html` (FR-020)
- [ ] T021 [P] [US2] Extend `backend/tests/registration-search.service.test.ts` with cases for: case-insensitive partial city match, exact UF match, and jobRole+city+uf combined (FR-006, FR-009)

**Checkpoint**: User Stories 1 and 2 both work — vaga-only search still works, and adding cidade/UF narrows results correctly with an accurate summary.

---

## Phase 5: User Story 3 - Baixar currículo da lista (Priority: P2)

**Goal**: Each row offers a "Baixar currículo" icon that downloads that
candidate's original CV file; a failed download shows a per-row message
without a modal dialog and without disrupting the list.

**Independent Test**: With a filtered list showing, click the download icon
on one row and confirm the correct file downloads; simulate a missing file
and confirm a snackbar appears while the table remains usable (quickstart.md
Scenarios C and D).

### Implementation for User Story 3

- [ ] T022 [US3] Add the "Baixar currículo" column with a `mat-icon-button` (`description` icon, `aria-label` naming the candidate) as the last column, calling `RecruiterSearchService.downloadCv(id, fileName)` on click, in `frontend/src/app/features/recruiter-search/recruiter-search.html` / `.ts` (FR-014, FR-016)
- [ ] T023 [US3] On a failed download, show a `MatSnackBar` message identifying the affected candidate, without opening any dialog and without altering the table state, in `frontend/src/app/features/recruiter-search/recruiter-search.ts` (FR-016a)
- [ ] T024 [P] [US3] Write `node:test` coverage in `backend/tests/registration-search.service.test.ts` for `downloadRegistrationCv`: existing file returns the buffer with the right `fileName`/`contentType`, an unknown `id` returns `not_found`, and a missing storage object returns `not_found`

**Checkpoint**: All three P1/P2 stories work together — filter, refine, and download all function correctly.

---

## Phase 6: User Story 4 - Paginar a lista de resultados (Priority: P3)

**Goal**: The results table is paginated (20 per page by default,
adjustable), and the total matching count is always visible.

**Independent Test**: Filter to a vaga with more than 20 matching
candidates, confirm only 20 render with working page navigation, change the
page size, and confirm the footer's total count stays accurate throughout
(quickstart.md Scenario E).

### Implementation for User Story 4

- [ ] T025 [US4] Add a `MatPaginator` below the table bound to the response's `total` (as `length`) with `pageSizeOptions = [10, 20, 50, 100]` and default `pageSize = 20`, in `frontend/src/app/features/recruiter-search/recruiter-search.html` / `.ts` (FR-017)
- [ ] T026 [US4] Wire the paginator's `(page)` event to re-run the search with the new `page`/`pageSize`, resetting to page 1 whenever `pageSize` changes, in `frontend/src/app/features/recruiter-search/recruiter-search.ts` (FR-018, SC-004)
- [ ] T027 [US4] Display the total matching record count at the end of the table (reusing the paginator's built-in range/total label or an adjacent element), in `frontend/src/app/features/recruiter-search/recruiter-search.html` (FR-019, SC-005)
- [ ] T028 [P] [US4] Extend `backend/tests/registration-search.service.test.ts` covering `page`/`pageSize` clamping to the allowed defaults and the returned `total` matching the unpaginated row count

**Checkpoint**: All four user stories are independently functional — filtering, refining, downloading, and paginating all work together.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect the whole recruiter screen

- [ ] T029 [P] Audit `recruiter-search.html`/`.scss` against Constitution Principle VI — the single theme, shared spacing tokens, and the `MatSnackBar`-only channel for download failures — removing any ad-hoc styling
- [ ] T030 [P] Confirm spec-fixed strings appear verbatim: "Buscar candidatos", "Nome completo", "Idade", "Cidade", "UF", "Baixar currículo", and the empty-result message
- [ ] T031 Run the full backend and frontend test suites (`cd backend && npm test`, `cd frontend && npm test`) and confirm all suites pass, including the pre-existing 001 suites
- [ ] T032 Execute every quickstart.md validation scenario (0–F) against the local environment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001, T002) — BLOCKS all user stories
- **User Stories (Phases 3–6)**: All depend on Foundational phase completion
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Foundational. Delivers the vaga-only search — the MVP.
- **User Story 2 (P2)**: Depends on Foundational. Extends the same `RecruiterSearch` component/form as US1 (T010, T013), so it is most naturally built after US1, though its backend test coverage (T021) is independent.
- **User Story 3 (P2)**: Depends on Foundational. Adds a column to the same table built in US1 (T013); the backend download path (T007, T008) is already complete from Foundational.
- **User Story 4 (P3)**: Depends on Foundational and on the table existing (US1, T013) to attach a paginator to; otherwise touches no file that US2/US3 touch.

### Within Each User Story

- Repository functions before service functions
- Service functions before route handlers
- Foundational backend endpoints before any frontend UI that calls them
- Frontend models/services before the components that consume them
- Tests may be written alongside or immediately after implementation (Constitution Principle IV — no strict TDD)

### Parallel Opportunities

- T001, T002 (Setup) can run in parallel
- T004, T005, T009 (Foundational) can run in parallel with each other (T009 also needs T002 done)
- Within US1: T015 and T016 (tests) can run in parallel with each other, after T012/T014 exist
- Within US2/US3/US4: the `[P]` test-extension tasks (T021, T024, T028) can each run once their story's implementation tasks are done
- Polish tasks T029 and T030 can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch the independent backend/frontend foundation pieces together:
Task: "Implement getRegistrationCvMeta in backend/src/repositories/registration.repository.ts"
Task: "Implement calculateAge in backend/src/services/registration-search.service.ts"
Task: "Implement RecruiterSearchService in frontend/src/app/services/recruiter-search.service.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md Scenario A — vaga-only search must return the correct, correctly-ordered candidates
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → the search/download backend is fully queryable via curl/Postman
2. Add User Story 1 → Scenario A passes → Deploy/Demo (**MVP**)
3. Add User Story 2 → Scenario B passes → recruiters can narrow by location
4. Add User Story 3 → Scenarios C/D pass → recruiters can act on results
5. Add User Story 4 → Scenario E passes → the screen scales to larger result sets
6. Polish → full quickstart sweep

### Parallel Team Strategy

With two developers, after Foundational completes:

- Developer A: US1 → US2 (the filter form pipeline, sequential — they share `recruiter-search.ts`)
- Developer B: waits for US1's table (T013) to land, then takes US3 → US4 (both extend the table/paginator, largely additive)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- No schema migration, no new dependency, and no new hosting configuration
  are introduced by this feature — see plan.md Constitution Check
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
