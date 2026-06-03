// Recurring payments API calls — thin wrappers over the single HTTP client.
// Endpoints/shapes per CONTRACT.md §6.

import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client'
import {
  RECURRING_OCCURRENCES_PATH,
  RECURRING_TEMPLATES_PATH,
  recurringConfirmPath,
  recurringTemplatePath,
} from '../../api/paths'
import type {
  ConfirmInput,
  CreateRecurringTemplateInput,
  ListEnvelope,
  OccurrenceRange,
  RecurringOccurrence,
  RecurringTemplate,
  RecurringTemplateFilters,
  Transaction,
} from '../../api/types'

/** GET /api/recurring-templates (optionally filtered by active) -> { items: [...] }. */
export async function listTemplates(
  filters?: RecurringTemplateFilters,
): Promise<RecurringTemplate[]> {
  const query = {
    active: filters?.active === undefined ? undefined : String(filters.active),
  }
  const data = await apiGet<ListEnvelope<RecurringTemplate>>(RECURRING_TEMPLATES_PATH, query)
  return data.items
}

/** POST /api/recurring-templates -> 201. amount in cents. */
export function createTemplate(input: CreateRecurringTemplateInput): Promise<RecurringTemplate> {
  return apiPost<RecurringTemplate>(RECURRING_TEMPLATES_PATH, input)
}

/** PUT /api/recurring-templates/:id -> 200 (same body as POST; amount in cents). */
export function updateTemplate(
  id: string,
  input: CreateRecurringTemplateInput,
): Promise<RecurringTemplate> {
  return apiPut<RecurringTemplate>(recurringTemplatePath(id), input)
}

/** DELETE /api/recurring-templates/:id -> 204 (hard delete). */
export function deleteTemplate(id: string): Promise<void> {
  return apiDelete(recurringTemplatePath(id))
}

/** GET /api/recurring-occurrences?from=&to= -> { items: [...] }. Both dates required. */
export async function listOccurrences(range: OccurrenceRange): Promise<RecurringOccurrence[]> {
  const data = await apiGet<ListEnvelope<RecurringOccurrence>>(RECURRING_OCCURRENCES_PATH, {
    from: range.from,
    to: range.to,
  })
  return data.items
}

/**
 * POST /api/recurring-templates/:id/confirm -> a Transaction. Idempotent per
 * (template, competence): 201 the first time, 200 (same transaction) afterwards.
 */
export function confirmOccurrence(
  templateId: string,
  input: ConfirmInput,
): Promise<Transaction> {
  return apiPost<Transaction>(recurringConfirmPath(templateId), input)
}
