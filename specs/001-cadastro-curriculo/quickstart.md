# Quickstart & Validation Guide: Cadastro de Currículo

**Feature**: 001-cadastro-curriculo
**Date**: 2026-08-15

How to set up, run, and validate this feature end to end. Entity details live
in [data-model.md](./data-model.md); endpoint details in
[contracts/registrations-api.md](./contracts/registrations-api.md).

## Prerequisites

- Node.js 24.x and npm 11.x (verified locally: Node v24.15.0, npm 11.12.1)
- A free Supabase account — <https://supabase.com>, no credit card required
- A free Vercel account for deployment — <https://vercel.com> (optional for
  local validation)

## 1. Supabase setup (one time)

1. Create a new Supabase project (free plan). Note the project URL and the
   **service role** key from *Project Settings → API*.
2. In the SQL editor, run the `create table` statement from
   [data-model.md](./data-model.md#schema-ddl-reference) to create
   `registrations` and enable RLS.
3. Under *Storage*, create a bucket named `curriculos` and leave it
   **private** (only the backend writes to it, using the service role key).

> **Free-tier note**: a Supabase free project is paused after 7 days without
> requests. If a demo returns connection errors, resume the project from the
> dashboard first.

## 2. Local environment

Create `backend/.env` (git-ignored — never commit these values, per
Constitution Principle II):

```bash
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_BUCKET=curriculos
PORT=3000
```

## 3. Install and run

```bash
# Backend — http://localhost:3000
cd backend
npm install
npm run dev

# Frontend — http://localhost:4200/app (separate terminal)
cd frontend
npm install
npm start          # ng serve with proxy.conf.json forwarding /api → :3000
```

Open <http://localhost:4200/app>. The form "Cadastre seu currículo" should
render immediately — it is the system's entry screen, so there is no login or
landing page before it.

## 4. Run the tests

```bash
cd backend && npm test      # node:test — validation + registration services
cd frontend && npm test     # Karma/Jasmine — RegistrationService + validators
```

Expected: all suites green. Coverage is deliberately limited to validation
logic and the data-writing paths, per Constitution Principle IV.

## Validation scenarios

Each scenario maps to a user story in [spec.md](./spec.md). Run them against
`http://localhost:4200/app` after the setup above.

### Scenario 0 — Entry screen routing (FR-001a, FR-001b)

1. Open `http://localhost:4200/app`.
2. Open `http://localhost:4200/` (bare root).
3. Open `http://localhost:4200/app/qualquer-coisa` (unknown sub-path).
4. With the form open at `/app`, reload the page (F5).

**Expected**: all four land on the "Cadastre seu currículo" form. Step 2
redirects to `/app`; step 3 redirects back to the form rather than showing a
404; step 4 re-renders the form instead of erroring. No login or landing page
appears at any point. A fixed header with the system name and an
"Área do Recrutador" button is visible at the top.

### Scenario 0b — Área do Recrutador navigation (User Story 4, FR-001c–FR-001e)

1. From the form at `/app`, click **Área do Recrutador** in the header.
2. Observe the URL and the rendered screen.
3. Use the way back to the form offered by the placeholder screen.
4. Open `http://localhost:4200/app/recrutador` directly and reload it.

**Expected**: step 1 navigates to `/app/recrutador` without a full page
reload; step 2 shows the placeholder "Filtrar currículos" screen carrying the
**same header and theme** as the form, indicating the area is under
construction; step 3 returns to the form; step 4 renders the placeholder
directly. No candidate data is displayed anywhere on this screen — the
recruiter listing is a separate future feature.

### Scenario A — Successful registration (User Story 1, P1)

1. Click **Anexar currículo** and select a PDF under 4 MB.
2. Fill: `Nome completo` = "Maria da Silva"; `Data de nascimento` = any past
   date; `Email` = "maria.silva@example.com"; `Telefone` = "(11) 98765-4321";
   `Cidade` = "São Paulo"; `UF` = select "SP" from the dropdown.
3. Tick **Eletricista** and **Motorista** under *Vagas desejadas*.
4. Click **Salvar**.

**Expected**: a dialog reading exactly "Salvo com sucesso" appears; on dismiss
every field is cleared and the UF dropdown returns to its empty state. In
Supabase, a `registrations` row exists with `desired_roles =
{eletricista,motorista}`, `city = 'São Paulo'`, `state_uf = 'SP'`, and the
file is present in the `curriculos` bucket under `<id>/`.

### Scenario B — Incomplete form is rejected (User Story 2, P2)

Repeat Scenario A but leave `Nome completo` empty, then click **Salvar**.

**Expected**: dialog reading exactly "Preencha todos os campos"; no new row in
`registrations`; the values already typed are **not** cleared.

Repeat twice more, each time omitting only (a) all *Vagas desejadas*
checkboxes, and (b) the CV attachment. Both must produce the same dialog and
persist nothing.

### Scenario C — Clear the form (User Story 3, P3)

Partially fill the form, attach a file, then click **Limpar**.

**Expected**: all text fields, the date, every checkbox, and the attachment
return to their empty initial state. No request is sent and nothing is
persisted.

### Scenario D — Rejected attachments (Edge Cases)

1. Try to attach a `.txt` or `.png` file → rejected at selection with a
   message naming the accepted formats; the file is not attached.
2. Try to attach a PDF larger than 4 MB → rejected at selection with a
   message naming the 4 MB limit.
3. Attach a valid PDF, then attach a second valid PDF → the second replaces
   the first; only one file remains attached.

### Scenario E — Future birth date (Edge Cases)

Open the date picker and attempt to choose tomorrow's date.

**Expected**: future dates are not selectable; typing one manually marks the
field invalid and **Salvar** produces "Preencha todos os campos".

### Scenario F — Invalid phone (Edge Cases)

Enter `1234` in `Telefone` with all other fields valid.

**Expected**: the field shows as invalid; **Salvar** produces "Preencha todos
os campos" and persists nothing.

### Scenario H — City and UF are independently required (FR-012, FR-012a, FR-012b)

1. Fill everything validly but leave `Cidade` empty → **Salvar** produces
   "Preencha todos os campos"; nothing is persisted.
2. Fill everything validly but leave the `UF` dropdown unselected → same
   result.
3. Open the `UF` dropdown and count the options.

**Expected**: exactly 27 options are listed (AC, AL, AP, AM, BA, CE, DF, ES,
GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO),
only one is selectable at a time, and no free-text entry is possible in that
field.

Note: a mismatched pair such as `Cidade` = "Manaus" with `UF` = "RJ" is
**accepted by design** — city/UF consistency is not validated (see
[spec.md](./spec.md) Assumptions).

### Scenario G — Persistence failure (FR-019)

Stop the backend (or temporarily set an invalid `SUPABASE_SERVICE_ROLE_KEY`
and restart it), then submit a fully valid form.

**Expected**: an error dialog appears (not "Salvo com sucesso"), and the
candidate's typed values remain in the form so they can retry.

## Deployment (Vercel free tier)

1. Push the branch and import the repository at <https://vercel.com/new>.
2. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_BUCKET` as
   Vercel environment variables (Production + Preview).
3. Deploy. `vercel.json` serves the Angular build at `/app`, redirects `/` to
   `/app`, and routes `/api/*` to the Express serverless function — same
   origin, so no CORS setup.
4. Re-run Scenario 0 against the deployed domain to confirm `/`, `/app`, and
   deep-link refreshes all resolve to the form in the serverless environment.
5. Re-run Scenarios A and B against the deployed URL. Include one upload close
   to the 4 MB cap to confirm the multipart request stays inside Vercel's
   4.5 MB serverless body limit in the deployed environment.
