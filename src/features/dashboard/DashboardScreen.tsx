// Visão geral (web-dashboard): the app's landing screen. It composes independent blocks —
// each loads, empties, and errors on its own, so a failure in one never blanks the others.
// It surfaces only backend-provided aggregates and short lists; it never fabricates
// cross-entity totals (there is no /summary endpoint in the CONTRACT).

import { InvestmentsBlock } from './InvestmentsBlock'
import { OpenInvoicesBlock } from './OpenInvoicesBlock'
import { RecentTransactionsBlock } from './RecentTransactionsBlock'
import { UpcomingBlock } from './UpcomingBlock'

/** The full-screen areas a dashboard "ver tudo" shortcut can jump to. */
export type DashboardTarget = 'transactions' | 'occurrences' | 'investments' | 'cards'

export function DashboardScreen({
  onNavigate,
}: {
  onNavigate: (target: DashboardTarget) => void
}) {
  return (
    <main className="screen">
      <h1>Visão geral</h1>

      <div className="dash-grid">
        <OpenInvoicesBlock onSeeAll={() => onNavigate('cards')} />
        <UpcomingBlock onSeeAll={() => onNavigate('occurrences')} />
        <RecentTransactionsBlock onSeeAll={() => onNavigate('transactions')} />
        <InvestmentsBlock onSeeAll={() => onNavigate('investments')} />
      </div>
    </main>
  )
}
