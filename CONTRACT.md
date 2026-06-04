# Finance API — Real HTTP Contract

This document describes the contract **as implemented in the code** (handlers, router,
session/auth, D1 schema), not as the specs describe it. Divergences from the `openspec/`
specs are flagged inline and summarized at the end. Portable: a consuming repo needs only
this file.

- **Transport:** HTTPS. JSON request/response bodies (`Content-Type: application/json`).
- **Auth:** session **cookie** (`fa_session`), not a bearer header. Browser clients send it
  automatically; non-browser clients must store and resend the cookie.
- **All amounts are integers in minor units (cents).** `1000` = 10.00. (Exceptions noted:
  mileage rate is a decimal multiplier; miles, calendar days, and counts are plain integers.)
- **Dates** are ISO-8601 calendar dates `YYYY-MM-DD`; **timestamps** are ISO-8601 UTC
  date-times (`2026-05-01T12:00:00.000Z`). **Competence** is `YYYY-MM`.

---

## 1. Error envelope & status conventions

Every error response has this body shape:

```json
{ "error": { "code": "<machine_code>", "message": "<human message>" } }
```

| Status | `code` | When |
|---|---|---|
| `400` | `bad_request` | Invalid/missing body fields; **also** when a referenced `categoryId`/`cardId` is invalid, archived, or not owned (see note), or an invalid invoice state transition / immutable `closing_day`. |
| `401` | `unauthorized` | No valid session cookie, or session of a deleted user. Body message `"authentication required"` (auth flow may use `"invalid login state"` / `"login failed"`). |
| `403` | `signup_denied` | OIDC login succeeded but the identity is not allowed to onboard. |
| `404` | `not_found` | Resource addressed **by URL id** that does not exist **or belongs to another user**. |
| `500` | `internal_error` | Last-resort boundary; never leaks stack/internal detail. |

**404-does-not-reveal-existence (enforced):** any resource fetched/mutated by URL id that is
owned by another tenant returns `404`, identical to a non-existent id. There is no `403`
for cross-tenant resource access — only for signup denial.

**Body-referenced ids return `400`, not `404`:** when a *request body* references another
user's (or archived/missing) `categoryId` or `cardId`, the response is `400` — a
non-owned id is indistinguishable from a missing one and is never confirmed to exist.
(URL-addressed ids → `404`; body-referenced ids → `400`.)

Success bodies are the resource object(s) described per section. `204 No Content` has an
empty body.

---

## 2. Authentication & session

### Session cookie
- **Name:** `fa_session`
- **Value:** JWT, **HS256**, claims `{ sub, esub, iat, exp }` where `sub` = internal user
  id (UUID v4), `esub` = Google `sub`.
- **TTL:** 15 minutes (`Max-Age=900`, and `exp = iat + 900`).
- **Flags:** `Path=/; HttpOnly; Secure; SameSite=Lax`.
- **Stateless:** verified by signature + `exp` only; on every request the middleware also
  re-checks the user still exists (a deleted account ⇒ `401` even within the 15-min window).
  There is **no server-side revocation list** (see logout caveat).

### `GET /auth/login` — start OIDC (public)
Begins Google OIDC (Authorization Code + PKCE/S256).
- **Response:** `302` redirect to Google's authorize URL.
- **Sets transient cookies** (`Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`):
  `fa_oidc_state`, `fa_oidc_nonce`, `fa_oidc_verifier`.

### `GET /auth/callback?code=&state=` — finish OIDC (public)
Validates `state` (vs `fa_oidc_state` cookie), exchanges `code`, verifies the Google ID
token (RS256, `iss`/`aud`/`exp`/`nonce`), then onboards-or-reuses the account behind the
signup gate.
- **`302`** on success → `Location: $POST_LOGIN_REDIRECT` (default `/`); sets `fa_session`
  and clears the transient cookies.
- **`401`** `unauthorized` if state/nonce/verifier missing or mismatched (`"invalid login
  state"`), or token exchange/validation fails (`"login failed"`).
- **`403`** `signup_denied` if the identity is not on the signup allowlist.

### `POST /auth/logout`
- **Response:** `204`, sets `fa_session=` with `Max-Age=0` (clears the cookie).
- **Caveat:** stateless — a copied token remains valid until `exp` (≤15 min); logout only
  clears the client cookie, it does not revoke server-side.

### Account deletion (LGPD)
Implemented as **`DELETE /account`** (self-only; no id parameter). See §9.

> **Divergence (endpoint names):** the implementation uses `GET /auth/login`,
> `GET /auth/callback`, `POST /auth/logout`, and `DELETE /account`. It does **not** expose
> `/auth/google/start` or `DELETE /me`.

---

## 3. Unauthenticated utility endpoints

> **Divergence:** these two endpoints exist in code but are **not described in any
> `openspec/` capability spec.**

### `GET /`
`200` → `{ "service": "finance-api", "version": "<SERVICE_VERSION|unknown>" }`

### `GET /health`
Structured health; DB connectivity probe.
- `200` when healthy, `503` when the database probe fails.
- Body:
```json
{
  "status": "ok",                // "ok" | "degraded"
  "service": "finance-api",
  "version": "0.1.0",
  "timestamp": "2026-05-01T12:00:00.000Z",
  "checks": { "database": { "status": "ok", "latencyMs": 2 } }  // + "error" string when degraded
}
```

---

## 3.5 Bank accounts  `(/accounts)` — protected

> Distinct from §9 (`/account`, the **user** account / LGPD). These are the user's **bank /
> money accounts** whose balances are **derived by the backend**.

**Resource object:**
```json
{
  "id": "uuid",
  "name": "string",
  "kind": "checking" | "cash" | "wallet" | "investment",
  "currency": "BRL",
  "openingBalance": 0,        // cents (integer; may be negative)
  "currentBalance": 0,        // cents (integer); DERIVED by the backend (read-only)
  "archived": false,
  "createdAt": "iso-utc",
  "updatedAt": "iso-utc"
}
```

`currentBalance = openingBalance + Σ(income) − Σ(expense)` over the account's linked
transactions. It is **computed by the backend** and read-only — clients display it, never
recompute it.

| Method | Path | Request body / query | Success | Errors |
|---|---|---|---|---|
| GET | `/accounts` | query: `archived` (`true`/`false`) | `200` `{ "items": [resource] }` | `401` |
| GET | `/accounts/:id` | — | `200` resource | `404`; `401` |
| POST | `/accounts` | `{ name, kind, currency, openingBalance?(int cents, default 0) }` | `201` resource | `400` invalid `kind` / empty `currency`; `401` |
| PUT | `/accounts/:id` | `{ name, kind, openingBalance }` (`currency` is **immutable** — not accepted) | `200` resource | `400`; `404`; `401` |
| POST | `/accounts/:id/archive` | — | `200` archived resource (soft-delete) | `404`; `401` |

Notes:
- `kind` MUST be one of `checking | cash | wallet | investment`. `currency` MUST be a
  non-empty string and is **immutable** after creation.
- `openingBalance` is an integer in cents and **may be negative** (default `0`).
- Archiving is a **soft-delete**: an archived account stays readable and keeps its computed
  balance, but does **not** accept new linked transactions.
- A `:id` belonging to another user responds `404` (existence is never revealed).

---

## 4. Transactions  `(/transactions)` — protected

**Resource object:**
```json
{
  "id": "uuid",
  "type": "income" | "expense",
  "amount": 1000,                    // cents
  "currency": "BRL",
  "categoryId": "uuid" | null,
  "category": "string" | null,       // legacy free-text fallback, read-only (new writes leave null)
  "recurringTemplateId": "uuid" | null,
  "cardId": "uuid" | null,           // null = ad-hoc, outside any invoice
  "accountId": "uuid" | null,        // null = not linked to any bank account (§3.5)
  "occurredOn": "YYYY-MM-DD",
  "description": "string" | null,    // DECRYPTED for the owner
  "externalRef": "string" | null,    // DECRYPTED for the owner
  "createdAt": "iso-utc",
  "updatedAt": "iso-utc"
}
```

| Method | Path | Request body / query | Success | Errors |
|---|---|---|---|---|
| POST | `/transactions` | `{ type, amount(int), currency, occurredOn, categoryId?, cardId?, accountId?, description?, externalRef? }` | `201` resource | `400` invalid `type`/`amount`/`currency`/`occurredOn`, or bad `categoryId`/`cardId`/`accountId`; `401` |
| POST | `/transactions/batch` | **array** of items (each the same shape as the POST body) | `201` `{ "items": [resource] }` | `400` (see batch rules — body adds `index`); `401` |
| GET | `/transactions` | query: `type`, `categoryId`, `cardId`, `accountId`, `from`, `to` | `200` `{ "items": [resource] }` | `401` |
| GET | `/transactions/:id` | — | `200` resource | `404`; `401` |
| PUT | `/transactions/:id` | same as POST (full replace; `categoryId`/`cardId`/`accountId` may be set or `null`) | `200` resource | `400` bad category/card/account; `404`; `401` |
| DELETE | `/transactions/:id` | — | `204` | `404`; `401` |

Notes:
- `type` MUST be `income` or `expense`. `amount` MUST be an integer (cents). `currency`/
  `occurredOn` MUST be non-empty strings (date format expected but only non-empty is enforced).
- Body-referenced ids return `400` (not `404`) when invalid/archived/not-owned:
  `categoryId` (and its `type` MUST be compatible with the transaction `type`), `cardId`, and
  `accountId`.
- Linking `accountId` attaches the transaction to a bank account (§3.5); the account's
  `currentBalance` is **recomputed by the backend** from its linked transactions. An archived
  account does not accept new linked transactions (`400`).
- Linking `cardId` attaches the transaction to the card's invoice for the period containing
  `occurredOn`; if that invoice was `closed`/`paid` it is **automatically reopened**.
  Editing/deleting a transaction in a closed/paid invoice's period also reopens it.
- **Batch (`POST /transactions/batch`)** is **all-or-nothing**: max **100** items; an empty
  array → `400`; if **any** item is invalid the whole batch fails with `400` and the body
  includes `index` (zero-based) of the offending item — `{ "error": { code, message },
  "index": N }`. On success nothing is partially written: every item is created (`201`).

---

## 5. Categories  `(/categories)` — protected

**Resource object** (all fields cleartext; `name` is **not** encrypted):
```json
{ "id": "uuid", "name": "string", "type": "income"|"expense"|"investment", "archived": false, "createdAt": "iso-utc", "updatedAt": "iso-utc" }
```

| Method | Path | Request | Success | Errors |
|---|---|---|---|---|
| POST | `/categories` | `{ name, type }` | `201` | `400` missing `name` / `type` not in {income,expense,investment}; `401` |
| GET | `/categories` | query: `type`, `archived` (`true`/`false`) | `200` `{ "items": [...] }` | `401` |
| GET | `/categories/:id` | — | `200` | `404`; `401` |
| PUT | `/categories/:id` | `{ name }` | `200` | `400` if `type` present (immutable) or `name` missing; `404`; `401` |
| POST | `/categories/:id/archive` | — | `200` (archived resource) | `404`; `401` |

No hard delete — archive only. An archived category cannot be assigned to new/updated
transactions (`400`).

---

## 6. Recurring payments — protected

**Template object** (`description` **DECRYPTED**; amounts in cents):
```json
{
  "id": "uuid", "description": "string"|null, "amount": 9900, "currency": "BRL",
  "type": "income"|"expense", "categoryId": "uuid"|null,
  "dayOfMonth": 10, "intervalMonths": 1,
  "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"|null,
  "active": true, "createdAt": "iso-utc", "updatedAt": "iso-utc"
}
```

| Method | Path | Request | Success | Errors |
|---|---|---|---|---|
| POST | `/recurring-templates` | `{ type, amount(int), currency, dayOfMonth(1-31), intervalMonths(>=1), startDate, endDate?, description?, categoryId?, active? }` | `201` template | `400`; `401` |
| GET | `/recurring-templates` | query: `active=true` | `200` `{ "items": [...] }` | `401` |
| GET | `/recurring-templates/:id` | — | `200` | `404`; `401` |
| PUT | `/recurring-templates/:id` | same as POST | `200` | `400`; `404`; `401` |
| DELETE | `/recurring-templates/:id` | — | `204` | `404`; `401` |
| GET | `/recurring-occurrences` | query **required**: `from`, `to` (`YYYY-MM-DD`) | `200` `{ "items": [occurrence] }` | `400` missing/`from>to`/range >~3y; `401` |
| POST | `/recurring-templates/:id/confirm` | `{ competence: "YYYY-MM" }` | `201` (first) or `200` (idempotent) → a **Transaction** | `400` invalid competence; `404`; `401` |

**Occurrence object** (computed at request time, **not persisted**):
```json
{ "recurringTemplateId": "uuid", "competence": "YYYY-MM", "date": "YYYY-MM-DD",
  "amount": 9900, "currency": "BRL", "type": "expense", "categoryId": "uuid"|null,
  "confirmed": false, "transactionId": "uuid"|null }
```
Confirming materializes a real Transaction linked via `recurringTemplateId`; idempotent per
`(template, competence)` — confirming the same competence again returns the existing
transaction with `200` instead of duplicating.

---

## 7. Investments  `(/investments)` — protected

**Investment object** (`name` **DECRYPTED**; amounts in cents):
```json
{
  "id": "uuid", "name": "string"|null,
  "type": "renda_fixa"|"acoes"|"fii"|"cripto"|"outro", "currency": "BRL",
  "archived": false,
  "totalContributed": 15000,         // cents, sum of contributions
  "currentValue": 16000 | null,      // cents, latest valuation or null
  "createdAt": "iso-utc", "updatedAt": "iso-utc"
}
```

| Method | Path | Request | Success | Errors |
|---|---|---|---|---|
| POST | `/investments` | `{ name?, type, currency }` | `201` | `400` bad `type`/`currency`; `401` |
| GET | `/investments` | query: `archived` | `200` `{ "items": [...] }` | `401` |
| GET | `/investments/:id` | — | `200` | `404`; `401` |
| PUT | `/investments/:id` | `{ name }` (rename only) | `200` | `404`; `401` |
| POST | `/investments/:id/archive` | — | `200` | `404`; `401` |
| POST | `/investments/:id/contributions` | `{ amount(int>0), occurredOn, note? }` | `201` **Contribution** | `400` `amount<=0`/bad date/archived; `404`; `401` |
| POST | `/investments/:id/valuations` | `{ currentValue(int), recordedOn }` | `201` **Valuation** | `400` bad value/archived; `404`; `401` |

**Contribution object** (`note` **DECRYPTED**): `{ "id", "amount"(cents), "occurredOn", "note": string|null, "createdAt" }`
**Valuation object:** `{ "id", "currentValue"(cents), "recordedOn", "createdAt" }`

Valuations are append-only (each record inserts a new row; latest by `recordedOn` is the
current value — history never overwritten). Archived investments reject new
contributions/valuations (`400`). There is no list endpoint for contributions/valuations;
they are returned only in their POST response and reflected in investment aggregates.

---

## 8. Credit cards & invoices — protected

**Card object** (`name` **DECRYPTED**):
```json
{ "id": "uuid", "name": "string"|null, "closingDay": 10, "dueDay": 17, "currency": "BRL",
  "archived": false, "createdAt": "iso-utc", "updatedAt": "iso-utc" }
```

| Method | Path | Request | Success | Errors |
|---|---|---|---|---|
| POST | `/cards` | `{ name?, closingDay(1-31), dueDay(1-31), currency }` | `201` | `400`; `401` |
| GET | `/cards` | query: `archived` | `200` `{ "items": [...] }` | `401` |
| GET | `/cards/:id` | — | `200` | `404`; `401` |
| PUT | `/cards/:id` | `{ name?, dueDay? }` | `200` | `400` if `closingDay` changed (immutable); `404`; `401` |
| POST | `/cards/:id/archive` | — | `200` | `404`; `401` |
| GET | `/cards/:id/rates` | — | `200` `{ "items": [rate] }` | `404`; `401` |
| POST | `/cards/:id/rates` | `{ milesPerUnit(number>=0), effectiveFrom }` | `201` rate | `400`; archived `400`; `404`; `401` |
| GET | `/cards/:id/miles` | — | `200` `{ "cardId", "totalMiles": int }` | `404`; `401` |
| GET | `/cards/:id/invoices` | — | `200` `{ "items": [invoice] }` | `404`; `401` |
| GET | `/invoices/:id` | — | `200` invoice **+ `transactions`** | `404`; `401` |
| POST | `/invoices/:id/close` | — | `200` invoice (`closed`) | `400` invalid transition; `404`; `401` |
| POST | `/invoices/:id/pay` | — | `200` invoice (`paid`) | `400` invalid transition; `404`; `401` |

**Mileage rate object** (`milesPerUnit` is a **decimal multiplier, NOT cents**):
```json
{ "id": "uuid", "milesPerUnit": 1.5, "effectiveFrom": "YYYY-MM-DD", "createdAt": "iso-utc" }
```
Rates are append-only and versioned; the rate effective at an invoice's closing date is the
one with the greatest `effectiveFrom <= closingDate`.

**Invoice object** (`total` in cents; `miles` is a derived integer count — **never stored**):
```json
{
  "id": "uuid", "cardId": "uuid", "periodKey": "YYYY-MM",
  "periodStart": "YYYY-MM-DD", "closingDate": "YYYY-MM-DD", "dueDate": "YYYY-MM-DD",
  "status": "open"|"closed"|"paid",
  "closedAt": "iso-utc"|null, "paidAt": "iso-utc"|null,
  "total": 15000,                 // cents, sum of the invoice's transactions
  "miles": 22500,                 // floor(total * rate@closing); derived on read
  "createdAt": "iso-utc", "updatedAt": "iso-utc"
}
```
`GET /invoices/:id` additionally includes `"transactions": [Transaction, ...]`.
State machine: `open → closed → paid` (manual). Invalid transitions → `400`. Invoices are
created lazily (status `open`) when a card transaction first needs one, and automatically
reopened to `open` when a transaction in their period is created/edited/deleted.
`GET /cards/:id/miles` sums the `miles` of that card's `paid` invoices only.

---

## 9. Account & LGPD  `(/account)` — protected

| Method | Path | Request | Success | Errors |
|---|---|---|---|---|
| POST | `/account/consent` | `{ version: string }` | `201` `{ "id", "version", "grantedAt" }` | `400` missing version; `401` |
| GET | `/account/audit` | — | `200` `{ "items": [{ "id", "eventType", "metadata", "createdAt" }] }` | `401` |
| DELETE | `/account` | — | `204` + clears `fa_session` | `401` |

`DELETE /account` is **self-only** (deletes the authenticated caller's account; hard delete
with `ON DELETE CASCADE`, writes an `HMAC(secret, external_sub)` tombstone, clears the
session). There is no delete-by-id form. Audit `metadata` is an object of allowlisted keys
only (free-text and secrets are never recorded).

---

## 10. Field encryption & money — quick reference

**Encrypted at rest, returned DECRYPTED to the owner:**
- Transaction `description`, `externalRef`
- Recurring template `description`
- Investment `name`; investment contribution `note`
- Credit card `name`

**Stored & returned in cleartext (filterable/aggregatable):** all ids, `type`, `currency`,
`amount`, `occurredOn`/dates, `category` (legacy string) and category `name`, status flags,
invoice/period fields, mileage rate.

**Integer minor units (cents):** transaction `amount`; recurring template `amount`;
investment `totalContributed`, `currentValue`; contribution `amount`; valuation
`currentValue`; invoice `total`.
**NOT cents:** mileage `milesPerUnit` (decimal multiplier); `miles` and `totalMiles`
(integer counts); `dayOfMonth`/`intervalMonths`/`closingDay`/`dueDay` (calendar integers).

---

## 11. Divergences from `openspec/` specs (code is authoritative here)

1. **Auth endpoint names.** Specs/requester reference `/auth/google/start`, `/callback`,
   `DELETE /me`. Code implements `GET /auth/login`, `GET /auth/callback`,
   `POST /auth/logout`, `DELETE /account`.
2. **`GET /` and `GET /health`** exist in code but are not covered by any capability spec.
3. **Account deletion isolation scenario.** `account-lifecycle` spec has a "user cannot
   delete another user's account → 404" scenario, but the implemented `DELETE /account` is
   self-only (no id), so that cross-tenant-by-id case is not reachable via the API.
4. **Logout is not server-side revocation.** Spec says "logout clears the session"; in
   practice the stateless JWT stays valid until `exp` (≤15 min) — only the cookie is cleared.
5. **`email_verified` not enforced.** The signup gate may authorize by Google `email`
   without checking the `email_verified` claim (onboarding accepts the token if signed and
   `iss`/`aud`/`exp`/`nonce` are valid).
6. **Body-referenced id error code.** Cross-tenant/archived/missing `categoryId` and
   `cardId` supplied in a request body return `400` (not `404`) — consistent with the synced
   `transactions`/`managed-categories` specs, but worth restating since it differs from the
   URL-id `404` rule.
7. **`occurredOn` validation** on transactions checks "non-empty string", not a strict
   `YYYY-MM-DD` pattern (other date fields like recurring/investment dates are pattern-checked).

---

_Generated from the implementation: `src/index.ts` (routes), `src/http/responses.ts`,
`src/auth/session.ts`, `src/domain/*.ts` (handlers), `src/data/repository.ts` (resource
shapes), and `migrations/*.sql` (schema)._
