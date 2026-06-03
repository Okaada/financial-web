// Transaction & category API calls — thin wrappers over the single HTTP client.
// All endpoints/shapes per CONTRACT.md (§4, §5).

import { apiGet, apiPost } from '../../api/client'
import { CATEGORIES_PATH, TRANSACTIONS_PATH } from '../../api/paths'
import type {
  Category,
  CreateTransactionInput,
  ListEnvelope,
  Transaction,
} from '../../api/types'

/** GET /api/transactions -> { items: [...] }. */
export async function listTransactions(): Promise<Transaction[]> {
  const data = await apiGet<ListEnvelope<Transaction>>(TRANSACTIONS_PATH)
  return data.items
}

/** POST /api/transactions -> 201 created resource. amount must be in cents. */
export function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  return apiPost<Transaction>(TRANSACTIONS_PATH, input)
}

/** GET /api/categories?type=expense -> { items: [...] } (non-archived only here). */
export async function listExpenseCategories(): Promise<Category[]> {
  const data = await apiGet<ListEnvelope<Category>>(CATEGORIES_PATH, {
    type: 'expense',
    archived: 'false',
  })
  return data.items
}
