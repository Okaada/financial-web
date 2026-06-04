// Shapes mirrored from CONTRACT.md (the source of truth). Only the fields used by
// this skeleton are typed; the rest are intentionally omitted until a screen needs
// them. Never invent fields/endpoints — what is missing here is a backend gap.

export type TransactionType = 'income' | 'expense'

/** CONTRACT.md §4 — Transaction resource. `amount` is an integer in cents. */
export interface Transaction {
  id: string
  type: TransactionType
  amount: number // cents (integer)
  currency: string
  categoryId: string | null
  category: string | null // legacy free-text fallback, read-only
  recurringTemplateId: string | null
  cardId: string | null
  accountId: string | null // null = not linked to any bank account (§3.5)
  occurredOn: string // YYYY-MM-DD
  description: string | null // DECRYPTED for the owner
  externalRef: string | null // DECRYPTED for the owner
  createdAt: string
  updatedAt: string
}

/** Body for POST /transactions (this screen sends a subset; amount in cents). */
export interface CreateTransactionInput {
  type: TransactionType
  amount: number // cents (integer)
  currency: string
  occurredOn: string // YYYY-MM-DD
  categoryId?: string
  cardId?: string
  accountId?: string
  description?: string
  externalRef?: string
}

/**
 * Body for PUT /transactions/:id — full replace (CONTRACT.md §4). Unlike create, the
 * relational ids are sent explicitly as value-or-null so they are not wiped on update:
 * `categoryId`/`cardId` are preserved from the existing resource when not edited.
 */
export interface UpdateTransactionInput {
  type: TransactionType
  amount: number // cents (integer)
  currency: string
  occurredOn: string // YYYY-MM-DD
  categoryId: string | null
  cardId: string | null
  accountId: string | null
  description?: string
}

/** Query filters for GET /transactions (CONTRACT.md §4); empty values are omitted. */
export interface TransactionFilters {
  type?: TransactionType
  categoryId?: string
  cardId?: string
  accountId?: string
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
}

export type CategoryType = 'income' | 'expense' | 'investment'

/** CONTRACT.md §5 — Category resource (all fields cleartext). */
export interface Category {
  id: string
  name: string
  type: CategoryType
  archived: boolean
  createdAt: string
  updatedAt: string
}

/** Body for POST /categories (CONTRACT.md §5). */
export interface CreateCategoryInput {
  name: string
  type: CategoryType
}

/** Body for PUT /categories/:id — only `name` (type is immutable; sending it → 400). */
export interface RenameCategoryInput {
  name: string
}

/** Query filters for GET /categories (CONTRACT.md §5); empty values are omitted. */
export interface CategoryFilters {
  type?: CategoryType
  archived?: boolean
}

/** CONTRACT.md §6 — Recurring template. `amount` in cents; `type` is income|expense. */
export interface RecurringTemplate {
  id: string
  description: string | null // DECRYPTED for the owner
  amount: number // cents (integer)
  currency: string
  type: TransactionType
  categoryId: string | null
  dayOfMonth: number // 1-31
  intervalMonths: number // >= 1
  startDate: string // YYYY-MM-DD
  endDate: string | null // YYYY-MM-DD
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Body for POST/PUT /recurring-templates (PUT is same shape; amount in cents). */
export interface CreateRecurringTemplateInput {
  type: TransactionType
  amount: number // cents (integer)
  currency: string
  dayOfMonth: number
  intervalMonths: number
  startDate: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  description?: string
  categoryId?: string
  active?: boolean
}

/**
 * CONTRACT.md §6 — Occurrence, computed at request time and NOT persisted. Has no `id`
 * of its own; the unique key is `(recurringTemplateId, competence)`.
 */
export interface RecurringOccurrence {
  recurringTemplateId: string
  competence: string // YYYY-MM
  date: string // YYYY-MM-DD
  amount: number // cents (integer)
  currency: string
  type: TransactionType
  categoryId: string | null
  confirmed: boolean
  transactionId: string | null
}

/** Body for POST /recurring-templates/:id/confirm. */
export interface ConfirmInput {
  competence: string // YYYY-MM
}

/** Query filters for GET /recurring-templates; empty values are omitted. */
export interface RecurringTemplateFilters {
  active?: boolean
}

/** Query for GET /recurring-occurrences — both required (CONTRACT.md §6). */
export interface OccurrenceRange {
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
}

/** CONTRACT.md §7 — fixed investment taxonomy. */
export type InvestmentType = 'renda_fixa' | 'acoes' | 'fii' | 'cripto' | 'outro'

/**
 * CONTRACT.md §7 — Investment. `totalContributed`/`totalInvested`/`currentValue` are
 * aggregates computed by the backend (cents); the front never recomputes them.
 * `totalInvested = totalContributed` (sum of contributions — all value enters via aportes).
 * `currentValue` is the latest valuation (or null) and is INDEPENDENT of totalInvested.
 * `name` is DECRYPTED for the owner.
 */
export interface Investment {
  id: string
  name: string
  type: InvestmentType
  currency: string
  archived: boolean
  totalContributed: number // cents (aggregate, sum of contributions)
  totalInvested: number // cents = totalContributed (derived, read-only)
  currentValue: number | null // cents (latest valuation) or null
  accountId: string | null // linked investment account (kind=investment) or null
  createdAt: string
  updatedAt: string
}

/** CONTRACT.md §7 — Contribution (aporte). `note` DECRYPTED. */
export interface Contribution {
  id: string
  amount: number // cents
  occurredOn: string // YYYY-MM-DD
  note: string | null
  createdAt: string
}

/** CONTRACT.md §7 — Valuation (marcação de valor). Append-only. */
export interface Valuation {
  id: string
  currentValue: number // cents
  recordedOn: string // YYYY-MM-DD
  createdAt: string
}

export interface CreateInvestmentInput {
  name: string
  type: InvestmentType
  currency: string
  accountId?: string
}

/** PUT /investments/:id — name/accountId; type/currency/initialValue immutable/removed (not sent). */
export interface UpdateInvestmentInput {
  name: string
  accountId: string | null // null clears the link
}

export interface CreateContributionInput {
  amount: number // cents, integer > 0
  occurredOn: string // YYYY-MM-DD
  note?: string
}

export interface CreateValuationInput {
  currentValue: number // cents
  recordedOn: string // YYYY-MM-DD
}

/** Query filters for GET /investments; empty values are omitted. */
export interface InvestmentFilters {
  archived?: boolean
  accountId?: string
}

/** CONTRACT.md §8 — Credit card. `name` DECRYPTED. `closingDay` is immutable after create. */
export interface Card {
  id: string
  name: string | null
  closingDay: number // 1-31 (calendar integer, NOT cents)
  dueDay: number // 1-31
  currency: string
  archived: boolean
  createdAt: string
  updatedAt: string
}

/** CONTRACT.md §8 — Mileage rate. `milesPerUnit` is a DECIMAL multiplier, NOT cents. */
export interface MileageRate {
  id: string
  milesPerUnit: number // decimal multiplier
  effectiveFrom: string // YYYY-MM-DD
  createdAt: string
}

/** CONTRACT.md §8 — accumulated miles. `totalMiles` is an integer count, NOT cents. */
export interface CardMiles {
  cardId: string
  totalMiles: number // integer count
}

export type InvoiceStatus = 'open' | 'closed' | 'paid'

/** CONTRACT.md §8 — Invoice. `total` is cents; `miles` is a derived integer count. */
export interface Invoice {
  id: string
  cardId: string
  periodKey: string // YYYY-MM
  periodStart: string // YYYY-MM-DD
  closingDate: string // YYYY-MM-DD
  dueDate: string // YYYY-MM-DD
  status: InvoiceStatus
  closedAt: string | null
  paidAt: string | null
  total: number // cents
  miles: number // integer (derived)
  createdAt: string
  updatedAt: string
}

/** GET /invoices/:id additionally includes the composing transactions. */
export interface InvoiceDetail extends Invoice {
  transactions: Transaction[]
}

export interface CreateCardInput {
  name?: string
  closingDay: number // 1-31
  dueDay: number // 1-31
  currency: string
}

/** PUT /cards/:id — name/dueDay only; closingDay is immutable. */
export interface UpdateCardInput {
  name?: string
  dueDay?: number
}

export interface CreateRateInput {
  milesPerUnit: number // decimal multiplier
  effectiveFrom: string // YYYY-MM-DD
}

/** Query filters for GET /cards; empty values are omitted. */
export interface CardFilters {
  archived?: boolean
}

/** CONTRACT.md §9 — Consent record returned by POST /account/consent. */
export interface Consent {
  id: string
  version: string
  grantedAt: string // iso-utc
}

/** Body for POST /account/consent. */
export interface RecordConsentInput {
  version: string
}

/**
 * CONTRACT.md §9 — Audit event. `metadata` is an object of allowlisted keys only (no
 * free-text/secrets). Typed as unknown values: the UI renders them as escaped text/data,
 * never as HTML.
 */
export interface AuditEvent {
  id: string
  eventType: string
  metadata: Record<string, unknown>
  createdAt: string // iso-utc
}

/** CONTRACT.md §3.5 — fixed bank-account taxonomy. */
export type AccountKind = 'checking' | 'cash' | 'wallet' | 'investment'

/**
 * CONTRACT.md §3.5 — Bank account (distinct from §9 user account). `currentBalance` is
 * DERIVED by the backend (cents) — the front never recomputes it. `openingBalance` is cents
 * and may be negative. `currency` is immutable after creation.
 */
export interface Account {
  id: string
  name: string
  kind: AccountKind
  currency: string
  openingBalance: number // cents (integer; may be negative)
  currentBalance: number // cents (integer); backend-derived, read-only
  archived: boolean
  createdAt: string
  updatedAt: string
}

/** Body for POST /accounts. `openingBalance` optional (cents, default 0, may be negative). */
export interface CreateAccountInput {
  name: string
  kind: AccountKind
  currency: string
  openingBalance?: number
}

/** Body for PUT /accounts/:id — `currency` is immutable and NOT sent. */
export interface UpdateAccountInput {
  name: string
  kind: AccountKind
  openingBalance: number
}

/** Query filters for GET /accounts; empty values are omitted. */
export interface AccountFilters {
  archived?: boolean
}

/** Standard list envelope used by every collection endpoint. */
export interface ListEnvelope<T> {
  items: T[]
}

/** Error envelope: { error: { code, message } } (CONTRACT.md §1). */
export interface ErrorEnvelope {
  error: {
    code: string
    message: string
  }
}
