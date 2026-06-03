// Investments screen (web-investments spec). Explicit UI states: loading, empty, error
// (non-401, retry), no-session. Lists investments with backend aggregates, creates new
// ones, and delegates per-item actions (rename/archive/contribution/valuation) to
// InvestmentCard.

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { Investment, InvestmentType } from '../../api/types'
import { createInvestment, listInvestments } from './api'
import { InvestmentCard } from './InvestmentCard'
import { INVESTMENT_TYPES } from './taxonomy'

type Status = 'loading' | 'ready' | 'error'
type ArchivedFilter = '' | 'true' | 'false'

const DEFAULT_CURRENCY = 'BRL'

export function InvestmentsScreen() {
  const [status, setStatus] = useState<Status>('loading')
  const [investments, setInvestments] = useState<Investment[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [archivedFilter, setArchivedFilter] = useState<ArchivedFilter>('')

  // Create form.
  const [newType, setNewType] = useState<InvestmentType>('renda_fixa')
  const [newCurrency, setNewCurrency] = useState(DEFAULT_CURRENCY)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const load = useCallback(async (filter: ArchivedFilter) => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const items = await listInvestments({
        archived: filter === '' ? undefined : filter === 'true',
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
    void load(archivedFilter)
  }, [load, archivedFilter])

  function handleChanged(updated: Investment) {
    setInvestments((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      const created = await createInvestment({
        type: newType,
        currency: newCurrency,
        ...(newName.trim() !== '' ? { name: newName.trim() } : {}),
      })
      setInvestments((prev) => [created, ...prev])
      setNewName('')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setCreateError(err instanceof ApiError ? err.message : 'Falha ao criar o investimento.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="screen">
      <h1>Investimentos</h1>

      <form className="transaction-form" onSubmit={handleCreate}>
        <h2>Novo investimento</h2>
        <label>
          Tipo
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as InvestmentType)}
            disabled={creating}
          >
            {INVESTMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Moeda
          <input
            type="text"
            value={newCurrency}
            onChange={(e) => setNewCurrency(e.target.value.toUpperCase())}
            disabled={creating}
            maxLength={3}
          />
        </label>
        <label>
          Nome (opcional)
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={creating}
          />
        </label>
        {createError && (
          <p className="form-error" role="alert">
            {createError}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" disabled={creating}>
            {creating ? 'Salvando…' : 'Adicionar'}
          </button>
        </div>
      </form>

      <form className="filters">
        <label>
          Situação
          <select
            value={archivedFilter}
            onChange={(e) => setArchivedFilter(e.target.value as ArchivedFilter)}
          >
            <option value="">Todos</option>
            <option value="false">Ativos</option>
            <option value="true">Arquivados</option>
          </select>
        </label>
      </form>

      <section className="investments">
        {status === 'loading' && <p className="state state-loading">Carregando…</p>}

        {status === 'error' && (
          <div className="state state-error" role="alert">
            <p>{errorMessage}</p>
            <button type="button" onClick={() => void load(archivedFilter)}>
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
