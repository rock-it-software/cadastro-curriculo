# Phase 0 Research: Filtrar Currículos

**Feature**: 002-filtrar-curriculos
**Date**: 2026-08-15

All unknowns from the Technical Context are resolved below. This feature
reuses the stack and infrastructure established in
[001-cadastro-curriculo](../001-cadastro-curriculo/plan.md) — no new
framework, provider, or hosting decision is introduced.

## R1: Query and filter strategy against `registrations`

**Decision**: A single new read endpoint, `GET /api/registrations`, backed
by one Supabase Postgres query built incrementally with the JS query
builder:

- `jobRole` (required) → `.contains('desired_roles', [jobRole])` — matches
  when the selected role is among the candidate's stored array.
- `city` (optional) → `.ilike('city', '%' + escaped(city.trim()) + '%')` —
  case-insensitive partial match, per the clarified FR-009.
- `uf` (optional) → `.eq('state_uf', uf.toUpperCase())`.
- Always `.order('created_at', { ascending: true })` (FR-013).
- Pagination via `.range(offset, offset + pageSize - 1)` plus
  `{ count: 'exact' }` on the select to get the total matching row count in
  the same round trip (FR-019).

**Rationale**: Postgres' `text[] @> ARRAY[...]` operator (exposed by
`.contains`) is the direct match for "vaga selecionada está entre as vagas
indicadas" (FR-021) without a join or a separate junction table — the
existing `desired_roles text[]` column added in feature 001 is already
shaped for it. `ilike` gives case-insensitive substring matching in one
operator, satisfying the clarified city-search behavior with no extra
normalization column. `{ count: 'exact' }` avoids a second COUNT query.

**Alternatives considered**: Normalizing `desired_roles` into a join table
`registration_roles` (rejected — the array column already exists from
feature 001 and works correctly with `.contains`; a join table is
unjustified schema churn under Constitution Principle V for a filter that
only ever queries "is X in the array"); fetching all matching rows and
paginating in the application layer (rejected — defeats the purpose of
`LIMIT`/`OFFSET` and would not scale, however small the prototype); a
full-text search index for city (rejected — `ilike` on a small, low-volume
table is sufficient, and Postgres trigram indexes are unnecessary
infrastructure for a prototype).

## R2: CV download endpoint

**Decision**: A second endpoint, `GET /api/registrations/:id/cv`. The
backend looks up the registration's `cv_storage_path` and `cv_file_name`,
downloads the file from the private `curriculos` Supabase Storage bucket
using the service role key (`supabase.storage.from('curriculos').download(path)`),
and streams the bytes back to the browser with
`Content-Disposition: attachment; filename="<cv_file_name>"` and the stored
`cv_content_type`. A missing row or a failed storage download both return a
`404`/`500` JSON error, which the frontend surfaces per-row (FR-016a).

**Rationale**: The bucket is private and has no public policies
(Principle III / data-model.md), so the browser cannot fetch the file
directly — every download must go through the backend, which already holds
the service role key (as it did for the upload in feature 001). Proxying the
bytes through the backend is simpler than issuing a short-lived signed URL
for a prototype with no auth to protect: one request, one response, no
second round trip, no URL-expiry edge case to handle in the UI.

**Alternatives considered**: Supabase signed URL
(`createSignedUrl`) returned to the frontend, which then navigates to it
(rejected — adds an expiry window and a second network hop for no benefit
here, since there is no CDN or caching requirement); making the bucket
public (rejected — would let anyone with a guessed path bypass the
application entirely, a strictly worse posture than what's already in place).

## R3: Age calculation

**Decision**: The backend computes `age` (completed years) from
`birth_date` and the server's current date at query time, and includes it
as a plain number in each row of the `GET /api/registrations` response. The
frontend renders it as-is.

**Rationale**: `birth_date` is a `date` (no time component), so age is a
pure, stateless calculation with no timezone ambiguity worth handling
specially. Doing it server-side keeps the frontend row-rendering trivial and
avoids duplicating the leap-year/month-day comparison logic in two
languages — TypeScript is already shared as the language, but the
computation itself needs to exist exactly once, and the backend is where
the authoritative "today" already lives for other checks (e.g. `birth_date
<= current_date` in feature 001's validation).

**Alternatives considered**: Computing age in the Angular component from
the raw `birth_date` (rejected — would duplicate the same date-arithmetic
function on both sides for no benefit, violating Principle V's "no
duplication without a second concrete reason"); storing a precomputed `age`
column in Postgres (rejected — age changes daily regardless of writes, so a
stored column would immediately go stale; it must be computed at read
time).

## R4: Frontend structure for the recruiter screen

**Decision**: Replace the existing `RecruiterAreaPlaceholder` component
(feature 001's stub) with a new `RecruiterSearch` feature under
`frontend/src/app/features/recruiter-search/`, kept at the same
`recrutador` route so `/app/recrutador` continues to resolve to it. The
screen is composed of three Angular Material building blocks in one
component tree:

- A filter form (`mat-form-field` + `mat-select` for Vagas, `mat-form-field`
  + text input for Cidade, `mat-form-field` + `mat-select` for UF), built as
  a small reactive `FormGroup` — reused pattern from
  `RegistrationForm` (feature 001) — with `valueChanges` subscriptions
  driving the search: `jobRole`/`uf` fire immediately on `valueChanges`;
  `city` fires on the native `(blur)` event per FR-008, not on
  `valueChanges`, since Material's `valueChanges` fires per keystroke.
- A summary line rendered from the current filter `FormGroup` value, with
  the selected vaga shown as a `mat-chip` or bolded text for emphasis
  (FR-010).
- A `mat-table` + `MatPaginator` bound to a `MatTableDataSource`-free
  server-side pagination model (the backend already returns exactly one
  page and a total count, so the paginator's `(page)` event re-triggers the
  same search function with new `page`/`pageSize` rather than slicing
  client-side data).

**Rationale**: Mirrors the existing form's reactive-forms + Material
pattern (Constitution Principle I) instead of introducing a new state
pattern. Server-side pagination is required because filtering happens in
Postgres (R1), so the table can never hold more than one page of rows
client-side — an Angular Material `mat-paginator` configured for
server-side data (`length` bound to the backend's `total`, `(page)` event
driving a new HTTP call) is the standard idiom for this and needs no
additional dependency.

**Alternatives considered**: Fetching all matching candidates once and
paginating client-side with `MatTableDataSource`'s built-in paginator
(rejected — would not scale as the table grows and duplicates the
ordering/limiting logic the backend already does correctly); a debounce
timer on every keystroke for city instead of blur (rejected — the spec
explicitly specifies blur-triggered search for city, FR-008).

## R5: Download-failure feedback mechanism

**Decision**: A `MatSnackBar` message shown when the download request fails
(network error or non-2xx response from `GET /api/registrations/:id/cv`),
scoped to the triggering row's context (e.g. naming the candidate) but not
blocking the table.

**Rationale**: Confirmed by the clarification session — download failure is
a per-row event, not a full-page error, so it does not belong in the
`MatDialog` channel that feature 001 reserved for form-level
success/validation/error feedback. Constitution Principle VI requires "one
feedback channel" **per class of event**; a per-row transient failure is a
different class of event from "submit succeeded/failed", so introducing
`MatSnackBar` specifically for this class (and only this class) does not
violate that principle — it would if snackbars and dialogs were mixed for
the *same* class of event.

**Alternatives considered**: Reusing `MessageDialogComponent` for download
failures (rejected — a modal interrupts browsing the list for what is
typically a transient, retryable per-row error, and was explicitly rejected
in the clarification session); an inline error row appended to the table
(rejected — more implementation complexity than a snackbar for the same
information, no added value for a prototype).

## R6: Testing approach

**Decision**: Consistent with Constitution Principle IV and feature 001's
precedent:

- **Backend**: `node:test` covering the query-building logic (job role
  required / city+UF optional / combination) and the age-calculation
  function, since both are the "data-transformation" and
  "endpoint-serving-persisted-data" paths Principle IV requires testing.
- **Frontend**: Vitest for the recruiter-search service's HTTP call
  construction (query params sent for each filter combination) using
  `HttpTestingController`, following the pattern already established for
  `RegistrationService` in feature 001.
- No tests for the Material table/paginator wiring itself (presentational).

**Rationale**: This is a read/list endpoint, not a data-mutating one, but
it is still a case where a defect (e.g. an incorrect filter operator) would
silently show a recruiter the wrong candidates — exactly the kind of
data-integrity risk Principle IV asks to be covered, even without strict
TDD.

**Alternatives considered**: Skipping backend tests since no data is
written (rejected — an incorrect `.contains`/`.ilike`/`.eq` predicate is a
data-correctness bug even on a read path, and the constitution's testing
principle is about protecting data value, not just data writes).
