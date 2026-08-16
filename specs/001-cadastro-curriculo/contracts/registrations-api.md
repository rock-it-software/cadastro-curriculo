# API Contract: Registrations

**Feature**: 001-cadastro-curriculo
**Base path**: `/api` (same-origin — the Angular app and this API are served
from one Vercel domain, so no CORS headers are required)

Entity fields and validation rules are defined in [data-model.md](../data-model.md);
they are referenced here rather than repeated.

## Submit flow overview

Clicking "Salvar" produces exactly one request:

```text
POST /api/registrations   (multipart/form-data: metadata fields + CV file)
   → validate all fields
   → upload the file to Supabase Storage
   → insert the registration row
   → 201 Created
```

The CV limit of 4 MB (FR-004) keeps a maximum-size multipart body at roughly
4.19 MB, inside Vercel's 4.5 MB serverless request cap — see
[research.md](../research.md) §R5 and §R6.

---

## `POST /api/registrations`

Creates a registration from the candidate's metadata and CV file.

### Request

`Content-Type: multipart/form-data`

| Part | Type | Rules |
|------|------|-------|
| `cvFile` | file | Required; extension `.pdf`/`.doc`/`.docx`; MIME one of the three accepted types; size 1 byte–4194304 bytes |
| `fullName` | text | Required, trimmed 1–100 chars |
| `birthDate` | text | Required, `YYYY-MM-DD`, not after today |
| `email` | text | Required, valid email format |
| `phone` | text | Required, digits only, 10 or 11; 11 digits ⇒ 3rd digit is `9` |
| `city` | text | Required, trimmed 1–100 chars |
| `stateUf` | text | Required, exactly one of the 27 UF codes (see [data-model.md](../data-model.md#value-set-brazilian-states-state_uf)) |
| `desiredRoles` | text (repeated) | Required, ≥1 occurrence, each value from the `job_roles` set |

`desiredRoles` is sent as a repeated field (one part per selected role), which
is how `FormData.append` naturally encodes a multi-select. The frontend sends
`phone` already stripped of mask characters; the backend strips again
defensively before validating. `stateUf` is uppercased by the backend before
the set check, so a lowercase value from a non-browser client is still
accepted.

Multer is configured with `limits.fileSize = 4194304` so an oversized upload is
rejected during parsing rather than after buffering the whole body.

### Responses

**`201 Created`** — all fields valid, file stored, row inserted.

```json
{
  "id": "9f1c2a7e-4b3d-4f8a-9c21-7e5d8b0a1234",
  "createdAt": "2026-08-15T14:03:22.481Z"
}
```

**`400 Bad Request`** — one or more fields failed validation, or the file was
missing, the wrong type, or over the size limit. Nothing is persisted and no
file is stored. The frontend shows the dialog "Preencha todos os campos"
(FR-016); `fields` exists for debugging and for highlighting the offending
inputs.

```json
{
  "error": "validation_failed",
  "message": "Preencha todos os campos",
  "fields": ["fullName", "desiredRoles"]
}
```

For a file rejected specifically on format or size, the same status is used
with a more precise code so the frontend can name the reason (spec Edge Cases):

```json
{
  "error": "file_too_large",
  "message": "O arquivo deve ter no máximo 4MB."
}
```

```json
{
  "error": "file_type_not_allowed",
  "message": "Envie um arquivo nos formatos Word ou PDF."
}
```

In practice the frontend blocks both cases at selection time, so these codes
are a server-side backstop.

**`500 Internal Server Error`** — storage upload or database insert failed. If
the file was uploaded before the insert failed, the backend deletes it so
storage and the table stay consistent. The frontend shows an error dialog and
**does not** clear the form (FR-019).

```json
{
  "error": "internal_error",
  "message": "Não foi possível salvar. Tente novamente."
}
```

---

## Status code summary

| Code | Meaning in this API |
|------|---------------------|
| `201` | Registration stored — file in the bucket, row in the table |
| `400` | Validation failed (fields, file type, or file size) — nothing persisted |
| `500` | Storage or database failure — nothing persisted; client keeps its form values |

## Error payload shape

Every non-2xx response uses the same envelope, so the frontend has one branch
for mapping errors to dialogs:

```json
{
  "error": "<machine_readable_code>",
  "message": "<message safe to display to the candidate, in pt-BR>",
  "fields": ["optional", "only for validation_failed"]
}
```

| `error` code | Status | Frontend dialog |
|--------------|--------|-----------------|
| `validation_failed` | 400 | "Preencha todos os campos" |
| `file_too_large` | 400 | "O arquivo deve ter no máximo 4MB." |
| `file_type_not_allowed` | 400 | "Envie um arquivo nos formatos Word ou PDF." |
| `internal_error` | 500 | "Não foi possível salvar. Tente novamente." |
