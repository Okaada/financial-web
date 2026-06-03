// Card detail (web-cards + web-invoices). Shows the card with rename/archive, mileage
// rates (append-only), accumulated miles, and the card's invoices; selecting an invoice
// opens InvoiceDetail. closingDay is read-only on edit (immutable — design D2). Miles are
// re-fetched after an invoice changes (paying changes totalMiles).

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { Card, CardMiles, Invoice, MileageRate } from '../../api/types'
import { formatCents } from '../../lib/money'
import { formatMiles, formatRate, parseRate } from '../../lib/number'
import { addRate, archiveCard, getMiles, listInvoices, listRates, updateCard } from './api'
import { InvoiceDetail } from './InvoiceDetail'
import { INVOICE_STATUS_LABEL } from './labels'

interface CardDetailProps {
  card: Card
  onChanged: (card: Card) => void
  onBack: () => void
}

function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function CardDetail({ card, onChanged, onBack }: CardDetailProps) {
  // Card edit.
  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(card.name ?? '')
  const [dueDayValue, setDueDayValue] = useState(String(card.dueDay))
  const [cardError, setCardError] = useState<string | null>(null)

  // Loaded sub-resources.
  const [rates, setRates] = useState<MileageRate[]>([])
  const [miles, setMiles] = useState<CardMiles | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Rate form.
  const [rateValue, setRateValue] = useState('')
  const [rateDate, setRateDate] = useState(todayISO())
  const [rateBusy, setRateBusy] = useState(false)
  const [rateError, setRateError] = useState<string | null>(null)

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [r, m, inv] = await Promise.all([
        listRates(card.id),
        getMiles(card.id),
        listInvoices(card.id),
      ])
      setRates(r)
      setMiles(m)
      setInvoices(inv)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar o cartão.')
    } finally {
      setLoading(false)
    }
  }, [card.id])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSaveEdit() {
    setCardError(null)
    const dueDay = Number(dueDayValue)
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      setCardError('Dia de vencimento deve ser um inteiro entre 1 e 31.')
      return
    }
    try {
      // closingDay is immutable — never sent.
      const updated = await updateCard(card.id, { name: nameValue.trim() || undefined, dueDay })
      onChanged(updated)
      setEditing(false)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      if (err instanceof ApiError && err.status === 404) setCardError('Cartão não encontrado.')
      else setCardError(err instanceof ApiError ? err.message : 'Falha ao salvar.')
    }
  }

  async function handleArchive() {
    if (!window.confirm(`Arquivar "${card.name ?? 'cartão'}"?`)) return
    setCardError(null)
    try {
      const updated = await archiveCard(card.id)
      onChanged(updated)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setCardError(err instanceof ApiError ? err.message : 'Falha ao arquivar.')
    }
  }

  async function handleAddRate(event: FormEvent) {
    event.preventDefault()
    setRateError(null)
    const milesPerUnit = parseRate(rateValue)
    if (milesPerUnit === null) {
      setRateError('Taxa inválida (use um número ≥ 0, ex.: 1,5).')
      return
    }
    if (rateDate.trim() === '') {
      setRateError('Informe a data de vigência.')
      return
    }
    setRateBusy(true)
    try {
      const created = await addRate(card.id, { milesPerUnit, effectiveFrom: rateDate })
      setRates((prev) => [created, ...prev])
      setRateValue('')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      // 400 includes "cartão arquivado".
      setRateError(err instanceof ApiError ? err.message : 'Falha ao registrar a taxa.')
    } finally {
      setRateBusy(false)
    }
  }

  async function handleInvoiceChanged(updated: Invoice) {
    setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    // Paying changes accumulated miles — refresh.
    try {
      setMiles(await getMiles(card.id))
    } catch {
      /* non-fatal; keep the previous value */
    }
  }

  if (selectedInvoiceId) {
    return (
      <InvoiceDetail
        invoiceId={selectedInvoiceId}
        onChanged={(inv) => void handleInvoiceChanged(inv)}
        onBack={() => setSelectedInvoiceId(null)}
      />
    )
  }

  return (
    <div className="card-detail">
      <button type="button" className="link" onClick={onBack}>
        ← Voltar aos cartões
      </button>

      <header className="invoice-head">
        <h2>{card.name ?? '(sem nome)'}</h2>
        {card.archived && <span className="badge">arquivado</span>}
      </header>

      {cardError && (
        <p className="form-error" role="alert">
          {cardError}
        </p>
      )}

      {editing ? (
        <div className="invest-form">
          <label>
            Nome
            <input type="text" value={nameValue} onChange={(e) => setNameValue(e.target.value)} />
          </label>
          <label>
            Dia de fechamento (imutável)
            <input type="number" value={card.closingDay} readOnly disabled />
          </label>
          <label>
            Dia de vencimento
            <input
              type="number"
              min={1}
              max={31}
              value={dueDayValue}
              onChange={(e) => setDueDayValue(e.target.value)}
            />
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void handleSaveEdit()}>
              Salvar
            </button>
            <button type="button" className="link" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="invest-detail-actions">
          <span className="category-type">
            Fecha dia {card.closingDay} · vence dia {card.dueDay} · {card.currency}
          </span>
          <button type="button" className="link" onClick={() => setEditing(true)}>
            Editar
          </button>
          {!card.archived && (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => void handleArchive()}>
              Arquivar
            </button>
          )}
        </div>
      )}

      {loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}
      {loading && <p className="state state-loading">Carregando…</p>}

      {!loading && (
        <>
          <section className="card-section">
            <h3>Milhas acumuladas</h3>
            <p className="invest-figure">{miles ? formatMiles(miles.totalMiles) : '—'}</p>
          </section>

          <section className="card-section">
            <h3>Taxas de milhas</h3>
            {!card.archived && (
              <form className="invest-form" onSubmit={handleAddRate}>
                <label>
                  Milhas por unidade
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="1,5"
                    value={rateValue}
                    onChange={(e) => setRateValue(e.target.value)}
                    disabled={rateBusy}
                  />
                </label>
                <label>
                  Vigente a partir de
                  <input
                    type="date"
                    value={rateDate}
                    onChange={(e) => setRateDate(e.target.value)}
                    disabled={rateBusy}
                  />
                </label>
                {rateError && (
                  <p className="form-error" role="alert">
                    {rateError}
                  </p>
                )}
                <button type="submit" className="btn btn-primary btn-sm" disabled={rateBusy}>
                  {rateBusy ? 'Salvando…' : 'Registrar taxa'}
                </button>
              </form>
            )}
            {rates.length === 0 ? (
              <p className="hint">Nenhuma taxa registrada.</p>
            ) : (
              <ul className="rate-list">
                {rates.map((r) => (
                  <li key={r.id}>
                    {formatRate(r.milesPerUnit)} milhas/un · desde {r.effectiveFrom}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card-section">
            <h3>Faturas</h3>
            {invoices.length === 0 ? (
              <p className="state state-empty">Nenhuma fatura ainda.</p>
            ) : (
              <ul className="category-list">
                {invoices.map((inv) => (
                  <li key={inv.id} className="category">
                    <span className="category-name">{inv.periodKey}</span>
                    <span className={`badge status-${inv.status}`}>
                      {INVOICE_STATUS_LABEL[inv.status]}
                    </span>
                    <span className="transaction-amount">{formatCents(inv.total, 'BRL')}</span>
                    <span className="category-type">{formatMiles(inv.miles)}</span>
                    <span className="category-actions">
                      <button
                        type="button"
                        className="link"
                        onClick={() => setSelectedInvoiceId(inv.id)}
                      >
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
    </div>
  )
}
