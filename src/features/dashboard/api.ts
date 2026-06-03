// Dashboard composition layer: it does NOT call the network directly (no fetch here — that
// stays in the single client) and it does NOT recompute backend aggregates. It only reuses
// each feature's api.ts and reshapes/filters already-returned items for display.
//
// There is no /summary endpoint in the CONTRACT, so the dashboard never fabricates
// cross-entity totals (net worth, month spend) by summing possibly-partial lists. Every
// monetary value shown comes straight from a backend aggregate (invoice.total,
// investment.currentValue, etc.). A missing summary endpoint is a backend gap, not a
// front-end improvisation.

import { ApiError } from '../../api/client'
import type {
  Card,
  Investment,
  Invoice,
  RecurringOccurrence,
  Transaction,
} from '../../api/types'
import { currentMonthRange } from '../../lib/month'
import { listCards, listInvoices } from '../cards/api'
import { listInvestments } from '../investments/api'
import { listOccurrences } from '../recurring/api'
import { listTransactions } from '../transactions/api'

/**
 * A 404 means "someone else's / no-longer-existing resource" — expected, never a system
 * error, never a login trigger. For a collection that resolves to an array, treat it as
 * empty. (401 still propagates so the client's central redirect runs.)
 */
async function emptyOn404<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise
  } catch (err) {
    if (err instanceof ApiError && err.isNotFound) return []
    throw err
  }
}

/** An open invoice paired with the (non-archived) card it belongs to. */
export interface OpenInvoice {
  invoice: Invoice
  card: Card
}

/**
 * Open invoices across all non-archived cards. The invoices endpoint has no status filter,
 * so we fan out per card (in parallel) and keep `status === 'open'` from the returned items
 * — a field selection over already-aggregated invoices, not a recomputation. Sorted by
 * dueDate ascending so the most urgent show first.
 */
export async function listOpenInvoices(): Promise<OpenInvoice[]> {
  const cards = await listCards({ archived: false })
  const perCard = await Promise.all(
    cards.map(async (card) => {
      const invoices = await emptyOn404(listInvoices(card.id))
      return invoices
        .filter((inv) => inv.status === 'open')
        .map((invoice) => ({ invoice, card }))
    }),
  )
  return perCard.flat().sort((a, b) => a.invoice.dueDate.localeCompare(b.invoice.dueDate))
}

/** Recurring occurrences for the current month (from/to are both required by the API). */
export function listCurrentMonthOccurrences(): Promise<RecurringOccurrence[]> {
  return emptyOn404(listOccurrences(currentMonthRange()))
}

/** Short list of non-archived investments (with backend aggregates), capped at `limit`. */
export async function listActiveInvestments(limit: number): Promise<Investment[]> {
  const items = await emptyOn404(listInvestments({ archived: false }))
  return items.slice(0, limit)
}

/**
 * The N most recent transactions. Order is not guaranteed by the API, so we sort by
 * occurredOn (then createdAt) descending before slicing — an ordering of returned items,
 * not a recomputation of any aggregate.
 */
export async function listRecentTransactions(limit: number): Promise<Transaction[]> {
  const items = await emptyOn404(listTransactions({}))
  return [...items]
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}
