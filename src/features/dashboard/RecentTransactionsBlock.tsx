// The most recent transactions. Each amount is formatted from its own cents value; nothing
// is summed across the list.

import { formatCents } from '../../lib/money'
import type { Transaction } from '../../api/types'
import { listRecentTransactions } from './api'
import { DashboardBlock } from './DashboardBlock'
import { useBlock } from './useBlock'

const MAX_SHOWN = 5

export function RecentTransactionsBlock({ onSeeAll }: { onSeeAll: () => void }) {
  const { state, reload } = useBlock<Transaction[]>(
    () => listRecentTransactions(MAX_SHOWN),
    'Erro ao carregar transações.',
  )

  return (
    <DashboardBlock
      title="Últimas transações"
      onSeeAll={onSeeAll}
      seeAllLabel="Ver transações"
      state={state}
      reload={reload}
    >
      {(items) =>
        items.length === 0 ? (
          <p className="state state-empty">Nenhuma transação ainda.</p>
        ) : (
          <ul className="dash-list">
            {items.map((tx) => (
              <li key={tx.id} className="dash-row">
                <div className="dash-row-main">
                  <span className="dash-row-title">{tx.description ?? '(sem descrição)'}</span>
                  <span className="dash-row-sub">
                    {tx.occurredOn} · {tx.type === 'income' ? 'Receita' : 'Despesa'}
                  </span>
                </div>
                <strong
                  className={tx.type === 'income' ? 'dash-row-amount income' : 'dash-row-amount'}
                >
                  {formatCents(tx.amount, tx.currency)}
                </strong>
              </li>
            ))}
          </ul>
        )
      }
    </DashboardBlock>
  )
}
