// The app is 100% behind authentication. There is no public landing screen: the first
// protected load (a screen's data fetch) acts as the auth gate — a 401 is handled
// centrally by the HTTP client (redirect to GET /api/auth/login).
//
// Navigation is plain local state (design D4): a few screens, no router, no deep-links.

import { useState } from 'react'
import { logout } from './api/session'
import { ThemeToggle } from './features/shell/ThemeToggle'
import { AccountScreen } from './features/account/AccountScreen'
import { CardsScreen } from './features/cards/CardsScreen'
import { CategoriesScreen } from './features/categories/CategoriesScreen'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { InvestmentsScreen } from './features/investments/InvestmentsScreen'
import { RecurringOccurrencesScreen } from './features/recurring/RecurringOccurrencesScreen'
import { RecurringTemplatesScreen } from './features/recurring/RecurringTemplatesScreen'
import { TransactionsScreen } from './features/transactions/TransactionsScreen'

type View =
  | 'dashboard'
  | 'transactions'
  | 'categories'
  | 'recurring'
  | 'occurrences'
  | 'investments'
  | 'cards'
  | 'account'

const VIEWS: { id: View; label: string }[] = [
  { id: 'dashboard', label: 'Visão geral' },
  { id: 'transactions', label: 'Transações' },
  { id: 'categories', label: 'Categorias' },
  { id: 'recurring', label: 'Recorrentes' },
  { id: 'occurrences', label: 'Previstos' },
  { id: 'investments', label: 'Investimentos' },
  { id: 'cards', label: 'Cartões' },
  { id: 'account', label: 'Conta' },
]

// Screens with no props are looked up here; the dashboard takes an onNavigate prop and is
// rendered explicitly below.
const SCREENS: Record<Exclude<View, 'dashboard'>, () => React.JSX.Element> = {
  transactions: TransactionsScreen,
  categories: CategoriesScreen,
  recurring: RecurringTemplatesScreen,
  occurrences: RecurringOccurrencesScreen,
  investments: InvestmentsScreen,
  cards: CardsScreen,
  account: AccountScreen,
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')

  return (
    <>
      <header className="appbar">
        <div className="appbar-inner">
          <span className="appbar-brand">Finance</span>

          <nav className="nav-views" aria-label="Navegação principal">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={view === v.id ? 'nav-link active' : 'nav-link'}
                aria-current={view === v.id ? 'page' : undefined}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </nav>

          <div className="appbar-actions">
            <ThemeToggle />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <CurrentScreen view={view} onNavigate={setView} />
    </>
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
