// Open invoices across all non-archived cards. Each total comes straight from the backend
// aggregate (invoice.total) — the block never sums across invoices.

import { formatCents } from '../../lib/money'
import { listOpenInvoices, type OpenInvoice } from './api'
import { DashboardBlock } from './DashboardBlock'
import { useBlock } from './useBlock'

const MAX_SHOWN = 5

export function OpenInvoicesBlock({ onSeeAll }: { onSeeAll: () => void }) {
  const { state, reload } = useBlock<OpenInvoice[]>(listOpenInvoices, 'Erro ao carregar faturas.')

  return (
    <DashboardBlock
      title="Faturas em aberto"
      onSeeAll={onSeeAll}
      seeAllLabel="Ver cartões"
      state={state}
      reload={reload}
    >
      {(items) =>
        items.length === 0 ? (
          <p className="state state-empty">Nenhuma fatura em aberto.</p>
        ) : (
          <>
            <ul className="dash-list">
              {items.slice(0, MAX_SHOWN).map(({ invoice, card }) => (
                <li key={invoice.id} className="dash-row">
                  <div className="dash-row-main">
                    <span className="dash-row-title">{card.name ?? '(sem nome)'}</span>
                    <span className="dash-row-sub">
                      Vence {invoice.dueDate} · {invoice.periodKey}
                    </span>
                  </div>
                  <strong className="dash-row-amount">
                    {formatCents(invoice.total, card.currency)}
                  </strong>
                </li>
              ))}
            </ul>
            {items.length > MAX_SHOWN && (
              <p className="dash-more">+{items.length - MAX_SHOWN} em aberto</p>
            )}
          </>
        )
      }
    </DashboardBlock>
  )
}
