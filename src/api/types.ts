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
  description?: string
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
