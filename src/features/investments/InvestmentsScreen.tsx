// Investments screen (web-investments). Create form, filters (archived + account), a
// per-account / per-type dashboard, the investment list, and batch creation. currentValue,
// totalContributed and totalInvested are backend-derived — the dashboard only GROUPS the
// already-derived totalInvested of the returned list by account and by type (per currency,
// never mixing currencies); it never recomputes an investment's aggregates.

import { useCallback, useEffect, useState } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { Account, CreateInvestmentInput, Investment } from '../../api/types'
import { formatCents } from '../../lib/money'
import { listAccounts } from '../accounts/api'
import { createInvestment, listInvestments } from './api'
import { InvestmentBatchScreen } from './InvestmentBatchScreen'
import { InvestmentCard } from './InvestmentCard'
import { InvestmentForm } from './InvestmentForm'
import { investmentTypeLabel } from './taxonomy'

type Status = 'loading' | 'ready' | 'error'
type ArchivedFilter = '' | 'true' | 'false'

interface Totals {
  invested: number
  current: number // only sums non-null currentValue
}

/** Group by a key, then by currency, summing backend-derived totalInvested/currentValue. */
function groupBy(
  investments: Investment[],
  keyOf: (i: Investment) => string,
): Map<string, Map<string, Totals>> {
  const out = new Map<string, Map<string, Totals>>()
  for (const inv of investments) {
    const key = keyOf(inv)
    const byCurrency = out.get(key) ?? new Map<string, Totals>()
    const t = byCurrency.get(inv.currency) ?? { invested: 0, current: 0 }
    t.invested += inv.totalInvested
    if (inv.currentValue !== null) t.current += inv.currentValue
    byCurrency.set(inv.currency, t)
    out.set(key, byCurrency)
  }
  return out
}

export function InvestmentsScreen() {
  const [status, setStatus] = useState<Status>('loading')
  const [investments, setInvestments] = useState<Investment[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [archivedFilter, setArchivedFilter] = useState<ArchivedFilter>('false')
  const [accountFilter, setAccountFilter] = useState('')

  // Investment accounts: for the filter dropdown and the id->name map in the dashboard.
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showBatch, setShowBatch] = useState(false)

  const load = useCallback(async (archived: ArchivedFilter, accountId: string) => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const items = await listInvestments({
        archived: archived === '' ? undefined : archived === 'true',
        accountId: accountId || undefined,
      })
      setInvestments(items)
      setStatus('ready')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar investimentos.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load(archivedFilter, accountFilter)
  }, [load, archivedFilter, accountFilter])

  // Investment accounts (best-effort) for the filter + name map.
  useEffect(() => {
    let active = true
    listAccounts({ archived: false })
      .then((items) => {
        if (active) setAccounts(items.filter((a) => a.kind === 'investment'))
      })
      .catch(() => {
        /* best-effort */
      })
    return () => {
      active = false
    }
  }, [])

  function handleCreated(created: Investment) {
    setInvestments((prev) => [created, ...prev])
  }

  function handleChanged(updated: Investment) {
    setInvestments((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
  }

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? '(conta)'
  const byAccount = groupBy(investments, (i) => i.accountId ?? '__none__')
  const byType = groupBy(investments, (i) => i.type)

  if (showBatch) {
    return (
      <InvestmentBatchScreen
        onBack={() => setShowBatch(false)}
        onCreated={() => void load(archivedFilter, accountFilter)}
      />
    )
  }

  return (
    <main className="screen">
      <div className="batch-head">
        <h1>Investimentos</h1>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowBatch(true)}>
          Criar em lote
        </button>
      </div>

      <InvestmentForm
        mode="create"
        onCreate={async (input: CreateInvestmentInput) => {
          const created = await createInvestment(input)
          handleCreated(created)
        }}
      />

      <form className="filters">
        <label>
          Situação
          <select value={archivedFilter} onChange={(e) => setArchivedFilter(e.target.value as ArchivedFilter)}>
            <option value="false">Ativos</option>
            <option value="true">Arquivados</option>
            <option value="">Todos</option>
          </select>
        </label>
        <label>
          Conta
          <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
            <option value="">Todas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </form>

      {/* Dashboard: totals per account and per type (by currency). */}
      {status === 'ready' && investments.length > 0 && (
        <div className="dash-grid">
          <section className="dash-block">
            <header className="dash-block-head">
              <h2>Por conta</h2>
            </header>
            <ul className="dash-list">
              {[...byAccount.entries()].map(([key, byCurrency]) =>
                [...byCurrency.entries()].map(([currency, t]) => (
                  <li key={`${key}:${currency}`} className="dash-row">
                    <div className="dash-row-main">
                      <span className="dash-row-title">
                        {key === '__none__' ? 'Sem conta' : accountName(key)}
                      </span>
                      <span className="dash-row-sub">
                        {currency}
                        {t.current > 0 ? ` · atual ${formatCents(t.current, currency)}` : ''}
                      </span>
                    </div>
                    <strong className="dash-row-amount">{formatCents(t.invested, currency)}</strong>
                  </li>
                )),
              )}
            </ul>
          </section>

          <section className="dash-block">
            <header className="dash-block-head">
              <h2>Por tipo</h2>
            </header>
            <ul className="dash-list">
              {[...byType.entries()].map(([type, byCurrency]) =>
                [...byCurrency.entries()].map(([currency, t]) => (
                  <li key={`${type}:${currency}`} className="dash-row">
                    <div className="dash-row-main">
                      <span className="dash-row-title">{investmentTypeLabel(type as Investment['type'])}</span>
                      <span className="dash-row-sub">{currency}</span>
                    </div>
                    <strong className="dash-row-amount">{formatCents(t.invested, currency)}</strong>
                  </li>
                )),
              )}
            </ul>
          </section>
        </div>
      )}

      <section className="investments">
        {status === 'loading' && <p className="state state-loading">Carregando…</p>}

        {status === 'error' && (
          <div className="state state-error" role="alert">
            <p>{errorMessage}</p>
            <button type="button" onClick={() => void load(archivedFilter, accountFilter)}>
              Tentar novamente
            </button>
          </div>
        )}

        {status === 'ready' && investments.length === 0 && (
          <p className="state state-empty">Nenhum investimento.</p>
        )}

        {status === 'ready' && investments.length > 0 && (
          <ul className="category-list">
            {investments.map((inv) => (
              <InvestmentCard key={inv.id} investment={inv} onChange={handleChanged} />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
