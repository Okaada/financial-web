// Invoice detail (web-invoices spec). Loads GET /api/invoices/:id (the only shape that
// includes the composing transactions) and drives the state machine open → closed → paid.
// The UI never creates/reopens invoices; on a 400 (invalid transition, e.g. the backend
// auto-reopened it) it shows the message and re-fetches to re-sync (design D3/D5).

import { useCallback, useEffect, useState } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { Invoice, InvoiceDetail as InvoiceDetailType } from '../../api/types'
import { formatCents } from '../../lib/money'
import { formatMiles } from '../../lib/number'
import { closeInvoice, getInvoice, payInvoice } from './api'
import { INVOICE_STATUS_LABEL } from './labels'

interface InvoiceDetailProps {
  invoiceId: string
  onChanged: (invoice: Invoice) => void
  onBack: () => void
}

type Status = 'loading' | 'ready' | 'error'

export function InvoiceDetail({ invoiceId, onChanged, onBack }: InvoiceDetailProps) {
  const [status, setStatus] = useState<Status>('loading')
  const [detail, setDetail] = useState<InvoiceDetailType | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const data = await getInvoice(invoiceId)
      setDetail(data)
      setStatus('ready')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar a fatura.')
      setStatus('error')
    }
  }, [invoiceId])

  useEffect(() => {
    void load()
  }, [load])

  async function transition(action: 'close' | 'pay') {
    setActionError(null)
    setBusy(true)
    try {
      const updated = action === 'close' ? await closeInvoice(invoiceId) : await payInvoice(invoiceId)
      // Keep the loaded transactions; merge the new status/fields from the response.
      setDetail((prev) => (prev ? { ...prev, ...updated } : prev))
      onChanged(updated)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setActionError(err instanceof ApiError ? err.message : 'Falha na ação. Tente novamente.')
      // Invalid transition (e.g. auto-reopened) — re-sync the invoice from the backend.
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="invoice-detail">
      <button type="button" className="link" onClick={onBack}>
        ← Voltar às faturas
      </button>

      {status === 'loading' && <p className="state state-loading">Carregando…</p>}

      {status === 'error' && (
        <div className="state state-error" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={() => void load()}>
            Tentar novamente
          </button>
        </div>
      )}

      {status === 'ready' && detail && (
        <>
          <header className="invoice-head">
            <h2>Fatura {detail.periodKey}</h2>
            <span className={`badge status-${detail.status}`}>
              {INVOICE_STATUS_LABEL[detail.status]}
            </span>
          </header>

          <dl className="invoice-meta">
            <div>
              <dt>Período</dt>
              <dd>
                {detail.periodStart} → {detail.closingDate}
              </dd>
            </div>
            <div>
              <dt>Vencimento</dt>
              <dd>{detail.dueDate}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd className="transaction-amount">{formatCents(detail.total, 'BRL')}</dd>
            </div>
            <div>
              <dt>Milhas</dt>
              <dd>{formatMiles(detail.miles)}</dd>
            </div>
          </dl>

          {actionError && (
            <p className="form-error" role="alert">
              {actionError}
            </p>
          )}

          <div className="form-actions">
            {detail.status === 'open' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void transition('close')}
                disabled={busy}
              >
                {busy ? '…' : 'Fechar fatura'}
              </button>
            )}
            {detail.status === 'closed' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void transition('pay')}
                disabled={busy}
              >
                {busy ? '…' : 'Marcar como paga'}
              </button>
            )}
          </div>

          <h3>Transações</h3>
          {detail.transactions.length === 0 ? (
            <p className="state state-empty">Nenhuma transação nesta fatura.</p>
          ) : (
            <ul className="transaction-list">
              {detail.transactions.map((tx) => (
                <li key={tx.id} className={`transaction transaction-${tx.type}`}>
                  <span className="transaction-amount">{formatCents(tx.amount, tx.currency)}</span>
                  <span className="transaction-date">{tx.occurredOn}</span>
                  {tx.description && (
                    <span className="transaction-description">{tx.description}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
