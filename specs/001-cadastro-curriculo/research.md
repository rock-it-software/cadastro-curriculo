# Phase 0 Research: Cadastro de Currículo

**Feature**: 001-cadastro-curriculo
**Date**: 2026-08-15

All unknowns from the Technical Context are resolved below. Versions were
verified against the npm registry on 2026-08-15.

## R1: Frontend framework and UI component library

**Decision**: Angular 22.1.2 with standalone components, strict TypeScript, and
Angular Material 22.1.2 for all UI components. Reactive forms (`FormBuilder`,
`FormGroup`) for the entire form.

**Rationale**: Mandated by Constitution Principles I and the Technology Stack
section. Angular Material provides every control this form needs out of the
box — `mat-form-field`, `mat-datepicker`, `mat-checkbox`, `mat-dialog`,
`mat-card`, `mat-button` — so no custom UI primitives are required, which
directly serves the fast-prototype goal (Principle V).

**Alternatives considered**: Hand-rolled CSS components (rejected — violates
Principle I and slower); PrimeNG / Ng-Zorro (rejected — Principle I mandates
Angular Material specifically).

## R2: Google Forms-like visual design

**Decision**: Reproduce the Google Forms look using Angular Material primitives
only: a centered single-column layout (max-width ~640px) on a light neutral
page background, a coloured accent bar at the top of the title card, each
question rendered as its own `mat-card` with generous padding and rounded
corners, question label in a medium-weight ~16px font, required fields marked
with a red asterisk, and the action buttons in a final card.

**Rationale**: The spec (FR-001) asks for a Google Forms *style*, not a pixel
clone. Material's card + elevation system already matches the Material Design
language Google Forms itself is built on, so this is achieved with a small
amount of layout CSS and zero extra dependencies.

**Alternatives considered**: Embedding an actual Google Form via iframe
(rejected — the spec requires persisting to our own database and custom
validation); importing a third-party Google-Forms-clone CSS kit (rejected —
unnecessary dependency for a prototype).

## R3: Backend runtime and framework

**Decision**: Node.js 24 (LTS, installed locally as v24.15.0) with Express
5.2.1 and Multer 2.2.0 for multipart parsing, TypeScript, organised in three
layers — `routes/` (HTTP), `services/` (business rules + validation),
`repositories/` (Supabase access).

**Rationale**: Constitution Principle II mandates Node.js with a layered
controller/service/repository split and REST conventions. Express 5 is the
smallest, most widely documented way to get there and runs unchanged both
locally and as a Vercel serverless function.

**Alternatives considered**: NestJS (rejected — its module/DI ceremony is
premature abstraction under Principle V for a single-endpoint prototype);
Fastify (viable, but Express has broader Vercel adapter documentation);
bare `node:http` (rejected — would require hand-rolling routing and body
parsing).

## R4: Database and file storage provider

**Decision**: Supabase free tier (`@supabase/supabase-js` 2.112.3) — Postgres
for the registration records and Supabase Storage for the uploaded CV files,
in a single private bucket named `curriculos`.

**Rationale**: Constitution Principle III requires a permanently free tier for
both database *and* object storage. Supabase is the only mainstream provider
that supplies both from one account with one set of credentials, which halves
the configuration surface for a prototype. No credit card required.

**Documented free-tier limits** (required by Principle III):

| Limit | Free-tier value | Impact on this feature |
|-------|-----------------|------------------------|
| Database size | 500 MB | Only text metadata rows are stored; thousands of registrations fit comfortably |
| Storage size | 1 GB total | At the 4 MB per-file cap, ~250 max-size CVs; typical PDFs are 200 KB–2 MB, so realistically 500+ |
| File upload size | 50 MB per file | Well above our 4 MB requirement (FR-004) |
| Project inactivity | Paused after 7 days with no requests | Prototype must be woken from the Supabase dashboard before a demo — documented in quickstart.md |
| Egress | 5 GB/month | Not a concern; the prototype only writes |

**Alternatives considered**: MongoDB Atlas Free + Cloudinary (rejected — two
providers, two credential sets, more setup); Firebase Firestore + Storage
(rejected — Storage on the Spark plan now requires a billing account in most
regions, which would violate Principle III's "no credit card" constraint).

## R5: Hosting platform

**Decision**: Vercel Hobby (free) hosting both the Angular static build and the
Express backend, the latter mounted as a single catch-all serverless function
at `/api/*`.

**Rationale**: Constitution Technology Stack requires a permanently free
hosting tier with no paid plan or card-gated trial — Vercel Hobby qualifies.
Deploying frontend and backend to one domain means the browser calls
`/api/registrations` same-origin, so **no CORS configuration is needed at
all**, and there is a single deploy pipeline instead of two. Vercel serverless
functions also have no cold-start spin-down, unlike free container hosts.

Vercel serverless functions cap request bodies at **4.5 MB**. With the CV
limit set to 4 MB (FR-004), a multipart upload of a maximum-size file is
roughly 4.19 MB including multipart boundaries and the metadata fields —
comfortably inside the cap with ~11% headroom. This is what makes the simple
single-request upload in §R6 viable.

**Alternatives considered**: Render free web service (rejected — spins down
after 15 minutes of inactivity with a ~50 s cold start, and splitting frontend
and backend across two platforms would force CORS setup and two deploy
configs); Netlify + Netlify Functions (equivalent, but Vercel's Angular
preset requires less configuration); Railway / Fly.io (rejected — no longer
offer a genuinely free, card-free tier).

## R6: File upload flow

**Decision**: A single request. On submit the frontend POSTs one
`multipart/form-data` body to `POST /api/registrations` containing the CV file
plus all metadata fields. The backend validates every field, uploads the file
to Supabase Storage, inserts the registration row, and returns `201`. Multipart
parsing uses Multer with an in-memory store and a 4 MB `limits.fileSize` cap.

**Rationale**: With the CV limit at 4 MB (FR-004), a maximum-size multipart
request is ~4.19 MB, which fits inside Vercel's 4.5 MB serverless body cap with
~11% headroom (see §R5). That removes the reason to route bytes around the
backend, so the simplest possible flow applies — exactly what Constitution
Principle V asks for. One endpoint instead of three, no signed-URL issuance,
no client-side upload orchestration, and no `pending`/`complete` record
lifecycle. The Supabase **service role key** stays server-side; the browser
never receives storage credentials, satisfying Principle II.

**Failure handling**: if the storage upload succeeds but the database insert
fails, the backend deletes the just-uploaded file before returning `500`, so
no orphaned files accumulate. If the upload itself fails, nothing is written at
all. Either way the candidate sees an error dialog with their form values
intact (FR-019). Because both writes happen inside one request, there is no
window where a dead browser can strand a half-finished record.

**Alternatives considered**: Server-issued signed upload URL with the browser
PUTing directly to Supabase Storage (rejected — this was the design while the
cap was 10 MB and the file could not fit through Vercel; at 4 MB it is
complexity carried for a problem that no longer exists, and it reintroduces
orphaned-record cleanup). Supabase anon key + RLS insert policy used directly
from the browser (rejected — pushes storage policy configuration into the
frontend and weakens the server-side validation boundary required by
Principle II). Streaming the multipart body straight to Supabase without
buffering (rejected — premature optimisation at 4 MB; Multer's memory store is
simpler and well within a serverless function's memory).

## R7: Brazilian phone and location validation

**Decision**: Validate on **both** the frontend (for immediate feedback) and
the backend (as the authoritative check), sharing the same rule definitions
copied into each side.

- Phone: strip non-digits, then require 10 or 11 digits; if 11 digits, the
  third digit MUST be `9` (Brazilian mobile ninth-digit rule). Display mask
  `(00) 00000-0000`.
- City: free text, trimmed length 1–100. No municipality database lookup.
- UF: a `mat-select` dropdown over a hard-coded 27-item constant (26 states +
  Distrito Federal), validated as membership in that set. The same constant is
  duplicated in the backend for the authoritative check.

**Rationale**: The spec's Assumptions section fixes these formats. The rules
are small enough that a shared npm package or a workspace-shared library would
be premature abstraction under Principle V — duplicating one regex and one
27-item constant across two files is explicitly preferred by that principle.
A dropdown for UF makes an invalid state unrepresentable in the UI, which is
why UF is a select while city stays free text.

**City/UF pairing is deliberately unvalidated**: the system accepts any city
name with any UF. Verifying the pair would require an IBGE municipality
dataset (~5,570 entries) or an external API call, which is out of scope per
the spec and would violate Principle V for a prototype.

**Alternatives considered**: `ngx-mask` for phone input masking (adds a
dependency; deferred — a small Angular directive or plain `(input)` formatter
is enough for a prototype); a dependent City dropdown populated from the
selected UF via the IBGE API (rejected — adds a network dependency, a loading
state, and a failure mode to a prototype form, for accuracy the spec does not
require); keeping the previous CEP field and deriving city/UF from a ViaCEP
lookup (rejected — the user explicitly replaced CEP with these two fields, and
it would reintroduce an external API dependency).

## R8: Testing approach

**Decision**: Per Constitution Principle IV (pragmatic, risk-based testing, no
strict TDD):

- **Backend**: Node's built-in `node:test` runner (zero dependencies on Node
  24) for (a) the validation service covering every field rule and (b) the
  registration service happy path plus the validation-failure path.
- **Frontend**: Angular 22's default `@angular/build:unit-test` (Vitest) for
  the `RegistrationService` unit test with `HttpTestingController`.
- No tests for purely presentational styling or layout.

**Rationale**: Validation logic and the data-writing endpoint are exactly the
"data could be lost or corrupted" areas Principle IV requires covering, while
the Google-Forms styling is the presentational surface it exempts.

**Alternatives considered**: Karma + Jasmine for the frontend (this was the
original assumption, superseded once implementation confirmed Angular 22's
CLI now scaffolds Vitest by default via `@angular/build:unit-test` — using the
CLI's own default is simpler than reconfiguring it back to Karma, per
Principle V); Playwright E2E (deferred — valuable later, but not required for
the MVP under Principle V).

## R9: Repository layout

**Decision**: A two-folder repository root — `frontend/` (Angular CLI
workspace) and `backend/` (Express + TypeScript) — plus a root `vercel.json`
that builds both and routes `/api/*` to the backend function.

**Rationale**: Matches the "Web application" structure the plan template
prescribes when a frontend and backend are both present, and keeps each side
independently runnable during development (`ng serve` proxying to a local
Express on port 3000).

**Alternatives considered**: npm workspaces monorepo (rejected — premature
tooling under Principle V; the two sides share no code beyond two regexes);
Angular app with the API inside its own `server.ts` via Angular SSR (rejected —
would blur the layered backend boundary Principle II requires).

## R10: Entry route and URL layout

**Decision**: The registration form is the system's entry screen, served at
`/app` (FR-001a). Concretely:

- Angular is built with `baseHref: '/app/'` (set in `angular.json`), so all
  built asset URLs resolve under `/app/`.
- `app.routes.ts` defines two routes — `''` → `RegistrationFormComponent` and
  `'recrutador'` → `RecruiterAreaPlaceholderComponent` — plus
  `{ path: '**', redirectTo: '' }` so any unknown sub-path returns to the form
  rather than showing a 404 (FR-001b).
- `vercel.json` handles the domain-level layout: `/api/*` → the serverless
  function, `/` → a redirect to `/app`, `/recrutador` → a redirect to
  `/app/recrutador`, and `/app/*` → `index.html` so deep links and refreshes
  are served by the SPA instead of 404ing.
- In development, `ng serve` honours the same base href, so the local URL is
  `http://localhost:4200/app`.

**Rationale**: The user specified `/app` as the application root. Reserving a
prefix for the UI keeps it cleanly separated from the `/api` prefix on the same
domain, so neither can ever shadow the other as the app grows. Redirecting `/`
and unknown paths to the form means a candidate handed any URL on this domain
still lands on the registration screen, which matters for a prototype whose
link will be pasted into messages.

**On `/recrutador` specifically**: the user wrote the recruiter route as
`/recrutador`. Since the Angular app is based at `/app/`, the route is declared
as `recrutador` and the browser URL is `/app/recrutador`. To honour the literal
path as well, `vercel.json` also redirects a bare `/recrutador` to
`/app/recrutador`, so both forms work and there is only one canonical URL. If
the intent was instead a second top-level prefix outside `/app`, that would
split the SPA across two base hrefs and is not what is planned here.

**Alternatives considered**: Serving the app at the domain root `/` with the
API at `/api` (rejected — the user explicitly asked for `/app`); hash-based
routing `/app#/` (rejected — unnecessary with Vercel's SPA rewrite support and
produces uglier links); serving `/app` without the `/` redirect (rejected —
a visitor typing the bare domain would get a 404, a poor demo experience for
no saved effort).
