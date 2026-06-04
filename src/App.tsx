// The app is 100% behind authentication. There is no public landing screen: the first
// protected load (a screen's data fetch) acts as the auth gate — a 401 is handled
// centrally by the HTTP client (redirect to GET /api/auth/login).
//
// Navigation is plain local state (design D4): a few screens, no router, no deep-links.
// Layout is a shell: a sidebar (fixed on desktop, drawer on mobile) + the main content.

import { useEffect, useState, useSyncExternalStore } from 'react'
import { getAuthStatus, markUnauthenticated, subscribeAuth } from './api/authState'
import { probeSession } from './api/session'
import { InviteOnlyScreen } from './features/auth/InviteOnlyScreen'
import { LoginScreen } from './features/auth/LoginScreen'
import { AccountScreen } from './features/account/AccountScreen'
import { AccountsScreen } from './features/accounts/AccountsScreen'
import { CardsScreen } from './features/cards/CardsScreen'
import { CategoriesScreen } from './features/categories/CategoriesScreen'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { InvestmentsScreen } from './features/investments/InvestmentsScreen'
import { RecurringOccurrencesScreen } from './features/recurring/RecurringOccurrencesScreen'
import { RecurringTemplatesScreen } from './features/recurring/RecurringTemplatesScreen'
import { TransactionsScreen } from './features/transactions/TransactionsScreen'
import { MenuIcon } from './features/shell/NavIcons'
import { Sidebar } from './features/shell/Sidebar'
import type { View } from './features/shell/nav'

// Screens with no props are looked up here; the dashboard takes an onNavigate prop and is
// rendered explicitly below.
const SCREENS: Record<Exclude<View, 'dashboard'>, () => React.JSX.Element> = {
  accounts: AccountsScreen,
  transactions: TransactionsScreen,
  categories: CategoriesScreen,
  recurring: RecurringTemplatesScreen,
  occurrences: RecurringOccurrencesScreen,
  investments: InvestmentsScreen,
  cards: CardsScreen,
  account: AccountScreen,
}

export default function App() {
  const authStatus = useSyncExternalStore(subscribeAuth, getAuthStatus)

  // On first load, probe a protected endpoint to learn the session state. The HTTP client
  // sets the state (success -> authenticated, 401 -> unauthenticated). If the probe fails
  // for another reason (network/500), fall back to the login screen so we never hang on the
  // splash.
  useEffect(() => {
    if (getAuthStatus() !== 'unknown') return
    void probeSession().finally(() => {
      if (getAuthStatus() === 'unknown') markUnauthenticated()
    })
  }, [])

  if (authStatus === 'unknown') {
    return (
      <div className="splash" role="status" aria-live="polite">
        <span className="splash-brand">Finance</span>
        <span className="state state-loading">Carregando…</span>
      </div>
    )
  }

  if (authStatus === 'unauthenticated') {
    return <LoginScreen />
  }

  if (authStatus === 'signup_denied') {
    return <InviteOnlyScreen />
  }

  return <AppShell />
}

function AppShell() {
  const [view, setView] = useState<View>('dashboard')
  const [navOpen, setNavOpen] = useState(false)

  // Close the mobile drawer on Escape (only matters while it is open).
  useEffect(() => {
    if (!navOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  return (
    <div className={navOpen ? 'app-shell nav-open' : 'app-shell'}>
      {/* Slim top bar — only visible on mobile (CSS), to open the drawer. */}
      <header className="topbar">
        <button
          type="button"
          className="topbar-menu"
          aria-label="Abrir menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen(true)}
        >
          <MenuIcon />
        </button>
        <span className="topbar-brand">Finance</span>
      </header>

      <Sidebar view={view} onNavigate={setView} onClose={() => setNavOpen(false)} />

      {/* Backdrop behind the mobile drawer. */}
      <div
        className="scrim"
        role="presentation"
        hidden={!navOpen}
        onClick={() => setNavOpen(false)}
      />

      <main className="app-main">
        <CurrentScreen view={view} onNavigate={setView} />
      </main>
    </div>
  )
}

// Render the active screen as a real component (NOT a function call) so its hooks live in
// their own component instance. Calling SCREENS[view]() inline would run each screen's
// hooks inside App's render, and switching views would change App's hook sequence —
// triggering React error #310 (hooks count mismatch) on navigation.
function CurrentScreen({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  if (view === 'dashboard') return <DashboardScreen onNavigate={onNavigate} />
  const Screen = SCREENS[view]
  return <Screen />
}
