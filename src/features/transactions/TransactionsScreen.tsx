// Transactions screen (web-transactions spec). Explicit UI states: loading, empty,
// error (non-401, with retry), and no-session. Supports edit, delete (with confirm) and
// list filters.
//
// This screen's initial load doubles as the app's auth gate (design.md D4): there is no
// `whoami` endpoint, so loading GET /api/transactions IS the session probe — a 401 is
// handled centrally by the HTTP client (redirect to login).

import { useCallback, useEffect, useState } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { Category, Transaction, TransactionFilters, TransactionType } from '../../api/types'
import { formatCents } from '../../lib/money'
import { listCategories } from '../categories/api'
import { deleteTransaction, listTransactions } from './api'
import { TransactionForm } from './TransactionForm'

type Status = 'loading' | 'ready' | 'error'

interface FilterState {
  type: '' | TransactionType
  categoryId: string
  from: string
  to: string
}

const EMPTY_FILTERS: FilterState = { type: '', categoryId: '', from: '', to: '' }

/** Map the form's filter state to API filters, omitting empty values. */
function toApiFilters(f: FilterState): TransactionFilters {
  return {
    type: f.type || undefined,
    categoryId: f.categoryId || undefined,
    from: f.from || undefined,
    to: f.to || undefined,
  }
}

export function TransactionsScreen() {
  const [status, setStatus] = useState<Status>('loading')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [editing, setEditing] = useState<Transaction | null>(null)

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [applied, setApplied] = useState(false)
  // Categories for the filter dropdown (all non-archived types).
  const [filterCategories, setFilterCategories] = useState<Category[]>([])

  const load = useCallback(async (f: FilterState) => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const items = await listTransactions(toApiFilters(f))
      setTransactions(items)
      setStatus('ready')
    } catch (err) {
      // 401 -> the client already redirected to login; stay in loading (no-session).
      if (err instanceof UnauthenticatedError) return
      setErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar transações.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load(EMPTY_FILTERS)
  }, [load])

  // Load categories once for the filter selector (best-effort; failure just hides it).
  useEffect(() => {
    let active = true
    listCategories({ archived: false })
      .then((items) => {
        if (active) setFilterCategories(items)
      })
      .catch(() => {
        /* 401 handled centrally; other errors leave the dropdown empty. */
      })
    return () => {
      active = false
    }
  }, [])

  function handleSaved(saved: Transaction) {
    setNotice(null)
    setTransactions((prev) => {
      const exists = prev.some((tx) => tx.id === saved.id)
      return exists ? prev.map((tx) => (tx.id === saved.id ? saved : tx)) : [saved, ...prev]
    })
    setEditing(null)
  }

  async function handleDelete(tx: Transaction) {
    if (!window.confirm('Excluir esta transação? Esta ação não pode ser desfeita.')) return
    setNotice(null)
    try {
      await deleteTransaction(tx.id)
      setTransactions((prev) => prev.filter((t) => t.id !== tx.id))
      if (editing?.id === tx.id) setEditing(null)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      if (err instanceof ApiError && err.status === 404) {
        // Not found / already gone — drop it from the list and inform.
        setTransactions((prev) => prev.filter((t) => t.id !== tx.id))
        setNotice('Transação não encontrada (já removida).')
      } else {
        setNotice(err instanceof ApiError ? err.message : 'Falha ao excluir. Tente novamente.')
      }
    }
  }

  function applyFilters() {
    setApplied(true)
    void load(filters)
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setApplied(false)
    void load(EMPTY_FILTERS)
  }

  return (
    <main className="screen">
      <h1>Transações</h1>

      {editing ? (
        <TransactionForm
          initial={editing}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <TransactionForm onSaved={handleSaved} />
      )}

      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault()
          applyFilters()
        }}
      >
        <label>
          Tipo
          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as FilterState['type'] }))}
          >
            <option value="">Todos</option>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </label>

        <label>
          Categoria
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
          >
            <option value="">Todas</option>
            {filterCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          De
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          />
        </label>

        <label>
          Até
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          />
        </label>

        <div className="form-actions">
          <button type="submit">Filtrar</button>
          <button type="button" className="link" onClick={clearFilters}>
            Limpar
          </button>
        </div>
      </form>

      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}

      <section className="transactions">
        {status === 'loading' && <p className="state state-loading">Carregando…</p>}

        {status === 'error' && (
          <div className="state state-error" role="alert">
            <p>{errorMessage}</p>
            <button type="button" onClick={() => void load(filters)}>
              Tentar novamente
            </button>
          </div>
        )}

        {status === 'ready' && transactions.length === 0 && (
          <p className="state state-empty">
            {applied ? 'Nenhuma transação para o filtro.' : 'Nenhuma transação ainda.'}
          </p>
        )}

        {status === 'ready' && transactions.length > 0 && (
          <ul className="transaction-list">
            {transactions.map((tx) => (
              <li key={tx.id} className={`transaction transaction-${tx.type}`}>
                <span className="transaction-amount">
                  {/* Cents formatted for display; React escapes all text — free-text
                      description is rendered as data, never as HTML. */}
                  {formatCents(tx.amount, tx.currency)}
                </span>
                <span className="transaction-type">
                  {tx.type === 'expense' ? 'Despesa' : 'Receita'}
                </span>
                <span className="transaction-date">{tx.occurredOn}</span>
                {tx.description && (
                  <span className="transaction-description">{tx.description}</span>
                )}
                <span className="transaction-actions">
                  <button type="button" className="link" onClick={() => setEditing(tx)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => void handleDelete(tx)}
                  >
                    Excluir
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
