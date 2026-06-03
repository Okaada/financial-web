// Login on the front (web-session-auth spec).
//
// Login is NOT a fetch: it is a full-page, top-level browser navigation to the backend's
// OIDC entry point. The backend runs the entire Authorization Code + PKCE flow and 302s back
// to `/`. A fetch cannot follow that cross-origin redirect chain nor set the navigation
// cookie correctly — only the browser navigating can.
//
// This is the ONLY path that navigates to /api/auth/login, and it is triggered solely by the
// user pressing "Entrar com Google" on the login screen. A 401/logout no longer auto-
// navigates here (that caused silent re-SSO after logout) — they mark the session
// unauthenticated (see authState) so the app shows the login screen instead.

import { LOGIN_PATH } from './paths'

/** Start login by navigating the whole page to GET /api/auth/login. */
export function login(): void {
  // Top-level navigation, not fetch (see module note).
  window.location.assign(LOGIN_PATH)
}
