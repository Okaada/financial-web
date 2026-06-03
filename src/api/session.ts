// Session lifecycle on the front (web-session-auth spec).
//
// Logout IS a fetch (a same-origin mutation that clears the cookie), unlike login which is a
// top-level navigation. After logout we mark the session unauthenticated so the app shows
// the login screen — we do NOT navigate to /api/auth/login, which would restart the OIDC
// flow and (with the Google session still active) silently re-log the user in, defeating the
// logout. Re-entering then requires the explicit "Entrar com Google" action.
//
// Caveat (CONTRACT.md §2): the stateless JWT stays valid until `exp` (<=15 min);
// POST /auth/logout only clears the client cookie, it does not revoke server-side.

import { apiGet, apiPost } from './client'
import { markUnauthenticated } from './authState'
import { CATEGORIES_PATH, LOGOUT_PATH } from './paths'

/** End the session, then show the login screen (never restart OIDC). */
export async function logout(): Promise<void> {
  try {
    await apiPost<void>(LOGOUT_PATH) // 204 No Content
  } finally {
    // Always treat the user as logged out, even if the request failed — intent is "leave".
    markUnauthenticated()
  }
}

/**
 * Probe the session at startup by hitting a lightweight protected endpoint. The HTTP client
 * sets the auth state as a side effect (success -> authenticated, 401 -> unauthenticated),
 * so we only need to fire the request and swallow the outcome. There is no whoami endpoint;
 * categories is a small, stable protected list.
 */
export async function probeSession(): Promise<void> {
  try {
    await apiGet(CATEGORIES_PATH)
  } catch {
    // The client already set the auth state (401 -> unauthenticated; other errors leave it
    // for the screens to surface). Nothing to do here.
  }
}
