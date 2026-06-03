// Same-origin API paths (design.md D1). Everything is a relative path under `/api`
// so the browser attaches the session cookie automatically and there is no CORS.
//
// NOTE (CONTRACT.md §11, divergence #1): the real auth routes are `/auth/login` and
// `/auth/logout` — there is NO `/auth/google/start`. Through the same-origin proxy (the
// Worker in worker/index.ts) they are reachable as `/api/auth/login` and
// `/api/auth/logout`.

export const API_PREFIX = '/api'

export const LOGIN_PATH = `${API_PREFIX}/auth/login`
export const LOGOUT_PATH = `${API_PREFIX}/auth/logout`
export const TRANSACTIONS_PATH = `${API_PREFIX}/transactions`
export const CATEGORIES_PATH = `${API_PREFIX}/categories`

export const RECURRING_TEMPLATES_PATH = `${API_PREFIX}/recurring-templates`
export const RECURRING_OCCURRENCES_PATH = `${API_PREFIX}/recurring-occurrences`

// Resource-scoped paths (ids are URL-encoded; a 404 here means "not found / not owned").
export const transactionPath = (id: string) => `${TRANSACTIONS_PATH}/${encodeURIComponent(id)}`
export const categoryPath = (id: string) => `${CATEGORIES_PATH}/${encodeURIComponent(id)}`
export const categoryArchivePath = (id: string) => `${categoryPath(id)}/archive`
export const recurringTemplatePath = (id: string) =>
  `${RECURRING_TEMPLATES_PATH}/${encodeURIComponent(id)}`
export const recurringConfirmPath = (id: string) => `${recurringTemplatePath(id)}/confirm`
