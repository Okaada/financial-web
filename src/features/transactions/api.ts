// Transaction & category API calls — thin wrappers over the single HTTP client.
// All endpoints/shapes per CONTRACT.md (§4, §5).

import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client'
import {
  CATEGORIES_PATH,
  TRANSACTIONS_PATH,
  transactionPath,
} from '../../api/paths'
import type {
  Category,
  CreateTransactionInput,
  ListEnvelope,
  Transaction,
  TransactionFilters,
  UpdateTransactionInput,
} from '../../api/types'

/** GET /api/transactions (optionally filtered) -> { items: [...] }. */
export async function listTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  // Omit empty filters from the query (the client drops undefined values).
  const query = {
    type: filters?.type,
    categoryId: filters?.categoryId || undefined,
    cardId: filters?.cardId || undefined,
    from: filters?.from || undefined,
    to: filters?.to || undefined,
  }
  const data = await apiGet<ListEnvelope<Transaction>>(TRANSACTIONS_PATH, query)
  return data.items
}

/** POST /api/transactions -> 201 created resource. amount must be in cents. */
export function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  return apiPost<Transaction>(TRANSACTIONS_PATH, input)
}

/** PUT /api/transactions/:id -> 200 updated resource (full replace; amount in cents). */
export function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  return apiPut<Transaction>(transactionPath(id), input)
}

/** DELETE /api/transactions/:id -> 204. */
export function deleteTransaction(id: string): Promise<void> {
  return apiDelete(transactionPath(id))
}

/** GET /api/categories?type=expense -> { items: [...] } (non-archived only here). */
export async function listExpenseCategories(): Promise<Category[]> {
  const data = await apiGet<ListEnvelope<Category>>(CATEGORIES_PATH, {
    type: 'expense',
    archived: 'false',
  })
  return data.items
}
