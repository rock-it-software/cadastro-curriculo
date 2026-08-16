# Phase 1 Data Model: Filtrar Currículos

**Feature**: 002-filtrar-curriculos
**Date**: 2026-08-15

This feature reads the `registrations` table created by
[001-cadastro-curriculo](../001-cadastro-curriculo/data-model.md). No schema
migration is required — every column this feature needs already exists.
This document defines only the **read-side shapes** introduced here.

## Source Entity (unchanged): `registrations`

See [001-cadastro-curriculo/data-model.md](../001-cadastro-curriculo/data-model.md#entity-registration-registrations)
for the full column list. Columns read by this feature:

| Column | Used for |
|--------|----------|
| `id` | Row identity; used to build the CV download URL |
| `full_name` | "Nome completo" column |
| `birth_date` | "Idade" column (computed, see below) |
| `city` | "Cidade" column and city filter |
| `state_uf` | "UF" column and UF filter |
| `desired_roles` | Vaga filter (`@>` containment check) |
| `cv_file_name` | Download `Content-Disposition` filename |
| `cv_storage_path` | Locates the file in Supabase Storage |
| `cv_content_type` | Download response `Content-Type` |
| `created_at` | Sort key (oldest → newest, FR-013) |

No write ever happens to this table from this feature — it is strictly
read-only.

## Response Shape: Candidate list row (`CandidateSummary`)

Returned by `GET /api/registrations`, one per matching candidate, already
paginated and sorted server-side.

| Field | Type | Derivation |
|-------|------|------------|
| `id` | `string` (uuid) | `registrations.id` |
| `fullName` | `string` | `registrations.full_name` |
| `age` | `integer` | Completed years between `registrations.birth_date` and the server's current date at query time (R3) |
| `city` | `string` | `registrations.city` |
| `stateUf` | `string` | `registrations.state_uf` |

`email`, `phone`, and every other candidate field are **not** included in
this response — the filter table only needs the five columns FR-014 lists,
and returning unused personal data would be an unnecessary exposure on an
unauthenticated route.

## Response Shape: Paginated list envelope

```json
{
  "items": [ /* CandidateSummary[] */ ],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

- `total`: exact count of rows matching the current filter, independent of
  pagination (FR-019, SC-005).
- `page` / `pageSize`: echoed back so the frontend paginator stays in sync
  with what the backend actually applied (e.g. if a `pageSize` outside the
  allowed set is silently clamped — see Validation Rules below).

## Request Shape: Filter query parameters

| Parameter | Required | Type | Validation |
|-----------|----------|------|------------|
| `jobRole` | yes | one of the 9 `job_roles` slugs (see 001's data-model.md) | 400 if missing or not a member of the set |
| `city` | no | free text | trimmed; empty string treated as absent |
| `uf` | no | one of the 27 `state_uf` codes | 400 if present but not a member of the set |
| `page` | no, default `1` | positive integer | clamped to `1` if missing/invalid |
| `pageSize` | no, default `20` | one of `10, 20, 50, 100` | clamped to `20` if missing/not in the set |

**`jobRole` is the only required parameter** (FR-003) — a request missing
it MUST NOT run any query and MUST return `400`, matching the UI rule that
no listing renders until a vaga is selected (FR-012).

## Value Sets (reused, not redefined)

- **Job roles**: the same 9 slugs from
  [001-cadastro-curriculo/data-model.md § Value Set: Job Roles](../001-cadastro-curriculo/data-model.md#value-set-job-roles-job_roles).
- **Brazilian states**: the same 27 codes from
  [001-cadastro-curriculo/data-model.md § Value Set: Brazilian States](../001-cadastro-curriculo/data-model.md#value-set-brazilian-states-state_uf).

Both are duplicated as frontend constants (`JOB_ROLES`, `BRAZILIAN_STATES`)
already present in `frontend/src/app/shared/constants/`; this feature reuses
those existing constants rather than redefining them.

## Query Semantics

```text
   GET /api/registrations?jobRole=eletricista&city=São Paulo&uf=SP&page=1&pageSize=20
                    │
                    ├─▶ jobRole missing/invalid ──── yes ──▶ 400, no query run
                    │
                    ▼
   SELECT id, full_name, birth_date, city, state_uf, created_at
     FROM registrations
    WHERE desired_roles @> ARRAY['eletricista']
      AND city ILIKE '%são paulo%'      -- only when city provided
      AND state_uf = 'SP'               -- only when uf provided
    ORDER BY created_at ASC
    LIMIT 20 OFFSET 0
   -- plus a parallel exact count of the same WHERE clause
                    │
                    ▼
       200 { items, total, page, pageSize }
```

## CV Download

`GET /api/registrations/:id/cv`

| Step | Behavior |
|------|----------|
| Row lookup | `SELECT cv_storage_path, cv_file_name, cv_content_type FROM registrations WHERE id = :id` — `404` if no row |
| File fetch | `supabase.storage.from('curriculos').download(cv_storage_path)` — `404` if the object is missing, `500` on any other storage error |
| Response | Streams the file bytes with `Content-Type: <cv_content_type>` and `Content-Disposition: attachment; filename="<cv_file_name>"` |

No row or file is ever modified by this endpoint.
