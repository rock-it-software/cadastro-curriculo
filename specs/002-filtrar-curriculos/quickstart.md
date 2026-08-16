# Quickstart & Validation Guide: Filtrar Currículos

**Feature**: 002-filtrar-curriculos
**Date**: 2026-08-15

How to set up, run, and validate this feature end to end. This feature reuses
the Supabase project, database, and storage bucket already configured for
[001-cadastro-curriculo](../001-cadastro-curriculo/quickstart.md) — no new
infrastructure setup is required. Entity/query details live in
[data-model.md](./data-model.md); endpoint details in
[contracts/registrations-search-api.md](./contracts/registrations-search-api.md).

## Prerequisites

- The 001-cadastro-curriculo setup already completed (Supabase project,
  `registrations` table, `curriculos` bucket, `backend/.env`) — see that
  feature's [quickstart.md](../001-cadastro-curriculo/quickstart.md) §1–2 if
  starting fresh.
- At least a few `registrations` rows to filter against. The fastest way to
  get them is submitting the form at `/app` a handful of times with
  different vagas, cidades, and UFs.

## 1. Install and run

```bash
# Backend — http://localhost:3000
cd backend
npm install
npm run dev

# Frontend — http://localhost:4200/app/recrutador (separate terminal)
cd frontend
npm install
npm start
```

Open <http://localhost:4200/app/recrutador>. The "Buscar candidatos" form
should render with no results below it until a vaga is selected.

## 2. Run the tests

```bash
cd backend && npm test      # node:test — includes the new query-building
                             # and age-calculation coverage
cd frontend && npm test     # Vitest — includes the new recruiter-search
                             # service HTTP tests
```

Expected: all suites green, including the pre-existing 001 suites (this
feature adds tests, it does not change existing ones).

## Validation scenarios

Each scenario maps to a user story in [spec.md](./spec.md). Seed data first
(step 0), then run the scenarios against `http://localhost:4200/app/recrutador`.

### Scenario 0 — Seed data

Using the form at `/app`, submit at least these candidates (any valid CV
file, distinct submission times so ordering is meaningful):

1. "Ana Souza" — vaga "Eletricista", cidade "Campinas", UF "SP"
2. "Bruno Lima" — vagas "Eletricista" + "Motorista", cidade "São Paulo",
   UF "SP"
3. "Carla Dias" — vaga "Motorista", cidade "Rio de Janeiro", UF "RJ"

### Scenario A — Filter by vaga only (User Story 1, P1)

1. Open `/app/recrutador`.
2. Select "Eletricista" in the "Vagas" field.

**Expected**: the table shows "Ana Souza" and "Bruno Lima" (both indicated
"Eletricista"), oldest submission first, and not "Carla Dias". The summary
below the form highlights "Eletricista" as the selected vaga. No table is
shown before step 2.

### Scenario B — Refine by cidade and UF (User Story 2, P2)

Continuing from Scenario A:

1. Type "campinas" (lowercase, no accent-sensitive typing needed) into
   "Cidade" and click outside the field.
2. Clear "Cidade" and click outside the field again, then select UF "RJ".

**Expected**: after step 1, only "Ana Souza" remains (partial,
case-insensitive city match — the clarified FR-009 behavior); the search
does not re-run while typing, only on blur. After step 2, the list is empty
(no "Eletricista" candidate has UF "RJ") and a "nenhum candidato encontrado"
message is shown.

### Scenario C — Download a CV (User Story 3, P2)

1. Filter by vaga "Motorista".
2. Click the "Baixar currículo" icon on "Carla Dias"'s row.

**Expected**: the browser downloads Carla's originally uploaded file with
its original name.

### Scenario D — Download failure feedback (Edge Cases, FR-016a)

1. In Supabase Storage, temporarily remove or rename the object at one
   candidate's `cv_storage_path` (find it via the `registrations` table).
2. Filter to include that candidate and click their download icon.

**Expected**: a transient snackbar/inline message appears naming the
failure; the table stays visible and usable; no modal dialog appears.
Restore the object afterward if reusing this Supabase project for further
testing.

### Scenario E — Pagination (User Story 4, P3)

1. Seed at least 21 registrations for the same vaga (script or repeated
   manual submissions).
2. Filter by that vaga.
3. Observe the table, then change "registros por página" to a larger value.

**Expected**: 20 rows are shown initially with pagination controls to reach
the 21st; the footer shows the correct total count throughout; changing the
page size reloads from page 1 with the new count per page.

### Scenario F — Required vaga field (Edge Cases, FR-003, FR-012)

1. Open `/app/recrutador` fresh (or clear the "Vagas" field if clearable).

**Expected**: no candidate table is rendered, and no request is sent to
`GET /api/registrations` until a vaga is selected.

## Deployment

No new environment variables or Vercel configuration are required — this
feature adds two `GET` routes to the same Express app deployed in
001-cadastro-curriculo. Redeploying the branch is sufficient; re-run
Scenarios A–C against the deployed URL to confirm the same-origin `/api`
routing still applies with no CORS issues.
