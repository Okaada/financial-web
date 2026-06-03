// Navigation sidebar: brand, the section list (icon + label, active highlighted), and a
// footer with the theme control + logout. It is the same markup for desktop (fixed) and
// mobile (drawer) — the difference is purely CSS. Selecting a section calls onNavigate and
// asks the shell to close the mobile drawer.

import { logout } from '../../api/session'
import { ThemeToggle } from './ThemeToggle'
import { VIEWS, type View } from './nav'

interface SidebarProps {
  view: View
  onNavigate: (view: View) => void
  /** Close the mobile drawer (no-op visual on desktop). */
  onClose: () => void
}

export function Sidebar({ view, onNavigate, onClose }: SidebarProps) {
  function select(next: View) {
    onNavigate(next)
    onClose()
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Finance</div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {VIEWS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={view === id ? 'sidebar-link active' : 'sidebar-link'}
            aria-current={view === id ? 'page' : undefined}
            onClick={() => select(id)}
          >
            <span className="sidebar-link-icon">
              <Icon />
            </span>
            <span className="sidebar-link-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <ThemeToggle />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
          Sair
        </button>
      </div>
    </aside>
  )
}
