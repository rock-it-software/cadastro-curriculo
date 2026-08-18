# Phase 1 Data Model: Adicionar campo Bairro

**Feature**: 003-add-bairro-field
**Date**: 2026-08-18

This feature extends the `registrations` table created by
[001-cadastro-curriculo](../001-cadastro-curriculo/data-model.md) with one
new column, `bairro`, and extends the read-side shapes introduced by
[002-filtrar-curriculos](../002-filtrar-curriculos/data-model.md) to include
it. Column ordering below places `bairro` immediately before `city`
throughout, matching the on-screen field ordering requirement (FR-001,
FR-003, FR-007).

## Schema Change: `registrations.bairro`

| Column | Type | Nullable | Constraint | Notes |
|--------|------|----------|------------|-------|
| `bairro` | `text` | Temporarily yes, until backfill completes (see Rollout below) | `char_length(trim(bairro)) between 1 and 100` when non-null | Neighborhood name, free text, same shape as `city` |

**Final DDL** (for a fresh environment, or once rollout is complete on an
existing one) — insert immediately before the `city` line in
[001's `create table registrations`](../001-cadastro-curriculo/data-model.md):

```sql
bairro text not null check (char_length(trim(bairro)) between 1 and 100),
city text not null check (char_length(trim(city)) between 1 and 100),
```

### Rollout on an existing database (phased — see [research.md § R1](./research.md#r1-database-rollout-strategy-for-a-new-required-column-on-a-table-with-existing-rows))

```sql
-- Step A: add nullable, run before any backend deploy that references bairro
alter table registrations
  add column bairro text
    check (bairro is null or char_length(trim(bairro)) between 1 and 100);

-- Step B: run backend/scripts/backfill-bairro.ts (see quickstart.md)

-- Step C: manually resolve every row in the script's skip-report

-- Step D: only once the query below returns 0
select count(*) from registrations where bairro is null;
alter table registrations alter column bairro set not null;
```

Until Step D runs, `bairro` remains nullable at the database level even
though the application layer (form validation, §"Application-Level
Requirement" below) already requires it for every *new* registration from the
moment the updated form ships (FR-011).

## Application-Level Requirement (independent of DB rollout phase)

Regardless of the database column's current nullability, the backend MUST
reject any `POST /api/registrations` request missing a valid `bairro` (1–100
trimmed chars) with the same `400 validation_failed` response already used
for other missing/invalid fields (mirrors `city`'s existing
`isValidCity`/`validateRegistrationFields` wiring).

## Response Shape: Candidate list row (`CandidateSummary`) — extends 002

Extends [002's `CandidateSummary`](../002-filtrar-curriculos/data-model.md#response-shape-candidate-list-row-candidatesummary)
with one field, positioned before `city`:

| Field | Type | Derivation |
|-------|------|------------|
| `id` | `string` (uuid) | `registrations.id` |
| `fullName` | `string` | `registrations.full_name` |
| `age` | `integer` | unchanged from 002 |
| `bairro` | `string` | `registrations.bairro` |
| `city` | `string` | `registrations.city` |
| `stateUf` | `string` | unchanged from 002 |

## Request Shape: Filter query parameters — extends 002

Extends [002's parameter table](../002-filtrar-curriculos/data-model.md#request-shape-filter-query-parameters)
with one optional parameter, positioned before `city`:

| Parameter | Required | Type | Validation |
|-----------|----------|------|------------|
| `jobRole` | yes | one of the 9 `job_roles` slugs | unchanged from 002 |
| `bairro` | no | free text | trimmed; empty string treated as absent |
| `city` | no | free text | unchanged from 002 |
| `uf` | no | one of the 27 `state_uf` codes | unchanged from 002 |
| `page` / `pageSize` | no | — | unchanged from 002 |

## Query Semantics — extends 002

```text
   GET /api/registrations?jobRole=eletricista&bairro=Boa Viagem&city=Recife&uf=PE&page=1&pageSize=20
                    │
                    ├─▶ jobRole missing/invalid ──── yes ──▶ 400, no query run
                    │
                    ▼
   SELECT id, full_name, birth_date, bairro, city, state_uf, created_at
     FROM registrations
    WHERE desired_roles @> ARRAY['eletricista']
      AND bairro ILIKE '%boa viagem%'   -- only when bairro provided
      AND city ILIKE '%recife%'         -- only when city provided
      AND state_uf = 'PE'               -- only when uf provided
    ORDER BY created_at ASC
    LIMIT 20 OFFSET 0
   -- plus a parallel exact count of the same WHERE clause
                    │
                    ▼
       200 { items, total, page, pageSize }
```

## Migration Script Data: Curated City → Neighborhood Map

Used only by `backend/scripts/backfill-bairro.ts` (not by the application at
request time). A hardcoded map of real neighborhood names per recognized
city (see [research.md § R2](./research.md#r2-backfill-neighborhood-data-source)
for why this is hardcoded rather than sourced from an API):

| City (must match `registrations.city` exactly, trimmed) | Sample real neighborhoods |
|---|---|
| Recife | Boa Viagem, Casa Forte, Boa Vista, Espinheiro, Graças |
| Olinda | Carmo, Bonsucesso, Rio Doce, Casa Caiada |
| Paulista | Janga, Maranguape I, Pau Amarelo, Centro |
| João Pessoa | Tambaú, Bessa, Cabo Branco, Manaíra |
| Maceió | Ponta Verde, Jatiúca, Pajuçara, Farol |
| São Paulo | Pinheiros, Moema, Vila Mariana, Tatuapé |

Any row whose `city` does not exactly match a key in this map (case- and
whitespace-sensitive, since the script performs an exact lookup rather than a
fuzzy match) is skipped and reported (FR-009), never assigned a value from
this or any other city's list.

## Value Sets (reused, not redefined)

No new value set is introduced — `bairro` is unconstrained free text, exactly
like `city`. The job-role and state-UF value sets are unchanged from
[001](../001-cadastro-curriculo/data-model.md) / [002](../002-filtrar-curriculos/data-model.md).
