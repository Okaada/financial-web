// Bank accounts API calls (CONTRACT.md §3.5) — thin wrappers over the single HTTP client.
// `currentBalance` is derived by the backend; the front only displays it. `currency` is
// immutable (the PUT body omits it).

import { apiGet, apiPost, apiPut } from '../../api/client'
import { ACCOUNTS_PATH, accountArchivePath, accountPath } from '../../api/paths'
import type {
  Account,
  AccountFilters,
  CreateAccountInput,
  ListEnvelope,
  UpdateAccountInput,
} from '../../api/types'

/** GET /api/accounts (optionally filtered by archived) -> { items: [...] }. */
export async function listAccounts(filters?: AccountFilters): Promise<Account[]> {
  const query = {
    archived: filters?.archived === undefined ? undefined : String(filters.archived),
  }
  const data = await apiGet<ListEnvelope<Account>>(ACCOUNTS_PATH, query)
  return data.items
}

/** GET /api/accounts/:id -> the account (404 = not found / not owned). */
export function getAccount(id: string): Promise<Account> {
  return apiGet<Account>(accountPath(id))
}

/** POST /api/accounts { name, kind, currency, openingBalance? } -> 201. */
export function createAccount(input: CreateAccountInput): Promise<Account> {
  return apiPost<Account>(ACCOUNTS_PATH, input)
}

/** PUT /api/accounts/:id { name, kind, openingBalance } -> 200. currency is immutable (not sent). */
export function updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
  return apiPut<Account>(accountPath(id), input)
}

/** POST /api/accounts/:id/archive -> 200 archived resource (soft-delete). */
export function archiveAccount(id: string): Promise<Account> {
  return apiPost<Account>(accountArchivePath(id))
}
