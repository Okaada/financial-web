// Cards screen (web-cards spec). Lists cards with an archived filter, creates new ones,
// and drills down into a card (CardDetail: rates, miles, invoices). Explicit UI states:
// loading, empty, error, no-session. Navigation is local state, no router (design D4).

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { Card } from '../../api/types'
import { createCard, listCards } from './api'
import { CardDetail } from './CardDetail'

type Status = 'loading' | 'ready' | 'error'
type ArchivedFilter = '' | 'true' | 'false'

const DEFAULT_CURRENCY = 'BRL'

export function CardsScreen() {
  const [status, setStatus] = useState<Status>('loading')
  const [cards, setCards] = useState<Card[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [archivedFilter, setArchivedFilter] = useState<ArchivedFilter>('')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  // Create form.
  const [newName, setNewName] = useState('')
  const [newClosingDay, setNewClosingDay] = useState('1')
  const [newDueDay, setNewDueDay] = useState('10')
  const [newCurrency, setNewCurrency] = useState(DEFAULT_CURRENCY)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const load = useCallback(async (filter: ArchivedFilter) => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const items = await listCards({
        archived: filter === '' ? undefined : filter === 'true',
      })
      setCards(items)
      setStatus('ready')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar cartões.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load(archivedFilter)
  }, [load, archivedFilter])

  function handleCardChanged(updated: Card) {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setCreateError(null)
    const closingDay = Number(newClosingDay)
    const dueDay = Number(newDueDay)
    if (![closingDay, dueDay].every((d) => Number.isInteger(d) && d >= 1 && d <= 31)) {
      setCreateError('Dias de fechamento e vencimento devem ser inteiros entre 1 e 31.')
      return
    }
    setCreating(true)
    try {
      const created = await createCard({
        closingDay,
        dueDay,
        currency: newCurrency,
        ...(newName.trim() !== '' ? { name: newName.trim() } : {}),
      })
      setCards((prev) => [created, ...prev])
      setNewName('')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setCreateError(err instanceof ApiError ? err.message : 'Falha ao criar o cartão.')
    } finally {
      setCreating(false)
    }
  }

  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? null

  return (
    <main className="screen">
      <h1>Cartões</h1>

      {selectedCard ? (
        <CardDetail
          card={selectedCard}
          onChanged={handleCardChanged}
          onBack={() => setSelectedCardId(null)}
        />
      ) : (
        <>
          <form className="transaction-form" onSubmit={handleCreate}>
            <h2>Novo cartão</h2>
            <label>
              Nome (opcional)
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={creating}
              />
            </label>
            <label>
              Dia de fechamento
              <input
                type="number"
                min={1}
                max={31}
                value={newClosingDay}
                onChange={(e) => setNewClosingDay(e.target.value)}
                disabled={creating}
              />
            </label>
            <label>
              Dia de vencimento
              <input
                type="number"
                min={1}
                max={31}
                value={newDueDay}
                onChange={(e) => setNewDueDay(e.target.value)}
                disabled={creating}
              />
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

          <section className="cards">
            {status === 'loading' && <p className="state state-loading">Carregando…</p>}

            {status === 'error' && (
              <div className="state state-error" role="alert">
                <p>{errorMessage}</p>
                <button type="button" onClick={() => void load(archivedFilter)}>
                  Tentar novamente
                </button>
              </div>
            )}

            {status === 'ready' && cards.length === 0 && (
              <p className="state state-empty">Nenhum cartão.</p>
            )}

            {status === 'ready' && cards.length > 0 && (
              <ul className="category-list">
                {cards.map((c) => (
                  <li key={c.id} className="category">
                    <span className="category-name">{c.name ?? '(sem nome)'}</span>
                    <span className="category-type">
                      fecha {c.closingDay} · vence {c.dueDay} · {c.currency}
                    </span>
                    {c.archived && <span className="badge">arquivado</span>}
                    <span className="category-actions">
                      <button type="button" className="link" onClick={() => setSelectedCardId(c.id)}>
                        Abrir
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  )
}
