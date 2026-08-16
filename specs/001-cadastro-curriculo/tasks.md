---

description: "Task list for Cadastro de Currículo implementation"
---

# Tasks: Cadastro de Currículo

**Input**: Design documents from `/specs/001-cadastro-curriculo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/registrations-api.md, quickstart.md

**Tests**: Test tasks ARE included, as required by Constitution Principle IV
(Pragmatic Testing) — validation logic, the data-mutating endpoint, and the
frontend HTTP service must be covered. Strict TDD is **not** required: these
tests may be written alongside or immediately after their implementation.
Presentational styling is deliberately untested.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Web app structure per plan.md: `backend/src/`, `frontend/src/`, plus root
`api/` and `vercel.json`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create the two-folder repository layout (`backend/`, `frontend/`, `api/`) per plan.md Project Structure
- [X] T002 [P] Initialize the Angular 22 workspace in `frontend/` via Angular CLI (standalone, SCSS, routing enabled)
- [X] T003 [P] Initialize the Node/TypeScript backend in `backend/` with `backend/package.json` and `backend/tsconfig.json`
- [X] T004 [P] Add Angular Material 22.1.2 to `frontend/` and confirm `frontend/package.json` lists `@angular/material` and `@angular/cdk`
- [X] T005 [P] Install backend dependencies (`express@5.2.1`, `multer@2.2.0`, `@supabase/supabase-js@2.112.3`) in `backend/package.json`
- [X] T006 [P] Enable `"strict": true` and set the module/target for Node 24 in `backend/tsconfig.json`
- [X] T007 [P] Verify `"strict": true` is enabled in `frontend/tsconfig.json` (Constitution Principle I)
- [X] T008 [P] Create `frontend/proxy.conf.json` forwarding `/api` to `http://localhost:3000` and wire it into the `start` script in `frontend/package.json`
- [X] T009 [P] Set `baseHref` to `/app/` in `frontend/angular.json` (FR-001a)
- [X] T010 [P] Add `npm run dev` (backend watch) and `npm test` (`node --test`) scripts to `backend/package.json`
- [X] T011 [P] Create `.gitignore` entries for `backend/.env`, `node_modules/`, and build output at the repository root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T012 Provision the Supabase free-tier project and create the private `curriculos` storage bucket per quickstart.md §1 — **blocked**: requires the user's own Supabase account
- [ ] T013 Apply the `registrations` table DDL from data-model.md (Schema DDL reference) in the Supabase SQL editor, including all CHECK constraints and RLS enabled with no public policies — **blocked**: depends on T012
- [ ] T014 [P] Create `backend/.env` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, `PORT` (never committed — Constitution Principle II) — **blocked**: needs the real project's credentials from T012; `backend/.env.example` was created as the template
- [X] T015 [P] Implement the Supabase client factory reading env vars in `backend/src/lib/supabase.ts`
- [X] T016 [P] Define the shared domain and request/response types, including the `JobRole` and `StateUf` unions, in `backend/src/types/registration.ts`
- [X] T017 Assemble the Express 5 app (JSON parsing, route mounting, 404 handler) and local `listen` in `backend/src/index.ts`
- [X] T018 Implement the shared error-envelope helper (`{ error, message, fields? }`) and central error middleware in `backend/src/index.ts` per contracts/registrations-api.md
- [X] T019 [P] Create the Vercel serverless entrypoint re-exporting the Express app in `api/index.ts`
- [X] T020 [P] Create root `vercel.json` routing `/api/*` to the function, redirecting `/` → `/app` and `/recrutador` → `/app/recrutador`, and rewriting `/app/*` → `index.html` (FR-001b, FR-001d, research.md §R10)
- [X] T021 [P] Define the single Angular Material theme, the shared spacing variables, and the Google Forms page background in `frontend/src/styles.scss` (Constitution Principle VI)
- [X] T022 [P] Configure the root providers (`provideRouter`, `provideHttpClient`, `provideAnimations`) in `frontend/src/app/app.config.ts`
- [X] T023 Create the app shell rendering `<router-outlet>` in `frontend/src/app/app.ts` and declare the route table (`''` → form, `'**'` → redirect to `''`) in `frontend/src/app/app.routes.ts`

**Checkpoint**: Foundation ready — the app boots at `/app`, the API responds, and Supabase is reachable. User story implementation can now begin.

---

## Phase 3: User Story 1 - Cadastrar currículo com sucesso (Priority: P1) 🎯 MVP

**Goal**: A candidate fills every field, attaches a CV, selects at least one role, clicks "Salvar", and the registration is persisted to Supabase with the confirmation dialog shown and the form reset.

**Independent Test**: Complete the form with a valid PDF under 4 MB and submit — a `registrations` row and the stored file must exist, "Salvo com sucesso" must appear, and the form must clear (quickstart.md Scenario A).

### Implementation for User Story 1

- [X] T024 [P] [US1] Implement the field validation rules (name, birth date not future, email, BR phone, city, UF membership, roles membership, file type/size) in `backend/src/services/validation.service.ts` per data-model.md Validation Rules
- [X] T025 [P] [US1] Implement the CV upload and delete-on-rollback operations against the `curriculos` bucket in `backend/src/repositories/storage.repository.ts`
- [X] T026 [P] [US1] Implement the `registrations` row insert in `backend/src/repositories/registration.repository.ts`
- [X] T027 [US1] Implement `createRegistration` orchestration (validate → upload file → insert row → delete file if insert fails) in `backend/src/services/registration.service.ts` (depends on T024, T025, T026)
- [X] T028 [US1] Implement `POST /api/registrations` with Multer memory storage and `limits.fileSize = 4194304`, returning `201 { id, createdAt }`, in `backend/src/routes/registrations.routes.ts` (depends on T027)
- [X] T029 [P] [US1] Create the registration model, `JobRole` list with display labels, and request payload types in `frontend/src/app/models/registration.model.ts`
- [X] T030 [P] [US1] Create the 27-item Brazilian UF constant in `frontend/src/app/shared/constants/uf.constant.ts` per data-model.md Value Set: Brazilian States
- [X] T031 [P] [US1] Implement the reusable `MessageDialogComponent` (`MatDialog`) — the single feedback channel for all screens — in `frontend/src/app/shared/dialogs/message-dialog.ts` (Constitution Principle VI)
- [X] T032 [US1] Implement `RegistrationService.create()` building the `multipart/form-data` body (file + fields + repeated `desiredRoles`) and POSTing to `/api/registrations` in `frontend/src/app/services/registration.service.ts`
- [X] T033 [US1] Build the reactive `FormGroup` with all seven controls and the file-attachment state in `frontend/src/app/features/registration-form/registration-form.ts`
- [X] T034 [US1] Build the Google Forms-style Material template — title card "Cadastre seu currículo", one `mat-card` per question, `mat-datepicker` with `max` = today, `mat-select` for UF, `mat-checkbox` list for roles, "Anexar currículo" control with the accepted-formats helper text, and the "Limpar"/"Salvar" action row — in `frontend/src/app/features/registration-form/registration-form.html` (FR-001, FR-002, FR-013)
- [X] T035 [US1] Apply the single-column centred layout and card rhythm using only the shared theme tokens in `frontend/src/app/features/registration-form/registration-form.scss` (Constitution Principle VI)
- [X] T036 [US1] Wire the "Salvar" success path: submit, show the "Salvo com sucesso" dialog, then reset the form and clear the attachment, in `frontend/src/app/features/registration-form/registration-form.ts` (FR-017, depends on T031, T032)
- [X] T037 [P] [US1] Write the happy-path and rollback tests for `createRegistration` (valid input persists; insert failure deletes the uploaded file) in `backend/tests/registration.service.test.ts` (Constitution Principle IV)
- [X] T038 [P] [US1] Write the `RegistrationService` unit test with `HttpTestingController` asserting the multipart body and the `201` handling in `frontend/src/app/services/registration.service.spec.ts`

**Checkpoint**: User Story 1 is fully functional — a valid submission persists end to end and the form resets. This is the deployable MVP.

---

## Phase 4: User Story 2 - Impedir envio de formulário incompleto (Priority: P2)

**Goal**: Any missing or invalid required field blocks submission, shows "Preencha todos os campos" in a dialog, and persists nothing.

**Independent Test**: Submit with the name empty, then with no roles selected, then with no file attached — each must show the dialog, leave the typed values intact, and create no row (quickstart.md Scenario B).

### Implementation for User Story 2

- [X] T039 [P] [US2] Implement the `notFutureDate` and Brazilian phone validators in `frontend/src/app/shared/validators/br-validators.ts`
- [X] T040 [US2] Attach `Validators.required`, the 100-char limits, the email validator, and the custom validators from T039 to every control in `frontend/src/app/features/registration-form/registration-form.ts`
- [X] T041 [US2] Enforce client-side file rejection at selection time with distinct messages for wrong format and over-4 MB, replacing any previously attached file, in `frontend/src/app/features/registration-form/registration-form.ts` (FR-003, FR-004, FR-005)
- [X] T042 [US2] Render `mat-error` messages beneath each invalid control in the consistent position defined by the theme, in `frontend/src/app/features/registration-form/registration-form.html` (Constitution Principle VI)
- [X] T043 [US2] Block submission when the form or attachment is invalid and show the "Preencha todos os campos" dialog via `MessageDialogComponent` in `frontend/src/app/features/registration-form/registration-form.ts` (FR-016)
- [X] T044 [US2] Return the `400 validation_failed` envelope with the offending `fields` array, and map Multer's file-size/type rejections to `file_too_large` / `file_type_not_allowed`, in `backend/src/routes/registrations.routes.ts` per contracts/registrations-api.md
- [X] T045 [US2] Handle non-2xx responses in the form by showing the mapped error dialog **without** clearing the entered values, in `frontend/src/app/features/registration-form/registration-form.ts` (FR-019)
- [X] T046 [P] [US2] Write exhaustive validation tests covering every field rule and both boundary cases for file size in `backend/tests/validation.service.test.ts` (Constitution Principle IV)

**Checkpoint**: User Stories 1 and 2 both work — valid submissions persist, invalid ones are blocked with consistent feedback.

---

## Phase 5: User Story 3 - Limpar formulário (Priority: P3)

**Goal**: The "Limpar" button returns the form to its pristine empty state, including the attachment.

**Independent Test**: Partially fill the form, attach a file, click "Limpar" — every field, the date, the checkboxes, the UF select, and the attachment reset with no request sent (quickstart.md Scenario C).

### Implementation for User Story 3

- [X] T047 [US3] Implement `onClear()` resetting the `FormGroup`, clearing validation state, and discarding the attached file and its `<input type="file">` value in `frontend/src/app/features/registration-form/registration-form.ts` (FR-018)
- [X] T048 [US3] Wire the "Limpar" secondary button to `onClear()` in `frontend/src/app/features/registration-form/registration-form.html`
- [X] T049 [US3] Reuse the same reset routine for the post-success clear from T036 so both paths behave identically, in `frontend/src/app/features/registration-form/registration-form.ts`

**Checkpoint**: All candidate-facing stories are functional and independently testable.

---

## Phase 6: User Story 4 - Acessar a Área do Recrutador (Priority: P3)

**Goal**: A fixed header exposes an "Área do Recrutador" button that routes to `/recrutador`, which renders a themed placeholder for the future "Filtrar currículos" screen.

**Independent Test**: Click the header button from the form — the app navigates to `/app/recrutador` without a reload, shows the placeholder with the same header and theme, and offers a way back (quickstart.md Scenario 0b).

### Implementation for User Story 4

- [X] T050 [P] [US4] Implement the `HeaderComponent` as a `mat-toolbar` with the system name on the left and the "Área do Recrutador" `routerLink` button on the right in `frontend/src/app/shared/header/header.ts` (FR-001c)
- [X] T051 [P] [US4] Implement the placeholder screen — "Filtrar currículos" heading, under-construction message, and a link back to the form — using only shared theme tokens, in `frontend/src/app/features/recruiter-area/recruiter-area-placeholder.ts` (FR-001e)
- [X] T052 [US4] Register the `recrutador` route pointing at the placeholder component in `frontend/src/app/app.routes.ts` (depends on T051)
- [X] T053 [US4] Render `<app-header>` once above `<router-outlet>` in `frontend/src/app/app.ts` so both screens share the identical header (depends on T050, Constitution Principle VI)
- [X] T054 [US4] Verify the `/` → `/app`, `/recrutador` → `/app/recrutador`, and `/app/*` SPA rewrites behave as specified in root `vercel.json` (FR-001b, FR-001d)

**Checkpoint**: All four user stories are independently functional; the recruiter entry point exists without exposing any candidate data.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T055 [P] Audit every screen against Constitution Principle VI — one theme, one spacing rhythm, one feedback channel, consistent field presentation — and remove any component-level colour or font override
- [X] T056 [P] Verify baseline usability: every control has an associated label, the form is keyboard-navigable in visual order, and each `mat-error` identifies its field (Constitution Principle VI)
- [X] T057 [P] Confirm the spec-fixed strings appear verbatim: "Cadastre seu currículo", "Anexar currículo", "Preencha todos os campos", "Salvo com sucesso", "Salvar", "Limpar", "Área do Recrutador"
- [X] T058 Run the full backend and frontend test suites (`cd backend && npm test`, `cd frontend && npm test`) and confirm all suites pass
- [ ] T059 Execute every quickstart.md validation scenario (0, 0b, A, B, C, D, E, F, G, H) against the local environment — **partially done**: 0, 0b, B (empty-field dialog), and C (Limpar) verified live via Playwright screenshots; A/D/E/F/G need a real Supabase project (blocked on T012–T014) to exercise end to end
- [ ] T060 Deploy to Vercel with the three Supabase environment variables set, then re-run Scenarios 0, 0b, A and B against the deployed URL, including one upload close to the 4 MB cap (quickstart.md Deployment) — **blocked**: requires the user's Vercel account/CLI access

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phases 3–6)**: All depend on Foundational phase completion
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Foundational. Delivers the full happy path — the MVP.
- **User Story 2 (P2)**: Depends on Foundational. Extends the form and route created in US1 (T033, T028), so it is most naturally built after US1, though its backend validation tests are independent.
- **User Story 3 (P3)**: Depends on Foundational. Touches the same form component as US1 (T047 reuses the reset from T036).
- **User Story 4 (P3)**: Depends on Foundational **only**. Touches no file that US1–US3 touch except `app.ts`/`app.routes.ts`, so it is genuinely parallelizable with the other stories.

### Within Each User Story

- Repositories and validation before services
- Services before routes
- Frontend models and constants before the components that consume them
- Core implementation before integration
- Tests may be written alongside or immediately after implementation (Constitution Principle IV — no strict TDD)

### Parallel Opportunities

- All Setup tasks marked [P] (T002–T011) can run in parallel after T001
- Foundational tasks T014–T016 and T019–T022 marked [P] can run in parallel
- Within US1: T024, T025, T026 (backend layers) run in parallel; T029, T030, T031 (frontend primitives) run in parallel; T037 and T038 (tests) run in parallel
- **US4 can be built in parallel with US1–US3 by a second developer** — it shares no component files with the form
- Polish tasks T055, T056, T057 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch the three backend layers together (different files, no interdependencies):
Task: "Implement field validation rules in backend/src/services/validation.service.ts"
Task: "Implement CV upload and delete-on-rollback in backend/src/repositories/storage.repository.ts"
Task: "Implement registrations row insert in backend/src/repositories/registration.repository.ts"

# Then launch the frontend primitives together:
Task: "Create registration model in frontend/src/app/models/registration.model.ts"
Task: "Create 27-item UF constant in frontend/src/app/shared/constants/uf.constant.ts"
Task: "Implement MessageDialogComponent in frontend/src/app/shared/dialogs/message-dialog.ts"

# Finally, the two test tasks together:
Task: "Write createRegistration tests in backend/tests/registration.service.test.ts"
Task: "Write RegistrationService test in frontend/src/app/services/registration.service.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md Scenario A — a valid submission must persist and reset the form
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → the app boots at `/app` and the API is reachable
2. Add User Story 1 → Scenario A passes → Deploy/Demo (**MVP**)
3. Add User Story 2 → Scenario B passes → data integrity guaranteed
4. Add User Story 3 → Scenario C passes → convenience complete
5. Add User Story 4 → Scenario 0b passes → recruiter entry point in place
6. Polish → full quickstart sweep + deployed verification

### Parallel Team Strategy

With two developers, after Foundational completes:

- Developer A: US1 → US2 → US3 (the form pipeline, sequential — they share `registration-form.ts`)
- Developer B: US4 (header, placeholder, routing) then joins Polish

US4 is the only story that does not contend for the form component, so it is
the natural second track.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- The recruiter screen itself ("Filtrar currículos") is **out of scope** — US4
  delivers only the header button, the route, and a placeholder. Authentication
  for that area is deliberately deferred; see the carry-forward note in plan.md
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
