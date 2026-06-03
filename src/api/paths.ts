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
export const INVESTMENTS_PATH = `${API_PREFIX}/investments`
export const CARDS_PATH = `${API_PREFIX}/cards`
export const INVOICES_PATH = `${API_PREFIX}/invoices`

// Resource-scoped paths (ids are URL-encoded; a 404 here means "not found / not owned").
export const transactionPath = (id: string) => `${TRANSACTIONS_PATH}/${encodeURIComponent(id)}`
export const categoryPath = (id: string) => `${CATEGORIES_PATH}/${encodeURIComponent(id)}`
export const categoryArchivePath = (id: string) => `${categoryPath(id)}/archive`
export const recurringTemplatePath = (id: string) =>
  `${RECURRING_TEMPLATES_PATH}/${encodeURIComponent(id)}`
export const recurringConfirmPath = (id: string) => `${recurringTemplatePath(id)}/confirm`
export const investmentPath = (id: string) => `${INVESTMENTS_PATH}/${encodeURIComponent(id)}`
export const investmentArchivePath = (id: string) => `${investmentPath(id)}/archive`
export const investmentContributionsPath = (id: string) => `${investmentPath(id)}/contributions`
export const investmentValuationsPath = (id: string) => `${investmentPath(id)}/valuations`
export const cardPath = (id: string) => `${CARDS_PATH}/${encodeURIComponent(id)}`
export const cardArchivePath = (id: string) => `${cardPath(id)}/archive`
export const cardRatesPath = (id: string) => `${cardPath(id)}/rates`
export const cardMilesPath = (id: string) => `${cardPath(id)}/miles`
export const cardInvoicesPath = (id: string) => `${cardPath(id)}/invoices`
export const invoicePath = (id: string) => `${INVOICES_PATH}/${encodeURIComponent(id)}`
export const invoiceClosePath = (id: string) => `${invoicePath(id)}/close`
export const invoicePayPath = (id: string) => `${invoicePath(id)}/pay`
