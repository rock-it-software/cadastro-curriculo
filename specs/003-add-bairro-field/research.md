# Phase 0 Research: Adicionar campo Bairro

## R1: Database rollout strategy for a new required column on a table with existing rows

**Decision**: Two-phase manual SQL rollout — add `bairro` as a nullable column
with a length `CHECK` first, run the backfill script, manually fix any rows
the script reports as skipped, then verify zero `NULL`s and only then apply
`ALTER TABLE ... ALTER COLUMN bairro SET NOT NULL`.

**Rationale**: This repository has no migration tooling (per
[001's data-model.md](../001-cadastro-curriculo/data-model.md), schema
changes are applied manually via the Supabase SQL editor). Adding `bairro
text not null` directly would fail against the existing `registrations` rows,
none of which have a value. A `DEFAULT` value (e.g. `'Centro'`) was
considered and rejected — the user explicitly required unrecognized-city rows
to be skipped and reported rather than defaulted, so a blanket `DEFAULT`
would violate that requirement for every existing row, recognized or not.

**Alternatives considered**:
- Single-step `NOT NULL DEFAULT 'Centro'`: rejected — produces incorrect data
  for every existing row instead of the real, city-appropriate neighborhood
  the backfill script provides for recognized cities, and silently
  contradicts FR-009 (no generic/invented value) for unrecognized ones.
- Introducing a migration tool (Prisma, node-pg-migrate, etc.) for this one
  change: rejected as speculative infrastructure per Constitution Principle
  V — the project has shipped two prior features with manual SQL and no
  migration tool; adding one now for a single column is disproportionate.

## R2: Backfill neighborhood data source

**Decision**: A small, hand-curated `Record<string, string[]>` map of real
neighborhood names per city, hardcoded in the backfill script itself, covering
the cities already used by `backend/scripts/seed-registrations.ts` (Recife,
Olinda, Paulista, João Pessoa, Maceió) plus a few additional common Brazilian
cities. For a recognized city, the script assigns any neighborhood from that
city's list (real name, not a placeholder). Cities not present in the map are
skipped and reported, never guessed.

**Rationale**: `city` is free text with no validation against a real
municipality list (documented assumption in both 001 and 002), so there is no
reliable, zero-cost way to resolve an arbitrary `city` string to its real
neighborhoods at migration time. Per Constitution Principle III, no paid
geocoding/places API may be introduced, and per Principle V no speculative
integration should be built for a one-off prototype script. A hardcoded
curated list satisfies the user's explicit requirement (real neighborhood
per recognized city; skip-and-report otherwise) with zero new dependencies
and zero ongoing cost.

**Alternatives considered**:
- IBGE (Brazilian government) municipality/district API or a similar free
  public geocoding API: rejected — adds a runtime network dependency and
  failure mode to a one-off internal script for a handful of known
  demo/seed cities; disproportionate for the actual scope (prototype,
  low-tens of records).
- Open-source "Brazilian neighborhoods" npm package: rejected — no new
  package dependency is justified for a handful of cities that can be
  hardcoded directly, per Principle V (duplication/inlining preferred over
  a new abstraction/dependency for a single use case).

## R3: Deploy sequencing across two separate Vercel projects

**Decision**: Deploy the DB column addition (R1 Step A) first, run the
backfill script, then deploy backend and frontend back-to-back (backend
first). Accept a short window where an already-deployed, not-yet-updated
frontend could submit a registration without `bairro` and receive the
existing generic 400 validation error — no compatibility shim is introduced.

**Rationale**: `backend/vercel.json` and `frontend/vercel.json` are separate
deployables (confirmed during planning), so there is no atomic way to ship
both together. Per Constitution Principle V, this project is an
intentionally fast, simple prototype; building a temporary
optional-then-required toggle for `bairro` validation solely to close a
deploy-ordering gap of a few minutes is disproportionate engineering for the
actual risk (a prototype with low traffic, no SLA).

**Alternatives considered**:
- Feature-flagging `bairro` validation server-side until frontend catches
  up: rejected as speculative complexity for a gap measured in minutes,
  against Principle V.

## R4: Testing approach

**Decision**: Extend the existing backend `node:test` suites
(`validation.service.test.ts`, `registration.service.test.ts`,
`registration-search.service.test.ts`) with `bairro` fixtures and assertions
mirroring the existing `city` coverage, and extend the existing frontend
Vitest specs (`registration.service.spec.ts`,
`recruiter-search.service.spec.ts`) the same way. No new component-level
`.spec.ts` files are introduced, consistent with Constitution Principle IV,
which exempts presentational UI wiring from mandatory test coverage — the
existing `registration-form` and `recruiter-search` components have no
component-level specs today, and this feature does not change that
established, already-compliant pattern.

**Rationale**: Principle IV requires tests for validation logic and
data-mutating endpoints, which `bairro` is (it participates in the same
`validateRegistrationFields`/`insertRegistration`/`findRegistrations` code
paths already under test for `city`). It does not require tests for
presentational template wiring (the new form field markup, filter field
markup, grid column).

**Alternatives considered**:
- Adding new component-level Angular test specs for `registration-form` and
  `recruiter-search`: rejected as out of scope — neither component has any
  test file today, and introducing one now would be inconsistent scope creep
  for a field-addition feature, not something FR-001–FR-011 requires.
