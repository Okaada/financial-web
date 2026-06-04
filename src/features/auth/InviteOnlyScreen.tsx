// Invite-only screen (web-session-auth). Shown when a protected call returns 403
// signup_denied: the user authenticated with Google but their identity is not on the signup
// allowlist. Distinct from the login screen and from protected content. Offers logout.

import { logout } from '../../api/session'

export function InviteOnlyScreen() {
  return (
    <main className="login">
      <div className="login-card">
        <div className="login-brand">Finance</div>
        <p className="login-sub">
          O acesso é por convite. Sua conta Google foi autenticada, mas ainda não está
          autorizada a entrar. Peça um convite ao administrador.
        </p>
        <button type="button" className="login-google" onClick={() => void logout()}>
          <span>Sair</span>
        </button>
      </div>
    </main>
  )
}
