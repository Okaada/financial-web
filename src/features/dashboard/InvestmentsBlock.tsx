// Short list of non-archived investments. currentValue is the backend aggregate (or null
// until a valuation exists) — the block never recomputes it.

import { formatCents } from '../../lib/money'
import type { Investment } from '../../api/types'
import { investmentTypeLabel } from '../investments/taxonomy'
import { listActiveInvestments } from './api'
import { DashboardBlock } from './DashboardBlock'
import { useBlock } from './useBlock'

const MAX_SHOWN = 5

export function InvestmentsBlock({ onSeeAll }: { onSeeAll: () => void }) {
  const { state, reload } = useBlock<Investment[]>(
    () => listActiveInvestments(MAX_SHOWN),
    'Erro ao carregar investimentos.',
  )

  return (
    <DashboardBlock
      title="Investimentos"
      onSeeAll={onSeeAll}
      seeAllLabel="Ver investimentos"
      state={state}
      reload={reload}
    >
      {(items) =>
        items.length === 0 ? (
          <p className="state state-empty">Nenhum investimento.</p>
        ) : (
          <ul className="dash-list">
            {items.map((inv) => (
              <li key={inv.id} className="dash-row">
                <div className="dash-row-main">
                  <span className="dash-row-title">{inv.name ?? '(sem nome)'}</span>
                  <span className="dash-row-sub">{investmentTypeLabel(inv.type)}</span>
                </div>
                <strong className="dash-row-amount">
                  {inv.currentValue === null ? (
                    <span className="dash-muted">sem marcação</span>
                  ) : (
                    formatCents(inv.currentValue, inv.currency)
                  )}
                </strong>
              </li>
            ))}
          </ul>
        )
      }
    </DashboardBlock>
  )
}
