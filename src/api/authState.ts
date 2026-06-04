// Observable auth state (web-session-auth). There is no whoami endpoint, so the front infers
// the session from protected calls: the HTTP client marks 'authenticated' on a successful
// protected response and 'unauthenticated' on a 401. App subscribes (useSyncExternalStore)
// and renders splash / login / shell accordingly.
//
// This lives in a non-React module because client.ts (also non-React) must push changes to
// the UI. It is plain app state — NOT the session cookie; the JS never touches fa_session.

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated' | 'signup_denied'

let status: AuthStatus = 'unknown'
const listeners = new Set<() => void>()

function setStatus(next: AuthStatus): void {
  if (next === status) return
  status = next
  for (const listener of listeners) listener()
}

export function getAuthStatus(): AuthStatus {
  return status
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function markAuthenticated(): void {
  setStatus('authenticated')
}

export function markUnauthenticated(): void {
  setStatus('unauthenticated')
}

/** Login succeeded at Google, but the identity is not allowed to onboard (403 signup_denied). */
export function markSignupDenied(): void {
  setStatus('signup_denied')
}
