// Bank accounts screen (web-accounts spec). Overview totals by currency (normal vs.
// investment), an archived filter, the account list, and create/edit/archive. currentBalance
// is shown as-is — derived by the backend, never recomputed. The overview only GROUPS the
// already-derived balances of the full (non-paginated) list; it never mixes currencies.

import { useCallback, useEffect, useState } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { Account, CreateAccountInput, UpdateAccountInput } from '../../api/types'
import { formatCents } from '../../lib/money'
import { AccountForm } from './AccountForm'
import { archiveAccount, createAccount, getAccount, listAccounts, updateAccount } from './api'
import { accountKindLabel } from './taxonomy'

type Status = 'loading' | 'ready' | 'error'
type ArchivedFilter = '' | 'true' | 'false'

interface CurrencyTotals {
  currency: string
  normal: number
  investment: number
}

/** Group the full list by currency, summing backend-derived currentBalance; split investment. */
function computeOverview(accounts: Account[]): CurrencyTotals[] {
  const byCurrency = new Map<string, { normal: number; investment: number }>()
  for (const acc of accounts) {
    const entry = byCurrency.get(acc.currency) ?? { normal: 0, investment: 0 }
    if (acc.kind === 'investment') entry.investment += acc.currentBalance
    else entry.normal += acc.currentBalance
    byCurrency.set(acc.currency, entry)
  }
  return [...byCurrency.entries()]
    .map(([currency, totals]) => ({ currency, ...totals }))
    .sort((a, b) => a.currency.localeCompare(b.currency))
}

export function AccountsScreen() {
  const [status, setStatus] = useState<Status>('loading')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [archivedFilter, setArchivedFilter] = useState<ArchivedFilter>('false')

  // Inline edit: the account being edited (fetched fresh via the detail endpoint).
  const [editing, setEditing] = useState<Account | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async (filter: ArchivedFilter) => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const items = await listAccounts({
        archived: filter === '' ? undefined : filter === 'true',
      })
      setAccounts(items)
      setStatus('ready')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar contas.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load(archivedFilter)
  }, [load, archivedFilter])

  const overview = computeOverview(accounts)

  async function handleCreate(input: CreateAccountInput) {
    const created = await createAccount(input)
    setAccounts((prev) => [created, ...prev])
  }

  // Open edit by fetching the fresh detail (GET /accounts/:id); 404 => not found.
  async function openEdit(id: string) {
    setNotice(null)
    try {
      const fresh = await getAccount(id)
      setEditing(fresh)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      if (err instanceof ApiError && err.isNotFound) {
        setAccounts((prev) => prev.filter((a) => a.id !== id))
        setNotice('Conta não encontrada.')
        return
      }
      setNotice(err instanceof ApiError ? err.message : 'Erro ao abrir a conta.')
    }
  }

  async function handleUpdate(id: string, input: UpdateAccountInput) {
    const updated = await updateAccount(id, input)
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    setEditing(null)
  }

  async function handleArchive(id: string) {
    setNotice(null)
    try {
      const archived = await archiveAccount(id)
      // Respect the current filter: drop it when listing only actives.
      if (archivedFilter === 'false') {
        setAccounts((prev) => prev.filter((a) => a.id !== id))
      } else {
        setAccounts((prev) => prev.map((a) => (a.id === archived.id ? archived : a)))
      }
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      if (err instanceof ApiError && err.isNotFound) {
        setAccounts((prev) => prev.filter((a) => a.id !== id))
        setNotice('Conta não encontrada.')
        return
      }
      setNotice(err instanceof ApiError ? err.message : 'Falha ao arquivar a conta.')
    }
  }

  return (
    <main className="screen">
      <h1>Contas</h1>

      {editing ? (
        <AccountForm
          mode="edit"
          initial={editing}
          onUpdate={(input) => handleUpdate(editing.id, input)}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <AccountForm mode="create" onCreate={handleCreate} />
      )}

      {/* Overview: totals per currency, normal vs. investment. */}
      {status === 'ready' && overview.length > 0 && (
        <section className="card-section">
          <h3>Visão geral</h3>
          <ul className="dash-list">
            {overview.map((row) => (
              <li key={row.currency} className="dash-row">
                <div className="dash-row-main">
                  <span className="dash-row-title">{row.currency}</span>
                  <span className="dash-row-sub">
                    Normais {formatCents(row.normal, row.currency)} · Investimentos{' '}
                    {formatCents(row.investment, row.currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form className="filters">
        <label>
          Situação
          <select
            value={archivedFilter}
            onChange={(e) => setArchivedFilter(e.target.value as ArchivedFilter)}
          >
            <option value="false">Ativas</option>
            <option value="true">Arquivadas</option>
            <option value="">Todas</option>
          </select>
        </label>
      </form>

      {notice && (
        <p className="form-error" role="status">
          {notice}
        </p>
      )}

      <section className="accounts">
        {status === 'loading' && <p className="state state-loading">Carregando…</p>}

        {status === 'error' && (
          <div className="state state-error" role="alert">
            <p>{errorMessage}</p>
            <button type="button" onClick={() => void load(archivedFilter)}>
              Tentar novamente
            </button>
          </div>
        )}

        {status === 'ready' && accounts.length === 0 && (
          <p className="state state-empty">Nenhuma conta ainda.</p>
        )}

        {status === 'ready' && accounts.length > 0 && (
          <ul className="category-list">
            {accounts.map((acc) => (
              <li key={acc.id} className="transaction">
                <div className="dash-row-main">
                  <span className="dash-row-title">
                    {acc.name}{' '}
                    {acc.archived && <span className="badge">arquivada</span>}
                  </span>
                  <span className="dash-row-sub">
                    {accountKindLabel(acc.kind)} · {acc.currency} · inicial{' '}
                    {formatCents(acc.openingBalance, acc.currency)}
                  </span>
                </div>
                <strong className="transaction-amount">
                  {formatCents(acc.currentBalance, acc.currency)}
                </strong>
                <div className="form-actions">
                  <button type="button" className="link" onClick={() => void openEdit(acc.id)}>
                    Editar
                  </button>
                  {!acc.archived && (
                    <button
                      type="button"
                      className="link danger"
                      onClick={() => void handleArchive(acc.id)}
                    >
                      Arquivar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
