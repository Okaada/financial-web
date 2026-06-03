// Forecast ("Previstos") screen (web-recurring-occurrences spec). Lists backend-computed
// occurrences for a from/to window (both required) and confirms a competence idempotently.
//
// Occurrences are NOT persisted and have no id of their own: the UI key and the
// "confirming" state use `recurringTemplateId:competence` (design D2).

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { RecurringOccurrence } from '../../api/types'
import { formatCents } from '../../lib/money'
import { confirmOccurrence, listOccurrences } from './api'

type Status = 'idle' | 'loading' | 'ready' | 'error'

const occKey = (o: RecurringOccurrence) => `${o.recurringTemplateId}:${o.competence}`

/** First and last day of the current month as YYYY-MM-DD (local, TZ-safe). */
function currentMonthRange(): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() // 0-based
  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = new Date(y, m + 1, 0).getDate()
  return { from: `${y}-${pad(m + 1)}-01`, to: `${y}-${pad(m + 1)}-${pad(lastDay)}` }
}

export function RecurringOccurrencesScreen() {
  const initialRange = currentMonthRange()
  const [from, setFrom] = useState(initialRange.from)
  const [to, setTo] = useState(initialRange.to)

  const [status, setStatus] = useState<Status>('idle')
  const [occurrences, setOccurrences] = useState<RecurringOccurrence[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<Set<string>>(new Set())

  const load = useCallback(async (f: string, t: string) => {
    setValidationError(null)
    if (f.trim() === '' || t.trim() === '') {
      setValidationError('Informe as datas de início e fim.')
      return
    }
    setStatus('loading')
    setErrorMessage(null)
    setNotice(null)
    try {
      const items = await listOccurrences({ from: f, to: t })
      setOccurrences(items)
      setStatus('ready')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      // 400 (from>to / range too large) and other non-401 errors show the message.
      setErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar previstos.')
      setStatus('error')
    }
  }, [])

  // Initial load for the current month.
  useEffect(() => {
    void load(initialRange.from, initialRange.to)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void load(from, to)
  }

  async function handleConfirm(occ: RecurringOccurrence) {
    const key = occKey(occ)
    setNotice(null)
    setConfirming((prev) => new Set(prev).add(key))
    try {
      // Idempotent: 201 the first time, 200 (same transaction) afterwards — both return
      // the transaction, so we treat them identically.
      const transaction = await confirmOccurrence(occ.recurringTemplateId, {
        competence: occ.competence,
      })
      setOccurrences((prev) =>
        prev.map((o) =>
          occKey(o) === key ? { ...o, confirmed: true, transactionId: transaction.id } : o,
        ),
      )
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setNotice(err instanceof ApiError ? err.message : 'Falha ao confirmar. Tente novamente.')
    } finally {
      setConfirming((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  return (
    <main className="screen">
      <h1>Previstos</h1>

      <form className="filters" onSubmit={handleSubmit}>
        <label>
          De
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
        </label>
        <label>
          Até
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} required />
        </label>
        <div className="form-actions">
          <button type="submit">Listar</button>
        </div>
      </form>

      {validationError && (
        <p className="form-error" role="alert">
          {validationError}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}

      <section className="occurrences">
        {status === 'loading' && <p className="state state-loading">Carregando…</p>}

        {status === 'error' && (
          <div className="state state-error" role="alert">
            <p>{errorMessage}</p>
            <button type="button" onClick={() => void load(from, to)}>
              Tentar novamente
            </button>
          </div>
        )}

        {status === 'ready' && occurrences.length === 0 && (
          <p className="state state-empty">Nada previsto no período.</p>
        )}

        {status === 'ready' && occurrences.length > 0 && (
          <ul className="category-list">
            {occurrences.map((o) => {
              const key = occKey(o)
              const isConfirming = confirming.has(key)
              return (
                <li key={key} className={`category transaction-${o.type}`}>
                  <span className="transaction-amount">{formatCents(o.amount, o.currency)}</span>
                  <span className="transaction-type">
                    {o.type === 'expense' ? 'Despesa' : 'Receita'}
                  </span>
                  <span className="transaction-date">
                    {o.date} · {o.competence}
                  </span>
                  <span className="category-actions">
                    {o.confirmed ? (
                      <span className="badge">
                        confirmado{o.transactionId ? ` · ${o.transactionId.slice(0, 8)}` : ''}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => void handleConfirm(o)}
                        disabled={isConfirming}
                      >
                        {isConfirming ? 'Confirmando…' : 'Confirmar'}
                      </button>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
