// Session lifecycle on the front (design.md D3 + web-session-auth spec).
//
// Login is NOT a fetch: it is a full-page, top-level browser navigation to the
// backend's OIDC entry point. The backend runs the entire Authorization Code + PKCE
// flow and 302s back to `/`. A fetch cannot follow that cross-origin redirect chain
// nor set the navigation cookie correctly — only the browser navigating can.

import { LOGIN_PATH } from './paths'

/** Start login by navigating the whole page to GET /api/auth/login. */
export function login(): void {
  // Top-level navigation, not fetch (see module note).
  window.location.assign(LOGIN_PATH)
}

/**
 * Redirect to login. Used by the HTTP client's central 401 handling and by the
 * logout flow. Guarded so we never enqueue multiple navigations in one tick.
 */
let redirecting = false
export function redirectToLogin(): void {
  if (redirecting) return
  redirecting = true
  login()
}
