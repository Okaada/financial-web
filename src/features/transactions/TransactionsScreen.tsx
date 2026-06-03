// Transactions screen (web-transactions spec). Explicit UI states: loading, empty,
// error (non-401, with retry), and no-session.
//
// This screen's initial load doubles as the app's auth gate (design.md D4): there is
// no `whoami` endpoint, so loading GET /api/transactions IS the session probe — a 401
// is handled centrally by the HTTP client (redirect to login), so the "no-session"
// state needs no per-screen logic here.

import { useCallback, useEffect, useState } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import { logout } from '../../api/session'
import type { Transaction } from '../../api/types'
import { formatCents } from '../../lib/money'
import { listTransactions } from './api'
import { TransactionForm } from './TransactionForm'

type Status = 'loading' | 'ready' | 'error'

export function TransactionsScreen() {
  const [status, setStatus] = useState<Status>('loading')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const items = await listTransactions()
      setTransactions(items)
      setStatus('ready')
    } catch (err) {
      // 401 -> the client already redirected to login; stay in loading (no-session)
      // and let the navigation happen. Only non-401 errors become the error state.
      if (err instanceof UnauthenticatedError) return
      setErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar transações.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function handleCreated(created: Transaction) {
    // Prepend the new transaction to the list (201 path).
    setTransactions((prev) => [created, ...prev])
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Transações</h1>
        <button type="button" className="link" onClick={() => void logout()}>
          Sair
        </button>
      </header>

      <TransactionForm onCreated={handleCreated} />

      <section className="transactions">
        {status === 'loading' && <p className="state state-loading">Carregando…</p>}

        {status === 'error' && (
          <div className="state state-error" role="alert">
            <p>{errorMessage}</p>
            <button type="button" onClick={() => void load()}>
              Tentar novamente
            </button>
          </div>
        )}

        {status === 'ready' && transactions.length === 0 && (
          <p className="state state-empty">Nenhuma transação ainda.</p>
        )}

        {status === 'ready' && transactions.length > 0 && (
          <ul className="transaction-list">
            {transactions.map((tx) => (
              <li key={tx.id} className={`transaction transaction-${tx.type}`}>
                <span className="transaction-amount">
                  {/* Cents formatted for display; React escapes all text — free-text
                      description/externalRef are rendered as data, never as HTML. */}
                  {formatCents(tx.amount, tx.currency)}
                </span>
                <span className="transaction-type">
                  {tx.type === 'expense' ? 'Despesa' : 'Receita'}
                </span>
                <span className="transaction-date">{tx.occurredOn}</span>
                {tx.description && (
                  <span className="transaction-description">{tx.description}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
