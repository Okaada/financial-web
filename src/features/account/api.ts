// Account & LGPD API calls (CONTRACT.md §9) — thin wrappers over the single HTTP client.
// DELETE /account is self-only and irreversible (hard delete); the backend clears the
// fa_session cookie on success.

import { apiDelete, apiGet, apiPost } from '../../api/client'
import { ACCOUNT_AUDIT_PATH, ACCOUNT_CONSENT_PATH, ACCOUNT_PATH } from '../../api/paths'
import type { AuditEvent, Consent, ListEnvelope } from '../../api/types'

/** POST /api/account/consent { version } -> 201 { id, version, grantedAt }. */
export function recordConsent(version: string): Promise<Consent> {
  return apiPost<Consent>(ACCOUNT_CONSENT_PATH, { version })
}

/** GET /api/account/audit -> { items: [...] } (read-only audit trail of own account). */
export async function listAudit(): Promise<AuditEvent[]> {
  const data = await apiGet<ListEnvelope<AuditEvent>>(ACCOUNT_AUDIT_PATH)
  return data.items
}

/** DELETE /api/account -> 204. Self-only, irreversible; backend clears the session cookie. */
export function deleteAccount(): Promise<void> {
  return apiDelete(ACCOUNT_PATH)
}
