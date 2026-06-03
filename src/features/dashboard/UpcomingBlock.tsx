// Recurring occurrences for the current month. Occurrences are computed by the backend at
// request time; the block only displays them, highlighting the still-pending ones.

import { formatCents } from '../../lib/money'
import type { RecurringOccurrence } from '../../api/types'
import { listCurrentMonthOccurrences } from './api'
import { DashboardBlock } from './DashboardBlock'
import { useBlock } from './useBlock'

const MAX_SHOWN = 5

export function UpcomingBlock({ onSeeAll }: { onSeeAll: () => void }) {
  const { state, reload } = useBlock<RecurringOccurrence[]>(
    listCurrentMonthOccurrences,
    'Erro ao carregar previstos.',
  )

  return (
    <DashboardBlock
      title="Previstos do mês"
      onSeeAll={onSeeAll}
      seeAllLabel="Ver previstos"
      state={state}
      reload={reload}
    >
      {(items) => {
        // Pending first, then by date — so what still needs confirming surfaces on top.
        const sorted = [...items].sort(
          (a, b) => Number(a.confirmed) - Number(b.confirmed) || a.date.localeCompare(b.date),
        )
        return items.length === 0 ? (
          <p className="state state-empty">Nenhum previsto para o mês.</p>
        ) : (
          <>
            <ul className="dash-list">
              {sorted.slice(0, MAX_SHOWN).map((occ) => (
                <li key={`${occ.recurringTemplateId}:${occ.competence}`} className="dash-row">
                  <div className="dash-row-main">
                    <span className="dash-row-title">{occ.date}</span>
                    <span className="dash-row-sub">
                      {occ.confirmed ? 'Confirmado' : 'Pendente'}
                    </span>
                  </div>
                  <strong
                    className={
                      occ.type === 'income' ? 'dash-row-amount income' : 'dash-row-amount'
                    }
                  >
                    {formatCents(occ.amount, occ.currency)}
                  </strong>
                </li>
              ))}
            </ul>
            {items.length > MAX_SHOWN && (
              <p className="dash-more">+{items.length - MAX_SHOWN} no mês</p>
            )}
          </>
        )
      }}
    </DashboardBlock>
  )
}
