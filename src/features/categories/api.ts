// Category management API calls — thin wrappers over the single HTTP client.
// Endpoints/shapes per CONTRACT.md §5. No hard delete: archive only.

import { apiGet, apiPost, apiPut } from '../../api/client'
import { CATEGORIES_PATH, categoryArchivePath, categoryPath } from '../../api/paths'
import type {
  Category,
  CategoryFilters,
  CreateCategoryInput,
  ListEnvelope,
  RenameCategoryInput,
} from '../../api/types'

/** GET /api/categories (optionally filtered by type/archived) -> { items: [...] }. */
export async function listCategories(filters?: CategoryFilters): Promise<Category[]> {
  const query = {
    type: filters?.type,
    archived: filters?.archived === undefined ? undefined : String(filters.archived),
  }
  const data = await apiGet<ListEnvelope<Category>>(CATEGORIES_PATH, query)
  return data.items
}

/** POST /api/categories { name, type } -> 201 created resource. */
export function createCategory(input: CreateCategoryInput): Promise<Category> {
  return apiPost<Category>(CATEGORIES_PATH, input)
}

/** PUT /api/categories/:id { name } -> 200. Only name; type is immutable. */
export function renameCategory(id: string, input: RenameCategoryInput): Promise<Category> {
  return apiPut<Category>(categoryPath(id), input)
}

/** POST /api/categories/:id/archive -> 200 archived resource (no hard delete). */
export function archiveCategory(id: string): Promise<Category> {
  return apiPost<Category>(categoryArchivePath(id))
}
