# Quickstart & Validation Guide: Adicionar campo Bairro

**Feature**: 003-add-bairro-field
**Date**: 2026-08-18

How to set up, run, and validate this feature end to end. This feature
reuses the Supabase project, database, and storage bucket already configured
for [001-cadastro-curriculo](../001-cadastro-curriculo/quickstart.md) and the
`/app/recrutador` search screen from
[002-filtrar-curriculos](../002-filtrar-curriculos/quickstart.md) — no new
infrastructure setup is required. Entity/query details live in
[data-model.md](./data-model.md); endpoint deltas in
[contracts/bairro-field-addendum.md](./contracts/bairro-field-addendum.md).

## Prerequisites

- The 001 and 002 setups already completed (Supabase project,
  `registrations` table, `curriculos` bucket, `backend/.env`).
- Database access to run the manual SQL in [data-model.md § Rollout](./data-model.md#rollout-on-an-existing-database-phased--see-researchmd--r1).

## 1. Apply the database change (Step A — do this first)

Run in the Supabase SQL editor, against the local/dev project:

```sql
alter table registrations
  add column bairro text
    check (bairro is null or char_length(trim(bairro)) between 1 and 100);
```

## 2. Install and run

```bash
# Backend — http://localhost:3000
cd backend
npm install
npm run dev

# Frontend — http://localhost:4200/app (separate terminal)
cd frontend
npm install
npm start
```

## 3. Run the backfill script (Step B)

```bash
cd backend
npm run backfill:bairro
```

**Expected**: existing rows whose `city` matches a curated entry (see
[data-model.md § Migration Script Data](./data-model.md#migration-script-data-curated-city--neighborhood-map))
get a real neighborhood; the script prints a count updated, and — if any
rows have an unrecognized `city` — a report listing each such row's `id`
and `city`, with a reminder not to add `NOT NULL` until they're fixed.
Re-run the script again immediately afterward and confirm it reports `0`
rows updated (idempotency, FR-010).

## 4. Run the tests

```bash
cd backend && npm test      # node:test — includes the new bairro validation,
                             # insert, and search-filter coverage
cd frontend && npm test     # Vitest — includes the new bairro assertions in
                             # registration.service.spec.ts and
                             # recruiter-search.service.spec.ts
```

Expected: all suites green, including the pre-existing 001/002 suites.

## Validation scenarios

Each scenario maps to a user story in [spec.md](./spec.md).

### Scenario A — Bairro required on the registration form (User Story 1, P1)

1. Open `/app`.
2. Confirm the "Bairro" field renders immediately above "Cidade".
3. Fill every field except "Bairro" and submit.
4. Fill "Bairro" and submit again.

**Expected**: step 3 is blocked with the existing "Preencha todos os campos"
message; step 4 succeeds and the new registration is saved with the bairro
value.

### Scenario B — Filter by bairro (User Story 2, P2)

Using data seeded/backfilled with a known city (e.g. "Recife"):

1. Open `/app/recrutador`, select a vaga so the table renders.
2. Confirm the "Bairro" filter field renders immediately above "Cidade".
3. Type part of a known neighborhood (e.g. "boa vi" for "Boa Viagem") and
   click outside the field.

**Expected**: the list narrows to candidates whose bairro contains the typed
text, case/whitespace-insensitively; the search does not re-run while
typing, only on blur; combined with any already-selected vaga/cidade/UF via
AND.

### Scenario C — Bairro column in the results grid (User Story 3, P2)

1. Continue from Scenario B (or apply any filter that returns results).

**Expected**: the table shows a "Bairro" column immediately before the
"Cidade" column, with the correct value per row.

### Scenario D — Backfill skip-and-report (User Story 4, P1)

1. Before running the backfill script, manually insert (or identify) a test
   row with an uncommon `city` value not present in the curated map (e.g.
   "Cidade Fictícia").
2. Run `npm run backfill:bairro`.

**Expected**: that row is listed in the skip-report and is NOT given any
`bairro` value; rows with recognized cities are updated normally in the same
run.

## Deployment

`backend/vercel.json` and `frontend/vercel.json` are separate deployables.
Sequence a production rollout as: (1) apply the Step A SQL against
production Supabase, (2) run the backfill script against production
(`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` pointed at prod), (3) deploy the
backend, (4) deploy the frontend promptly after. Do not run
`alter column bairro set not null` (Step D) until `select count(*) from
registrations where bairro is null` returns `0` — this may require manually
fixing rows reported by the backfill script first.
