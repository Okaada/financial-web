// Investments API calls — thin wrappers over the single HTTP client.
// Endpoints/shapes per CONTRACT.md §7. The front never recomputes aggregates: after a
// contribution/valuation it re-fetches the investment to get authoritative totals.

import { apiGet, apiPost, apiPut } from '../../api/client'
import {
  INVESTMENTS_PATH,
  investmentArchivePath,
  investmentContributionsPath,
  investmentPath,
  investmentValuationsPath,
} from '../../api/paths'
import type {
  Contribution,
  CreateContributionInput,
  CreateInvestmentInput,
  CreateValuationInput,
  Investment,
  InvestmentFilters,
  ListEnvelope,
  RenameInvestmentInput,
  Valuation,
} from '../../api/types'

/** GET /api/investments (optionally filtered by archived) -> { items: [...] }. */
export async function listInvestments(filters?: InvestmentFilters): Promise<Investment[]> {
  const query = {
    archived: filters?.archived === undefined ? undefined : String(filters.archived),
  }
  const data = await apiGet<ListEnvelope<Investment>>(INVESTMENTS_PATH, query)
  return data.items
}

/** GET /api/investments/:id -> the investment with up-to-date aggregates. */
export function getInvestment(id: string): Promise<Investment> {
  return apiGet<Investment>(investmentPath(id))
}

/** POST /api/investments { type, currency, name? } -> 201. */
export function createInvestment(input: CreateInvestmentInput): Promise<Investment> {
  return apiPost<Investment>(INVESTMENTS_PATH, input)
}

/** PUT /api/investments/:id { name } -> 200 (rename only). */
export function renameInvestment(id: string, input: RenameInvestmentInput): Promise<Investment> {
  return apiPut<Investment>(investmentPath(id), input)
}

/** POST /api/investments/:id/archive -> 200 archived resource (no hard delete). */
export function archiveInvestment(id: string): Promise<Investment> {
  return apiPost<Investment>(investmentArchivePath(id))
}

/** POST /api/investments/:id/contributions -> 201 Contribution. amount in cents (> 0). */
export function addContribution(
  id: string,
  input: CreateContributionInput,
): Promise<Contribution> {
  return apiPost<Contribution>(investmentContributionsPath(id), input)
}

/** POST /api/investments/:id/valuations -> 201 Valuation (append-only). value in cents. */
export function addValuation(id: string, input: CreateValuationInput): Promise<Valuation> {
  return apiPost<Valuation>(investmentValuationsPath(id), input)
}
