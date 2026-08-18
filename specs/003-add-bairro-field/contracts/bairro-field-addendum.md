# API Contract Addendum: Bairro field

**Feature**: 003-add-bairro-field

This feature does not introduce a new endpoint — it adds one field, `bairro`,
to two existing endpoints. The base contracts remain authoritative; this
document lists only the delta.

---

## `POST /api/registrations` (defined in [001's contract](../../001-cadastro-curriculo/contracts/registrations-api.md))

### Request

Multipart form field added, positioned before `city`:

| Field | Required | Rule |
|-------|----------|------|
| `bairro` | yes | Free text, trimmed length 1–100 (same shape as `city`) |

### Responses

No change to response shapes. A missing/invalid `bairro` is now included in
the same `400 validation_failed` behavior already documented for other
fields:

```json
{
  "error": "validation_failed",
  "message": "Preencha todos os campos",
  "fields": ["bairro"]
}
```

---

## `GET /api/registrations` (defined in [002's contract](../../002-filtrar-curriculos/contracts/registrations-search-api.md))

Already reflected directly in 002's contract file (query parameter and
response field, both added immediately before `city`) — see that document
for the full request/response shape. No new status code or error shape is
introduced.
