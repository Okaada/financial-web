// One investment row that expands inline to reveal actions (web-investments spec,
// design D3): rename, archive, register a contribution and a valuation. After a
// contribution/valuation the investment is re-fetched so aggregates come from the backend
// (design D1 — the front never sums). Valuations recorded this session are listed locally
// (design D2 — there is no history endpoint).

import { useState, type FormEvent } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { Investment, Valuation } from '../../api/types'
import { formatCents, parseToCents } from '../../lib/money'
import {
  addContribution,
  addValuation,
  archiveInvestment,
  getInvestment,
  renameInvestment,
} from './api'
import { investmentTypeLabel } from './taxonomy'

interface InvestmentCardProps {
  investment: Investment
  onChange: (updated: Investment) => void
}

function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function InvestmentCard({ investment, onChange }: InvestmentCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [rowError, setRowError] = useState<string | null>(null)

  // Rename.
  const [renaming, setRenaming] = useState(false)
  const [nameValue, setNameValue] = useState(investment.name ?? '')

  // Contribution form.
  const [contribAmount, setContribAmount] = useState('')
  const [contribDate, setContribDate] = useState(todayISO())
  const [contribNote, setContribNote] = useState('')
  const [contribBusy, setContribBusy] = useState(false)
  const [contribError, setContribError] = useState<string | null>(null)

  // Valuation form.
  const [valValue, setValValue] = useState('')
  const [valDate, setValDate] = useState(todayISO())
  const [valBusy, setValBusy] = useState(false)
  const [valError, setValError] = useState<string | null>(null)

  // Valuations registered this session (no history endpoint — design D2).
  const [sessionValuations, setSessionValuations] = useState<Valuation[]>([])

  async function handleRename() {
    setRowError(null)
    if (nameValue.trim() === '') {
      setRowError('Informe um nome.')
      return
    }
    try {
      const updated = await renameInvestment(investment.id, { name: nameValue.trim() })
      onChange(updated)
      setRenaming(false)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      if (err instanceof ApiError && err.status === 404) setRowError('Investimento não encontrado.')
      else setRowError(err instanceof ApiError ? err.message : 'Falha ao renomear.')
    }
  }

  async function handleArchive() {
    if (!window.confirm(`Arquivar "${investment.name ?? 'investimento'}"?`)) return
    setRowError(null)
    try {
      const updated = await archiveInvestment(investment.id)
      onChange(updated)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      if (err instanceof ApiError && err.status === 404) setRowError('Investimento não encontrado.')
      else setRowError(err instanceof ApiError ? err.message : 'Falha ao arquivar.')
    }
  }

  async function handleContribution(event: FormEvent) {
    event.preventDefault()
    setContribError(null)
    const amount = parseToCents(contribAmount)
    if (amount === null || amount <= 0) {
      setContribError('Valor do aporte deve ser maior que zero.')
      return
    }
    if (contribDate.trim() === '') {
      setContribError('Informe a data do aporte.')
      return
    }
    setContribBusy(true)
    try {
      await addContribution(investment.id, {
        amount,
        occurredOn: contribDate,
        ...(contribNote.trim() !== '' ? { note: contribNote.trim() } : {}),
      })
      // Re-fetch to get the authoritative totalContributed (the front never sums).
      const refreshed = await getInvestment(investment.id)
      onChange(refreshed)
      setContribAmount('')
      setContribNote('')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      // 400 includes "investimento arquivado".
      setContribError(err instanceof ApiError ? err.message : 'Falha ao registrar o aporte.')
    } finally {
      setContribBusy(false)
    }
  }

  async function handleValuation(event: FormEvent) {
    event.preventDefault()
    setValError(null)
    const currentValue = parseToCents(valValue)
    if (currentValue === null) {
      setValError('Valor inválido.')
      return
    }
    if (valDate.trim() === '') {
      setValError('Informe a data da marcação.')
      return
    }
    setValBusy(true)
    try {
      const valuation = await addValuation(investment.id, { currentValue, recordedOn: valDate })
      // Re-fetch to get the authoritative currentValue (latest by recordedOn).
      const refreshed = await getInvestment(investment.id)
      onChange(refreshed)
      setSessionValuations((prev) => [valuation, ...prev])
      setValValue('')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setValError(err instanceof ApiError ? err.message : 'Falha ao registrar o valor.')
    } finally {
      setValBusy(false)
    }
  }

  return (
    <li className="category">
      <span className="category-name">{investment.name ?? '(sem nome)'}</span>
      <span className="category-type">{investmentTypeLabel(investment.type)}</span>
      {investment.archived && <span className="badge">arquivado</span>}

      <span className="invest-figures">
        <span className="invest-figure">
          <small>Aportado</small>
          {formatCents(investment.totalContributed, investment.currency)}
        </span>
        <span className="invest-figure">
          <small>Valor atual</small>
          {investment.currentValue === null
            ? 'sem marcação'
            : formatCents(investment.currentValue, investment.currency)}
        </span>
      </span>

      <span className="category-actions">
        <button type="button" className="link" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Fechar' : 'Detalhes'}
        </button>
      </span>

      {expanded && (
        <div className="invest-detail">
          {rowError && (
            <p className="form-error" role="alert">
              {rowError}
            </p>
          )}

          <div className="invest-detail-actions">
            {renaming ? (
              <>
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  aria-label="Novo nome"
                />
                <button type="button" className="link" onClick={() => void handleRename()}>
                  Salvar
                </button>
                <button type="button" className="link" onClick={() => setRenaming(false)}>
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button type="button" className="link" onClick={() => setRenaming(true)}>
                  Renomear
                </button>
                {!investment.archived && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => void handleArchive()}
                  >
                    Arquivar
                  </button>
                )}
              </>
            )}
          </div>

          {!investment.archived && (
            <>
              <form className="invest-form" onSubmit={handleContribution}>
                <h3>Novo aporte</h3>
                <label>
                  Valor
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="100,00"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    disabled={contribBusy}
                  />
                </label>
                <label>
                  Data
                  <input
                    type="date"
                    value={contribDate}
                    onChange={(e) => setContribDate(e.target.value)}
                    disabled={contribBusy}
                  />
                </label>
                <label>
                  Nota (opcional)
                  <input
                    type="text"
                    value={contribNote}
                    onChange={(e) => setContribNote(e.target.value)}
                    disabled={contribBusy}
                  />
                </label>
                {contribError && (
                  <p className="form-error" role="alert">
                    {contribError}
                  </p>
                )}
                <button type="submit" className="btn btn-primary btn-sm" disabled={contribBusy}>
                  {contribBusy ? 'Salvando…' : 'Registrar aporte'}
                </button>
              </form>

              <form className="invest-form" onSubmit={handleValuation}>
                <h3>Marcar valor atual</h3>
                <label>
                  Valor atual
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="1.050,00"
                    value={valValue}
                    onChange={(e) => setValValue(e.target.value)}
                    disabled={valBusy}
                  />
                </label>
                <label>
                  Data
                  <input
                    type="date"
                    value={valDate}
                    onChange={(e) => setValDate(e.target.value)}
                    disabled={valBusy}
                  />
                </label>
                {valError && (
                  <p className="form-error" role="alert">
                    {valError}
                  </p>
                )}
                <button type="submit" className="btn btn-primary btn-sm" disabled={valBusy}>
                  {valBusy ? 'Salvando…' : 'Marcar valor'}
                </button>
              </form>
            </>
          )}

          {sessionValuations.length > 0 && (
            <div className="invest-evolution">
              <h3>Marcações desta sessão</h3>
              <p className="hint">
                Sem histórico persistente a buscar — apenas o que você registrou agora.
              </p>
              <ul>
                {sessionValuations.map((v) => (
                  <li key={v.id}>
                    {v.recordedOn}: {formatCents(v.currentValue, investment.currency)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
