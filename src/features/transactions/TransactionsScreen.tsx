// Transactions screen (web-transactions spec). Explicit UI states: loading, empty,
// error (non-401, with retry), and no-session. Supports edit, delete (with confirm) and
// list filters.
//
// This screen's initial load doubles as the app's auth gate (design.md D4): there is no
// `whoami` endpoint, so loading GET /api/transactions IS the session probe — a 401 is
// handled centrally by the HTTP client (redirect to login).

import { useCallback, useEffect, useState } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type {
  Account,
  Category,
  Transaction,
  TransactionFilters,
  TransactionType,
} from '../../api/types'
import { formatCents } from '../../lib/money'
import { getAccount, listAccounts } from '../accounts/api'
import { listCategories } from '../categories/api'
import { deleteTransaction, listTransactions } from './api'
import { BatchEntryScreen } from './BatchEntryScreen'
import { TransactionForm } from './TransactionForm'

type Status = 'loading' | 'ready' | 'error'

interface FilterState {
  type: '' | TransactionType
  categoryId: string
  accountId: string
  from: string
  to: string
}

const EMPTY_FILTERS: FilterState = { type: '', categoryId: '', accountId: '', from: '', to: '' }

/** Map the form's filter state to API filters, omitting empty values. */
function toApiFilters(f: FilterState): TransactionFilters {
  return {
    type: f.type || undefined,
    categoryId: f.categoryId || undefined,
    accountId: f.accountId || undefined,
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
  // Accounts for the filter dropdown (non-archived).
  const [filterAccounts, setFilterAccounts] = useState<Account[]>([])
  // The account whose balance is shown when filtering by accountId (per-account view).
  const [accountView, setAccountView] = useState<Account | null>(null)

  const [showBatch, setShowBatch] = useState(false)

  const load = useCallback(async (f: FilterState) => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const items = await listTransactions(toApiFilters(f))
      setTransactions(items)
      // Per-account view: show the account's backend-derived balance alongside its list.
      if (f.accountId) {
        const account = await getAccount(f.accountId).catch((e) => {
          if (e instanceof ApiError && e.isNotFound) return null
          throw e
        })
        setAccountView(account)
      } else {
        setAccountView(null)
      }
      setStatus('ready')
    } catch (err) {
      // 401 -> the client already redirected to login; stay in loading (no-session).
      if (err instanceof UnauthenticatedError) return
      setErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar transações.')
      setStatus('error')
    }
  }, [])

  // Re-fetch affected accounts after a mutation and reflect the new (backend-derived) balance.
  const refreshAccounts = useCallback(async (ids: (string | null)[]) => {
    const unique = [...new Set(ids.filter((id): id is string => !!id))]
    for (const id of unique) {
      try {
        const account = await getAccount(id)
        setAccountView((prev) => (prev && prev.id === id ? account : prev))
        setNotice(`Saldo de ${account.name}: ${formatCents(account.currentBalance, account.currency)}`)
      } catch {
        /* 404/transient — ignore; the balance just won't refresh. */
      }
    }
  }, [])

  useEffect(() => {
    void load(EMPTY_FILTERS)
  }, [load])

  // Load categories + accounts once for the filter selectors (best-effort; failure hides them).
  useEffect(() => {
    let active = true
    listCategories({ archived: false })
      .then((items) => {
        if (active) setFilterCategories(items)
      })
      .catch(() => {
        /* 401 handled centrally; other errors leave the dropdown empty. */
      })
    listAccounts({ archived: false })
      .then((items) => {
        if (active) setFilterAccounts(items)
      })
      .catch(() => {
        /* best-effort */
      })
    return () => {
      active = false
    }
  }, [])

  function handleSaved(saved: Transaction) {
    setNotice(null)
    // The accounts affected by this save: the new one and (on edit) the previous one.
    const affected = [saved.accountId, editing?.accountId ?? null]
    setTransactions((prev) => {
      const exists = prev.some((tx) => tx.id === saved.id)
      return exists ? prev.map((tx) => (tx.id === saved.id ? saved : tx)) : [saved, ...prev]
    })
    setEditing(null)
    void refreshAccounts(affected)
  }

  async function handleDelete(tx: Transaction) {
    if (!window.confirm('Excluir esta transação? Esta ação não pode ser desfeita.')) return
    setNotice(null)
    try {
      await deleteTransaction(tx.id)
      setTransactions((prev) => prev.filter((t) => t.id !== tx.id))
      if (editing?.id === tx.id) setEditing(null)
      void refreshAccounts([tx.accountId])
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

  if (showBatch) {
    return (
      <BatchEntryScreen
        onBack={() => setShowBatch(false)}
        onCreated={() => void load(filters)}
      />
    )
  }

  return (
    <main className="screen">
      <div className="batch-head">
        <h1>Transações</h1>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowBatch(true)}>
          Lançar em lote
        </button>
      </div>

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
          Conta
          <select
            value={filters.accountId}
            onChange={(e) => setFilters((f) => ({ ...f, accountId: e.target.value }))}
          >
            <option value="">Todas</option>
            {filterAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
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

      {accountView && (
        <section className="card-section account-balance" aria-live="polite">
          <h3>{accountView.name}</h3>
          <p className="dash-row-amount">
            Saldo atual: {formatCents(accountView.currentBalance, accountView.currency)}
          </p>
        </section>
      )}

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
