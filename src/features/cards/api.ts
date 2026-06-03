// Cards, mileage rates, miles and invoices API calls — thin wrappers over the single
// HTTP client. Endpoints/shapes per CONTRACT.md §8. The UI never creates/reopens invoices
// (lazy + auto-reopen are the backend's job); it only lists/details and closes/pays.

import { apiGet, apiPost, apiPut } from '../../api/client'
import {
  CARDS_PATH,
  cardArchivePath,
  cardInvoicesPath,
  cardMilesPath,
  cardPath,
  cardRatesPath,
  invoiceClosePath,
  invoicePath,
  invoicePayPath,
} from '../../api/paths'
import type {
  Card,
  CardFilters,
  CardMiles,
  CreateCardInput,
  CreateRateInput,
  Invoice,
  InvoiceDetail,
  ListEnvelope,
  MileageRate,
  UpdateCardInput,
} from '../../api/types'

/** GET /api/cards (optionally filtered by archived) -> { items: [...] }. */
export async function listCards(filters?: CardFilters): Promise<Card[]> {
  const query = {
    archived: filters?.archived === undefined ? undefined : String(filters.archived),
  }
  const data = await apiGet<ListEnvelope<Card>>(CARDS_PATH, query)
  return data.items
}

export function getCard(id: string): Promise<Card> {
  return apiGet<Card>(cardPath(id))
}

/** POST /api/cards { name?, closingDay, dueDay, currency } -> 201. */
export function createCard(input: CreateCardInput): Promise<Card> {
  return apiPost<Card>(CARDS_PATH, input)
}

/** PUT /api/cards/:id { name?, dueDay? } -> 200. closingDay is immutable (not sent). */
export function updateCard(id: string, input: UpdateCardInput): Promise<Card> {
  return apiPut<Card>(cardPath(id), input)
}

/** POST /api/cards/:id/archive -> 200 archived resource (no hard delete). */
export function archiveCard(id: string): Promise<Card> {
  return apiPost<Card>(cardArchivePath(id))
}

/** GET /api/cards/:id/rates -> { items: [...] } (append-only, versioned). */
export async function listRates(id: string): Promise<MileageRate[]> {
  const data = await apiGet<ListEnvelope<MileageRate>>(cardRatesPath(id))
  return data.items
}

/** POST /api/cards/:id/rates { milesPerUnit, effectiveFrom } -> 201. */
export function addRate(id: string, input: CreateRateInput): Promise<MileageRate> {
  return apiPost<MileageRate>(cardRatesPath(id), input)
}

/** GET /api/cards/:id/miles -> { cardId, totalMiles } (integer, paid invoices only). */
export function getMiles(id: string): Promise<CardMiles> {
  return apiGet<CardMiles>(cardMilesPath(id))
}

/** GET /api/cards/:id/invoices -> { items: [...] }. */
export async function listInvoices(cardId: string): Promise<Invoice[]> {
  const data = await apiGet<ListEnvelope<Invoice>>(cardInvoicesPath(cardId))
  return data.items
}

/** GET /api/invoices/:id -> the invoice plus its transactions. */
export function getInvoice(invoiceId: string): Promise<InvoiceDetail> {
  return apiGet<InvoiceDetail>(invoicePath(invoiceId))
}

/** POST /api/invoices/:id/close -> 200 invoice (closed). */
export function closeInvoice(invoiceId: string): Promise<Invoice> {
  return apiPost<Invoice>(invoiceClosePath(invoiceId))
}

/** POST /api/invoices/:id/pay -> 200 invoice (paid). */
export function payInvoice(invoiceId: string): Promise<Invoice> {
  return apiPost<Invoice>(invoicePayPath(invoiceId))
}
