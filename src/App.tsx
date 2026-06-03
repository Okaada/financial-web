// The app is 100% behind authentication. There is no public landing screen: the first
// protected load (a screen's data fetch) acts as the auth gate — a 401 is handled
// centrally by the HTTP client (redirect to GET /api/auth/login).
//
// Navigation is plain local state (design D4): a few screens, no router, no deep-links.

import { useState } from 'react'
import { logout } from './api/session'
import { CategoriesScreen } from './features/categories/CategoriesScreen'
import { RecurringOccurrencesScreen } from './features/recurring/RecurringOccurrencesScreen'
import { RecurringTemplatesScreen } from './features/recurring/RecurringTemplatesScreen'
import { TransactionsScreen } from './features/transactions/TransactionsScreen'

type View = 'transactions' | 'categories' | 'recurring' | 'occurrences'

const VIEWS: { id: View; label: string }[] = [
  { id: 'transactions', label: 'Transações' },
  { id: 'categories', label: 'Categorias' },
  { id: 'recurring', label: 'Recorrentes' },
  { id: 'occurrences', label: 'Previstos' },
]

const SCREENS: Record<View, () => React.JSX.Element> = {
  transactions: TransactionsScreen,
  categories: CategoriesScreen,
  recurring: RecurringTemplatesScreen,
  occurrences: RecurringOccurrencesScreen,
}

export default function App() {
  const [view, setView] = useState<View>('transactions')
  const Screen = SCREENS[view]

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-views">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={view === v.id ? 'nav-link active' : 'nav-link'}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </nav>

      <Screen />
    </>
  )
}
