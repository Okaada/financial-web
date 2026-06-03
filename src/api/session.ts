// Logout flow (web-session-auth spec, task 3.2). Logout IS a fetch (a same-origin
// mutation that clears the cookie), unlike login which is a top-level navigation.
//
// Caveat (CONTRACT.md §2): the stateless JWT stays valid until `exp` (<=15 min);
// POST /auth/logout only clears the client cookie, it does not revoke server-side.

import { apiPost } from './client'
import { redirectToLogin } from './auth'
import { LOGOUT_PATH } from './paths'

/** End the session, then send the user to login. */
export async function logout(): Promise<void> {
  try {
    await apiPost<void>(LOGOUT_PATH) // 204 No Content
  } finally {
    // Always head to login, even if the request failed — the user intent is "leave".
    redirectToLogin()
  }
}
