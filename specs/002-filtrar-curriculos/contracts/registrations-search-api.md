# API Contract: Registrations Search & CV Download

**Feature**: 002-filtrar-curriculos
**Base path**: `/api` (same-origin, same convention as
[001-cadastro-curriculo](../../001-cadastro-curriculo/contracts/registrations-api.md))

Field shapes and validation rules are defined in [data-model.md](../data-model.md);
they are referenced here rather than repeated. Both endpoints are read-only —
neither ever writes to `registrations` or the `curriculos` bucket.

---

## `GET /api/registrations`

Lists candidates matching the recruiter's filter, sorted oldest-first and
paginated.

### Request

Query string parameters — see [data-model.md § Request Shape](../data-model.md#request-shape-filter-query-parameters)
for full validation rules.

| Parameter | Required | Example |
|-----------|----------|---------|
| `jobRole` | yes | `eletricista` |
| `city` | no | `São Paulo` |
| `uf` | no | `SP` |
| `page` | no (default `1`) | `2` |
| `pageSize` | no (default `20`) | `50` |

Example: `GET /api/registrations?jobRole=eletricista&city=Campinas&uf=SP&page=1&pageSize=20`

### Responses

**`200 OK`** — request valid, `items` may be an empty array when nothing
matches (FR-020).

```json
{
  "items": [
    {
      "id": "9f1c2a7e-4b3d-4f8a-9c21-7e5d8b0a1234",
      "fullName": "Maria da Silva",
      "age": 34,
      "city": "Campinas",
      "stateUf": "SP"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

**`400 Bad Request`** — `jobRole` missing or not one of the 9 accepted
values, or `uf` present but not one of the 27 accepted codes.

```json
{
  "error": "validation_failed",
  "message": "Selecione uma vaga válida para buscar candidatos.",
  "fields": ["jobRole"]
}
```

**`500 Internal Server Error`** — the database query failed.

```json
{
  "error": "internal_error",
  "message": "Não foi possível carregar os candidatos. Tente novamente."
}
```

---

## `GET /api/registrations/:id/cv`

Downloads the original CV file for one candidate.

### Request

| Path parameter | Type | Rules |
|-----------------|------|-------|
| `id` | `string` (uuid) | Must match an existing `registrations.id` |

### Responses

**`200 OK`** — binary file stream.

| Header | Value |
|--------|-------|
| `Content-Type` | The candidate's stored `cv_content_type` (e.g. `application/pdf`) |
| `Content-Disposition` | `attachment; filename="<cv_file_name>"` |

**`404 Not Found`** — no registration with that `id`, or the file object is
no longer present in Storage (spec Edge Cases: currículo indisponível).

```json
{
  "error": "not_found",
  "message": "Currículo não encontrado."
}
```

**`500 Internal Server Error`** — the storage download failed for a reason
other than a missing object.

```json
{
  "error": "internal_error",
  "message": "Não foi possível baixar o currículo. Tente novamente."
}
```

The frontend surfaces both failure cases as a per-row snackbar message
(FR-016a), not a modal dialog — see [research.md § R5](../research.md#r5-download-failure-feedback-mechanism).

---

## Status code summary

| Endpoint | Code | Meaning |
|----------|------|---------|
| `GET /api/registrations` | `200` | Query executed; `items` may be empty |
| `GET /api/registrations` | `400` | `jobRole` missing/invalid, or `uf` invalid |
| `GET /api/registrations` | `500` | Database query failed |
| `GET /api/registrations/:id/cv` | `200` | File streamed |
| `GET /api/registrations/:id/cv` | `404` | Registration or file object not found |
| `GET /api/registrations/:id/cv` | `500` | Storage download failed |

## Error payload shape

Same envelope as [001's contract](../../001-cadastro-curriculo/contracts/registrations-api.md#error-payload-shape):

```json
{
  "error": "<machine_readable_code>",
  "message": "<message safe to display, in pt-BR>",
  "fields": ["optional", "only for validation_failed"]
}
```
