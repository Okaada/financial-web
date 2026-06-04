// Batch creation grid for investments (web-investments-batch). Add rows, pick the investment
// account per row, validate locally, then POST /api/investments/batch. All-or-nothing: a 400
// rejects the whole batch (nothing written) and ApiError.index points at the bad row.

import { useRef, useState } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { CreateInvestmentInput, Investment, InvestmentType } from '../../api/types'
import { parseToCentsSigned } from '../../lib/money'
import { AccountSelect } from '../accounts/AccountSelect'
import { createBatch } from './api'
import { INVESTMENT_TYPES } from './taxonomy'

const MAX_ITEMS = 100
const DEFAULT_CURRENCY = 'BRL'

interface Row {
  key: number
  name: string
  type: InvestmentType
  currency: string
  initialValue: string
  accountId: string
}

interface InvestmentBatchScreenProps {
  onBack: () => void
  onCreated: (created: Investment[]) => void
}

function emptyRow(key: number): Row {
  return { key, name: '', type: 'renda_fixa', currency: DEFAULT_CURRENCY, initialValue: '', accountId: '' }
}

/** Build the API item for a row, or null when locally invalid. */
function toItem(row: Row): CreateInvestmentInput | null {
  if (row.name.trim() === '' || row.currency.trim() === '') return null
  const initial = parseToCentsSigned(row.initialValue)
  if (initial === null) return null
  const item: CreateInvestmentInput = {
    name: row.name.trim(),
    type: row.type,
    currency: row.currency.trim(),
    initialValue: initial,
  }
  if (row.accountId !== '') item.accountId = row.accountId
  return item
}

export function InvestmentBatchScreen({ onBack, onCreated }: InvestmentBatchScreenProps) {
  const nextKey = useRef(1)
  const [rows, setRows] = useState<Row[]>(() => [emptyRow(0), emptyRow(-1), emptyRow(-2)])
  const [submitting, setSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [rowError, setRowError] = useState<{ index: number; message: string } | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }
  function addRow() {
    setRows((prev) => [...prev, emptyRow(nextKey.current++)])
  }
  function removeRow(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  const filledRows = rows.filter((r) => r.name.trim() !== '' || r.initialValue.trim() !== '')
  const items = filledRows.map(toItem)
  const hasInvalid = items.some((it) => it === null)
  const canSubmit = !submitting && filledRows.length > 0 && filledRows.length <= MAX_ITEMS && !hasInvalid

  async function handleSubmit() {
    setGeneralError(null)
    setRowError(null)
    setSuccess(null)
    if (filledRows.length === 0) {
      setGeneralError('Adicione ao menos uma linha.')
      return
    }
    if (filledRows.length > MAX_ITEMS) {
      setGeneralError(`Máximo de ${MAX_ITEMS} itens por lote.`)
      return
    }
    const payload = items.filter((it): it is CreateInvestmentInput => it !== null)
    if (payload.length !== filledRows.length) {
      setGeneralError('Há linhas inválidas (nome/moeda/valor). Corrija antes de enviar.')
      return
    }
    setSubmitting(true)
    try {
      const created = await createBatch(payload)
      setSuccess(`${created.length} investimento(s) criados.`)
      setRows([emptyRow(nextKey.current++), emptyRow(nextKey.current++), emptyRow(nextKey.current++)])
      onCreated(created)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      if (err instanceof ApiError && err.status === 400) {
        if (typeof err.index === 'number') {
          setRowError({ index: err.index, message: err.message })
          setGeneralError(`Nenhum item foi gravado. Linha ${err.index + 1}: ${err.message}`)
        } else {
          setGeneralError(err.message)
        }
      } else {
        setGeneralError(err instanceof ApiError ? err.message : 'Falha ao enviar o lote.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="screen">
      <div className="batch-head">
        <h1>Criar investimentos em lote</h1>
        <button type="button" className="link" onClick={onBack}>
          ← Voltar
        </button>
      </div>

      <p className="account-hint">
        Tudo-ou-nada: se um item for inválido, nenhum é gravado. Máx {MAX_ITEMS}. Valor inicial
        em centavos (pode ser negativo).
      </p>

      <ul className="batch-grid">
        {rows.map((row) => {
          const filledIndex = filledRows.indexOf(row)
          const highlighted = rowError !== null && filledIndex === rowError.index
          const localInvalid = filledRows.includes(row) && toItem(row) === null
          return (
            <li key={row.key} className={highlighted ? 'batch-row batch-row-error' : 'batch-row'}>
              <label className="batch-cell">
                Nome
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => updateRow(row.key, { name: e.target.value })}
                  disabled={submitting}
                />
              </label>
              <label className="batch-cell">
                Tipo
                <select
                  value={row.type}
                  onChange={(e) => updateRow(row.key, { type: e.target.value as InvestmentType })}
                  disabled={submitting}
                >
                  {INVESTMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="batch-cell batch-cell-sm">
                Moeda
                <input
                  type="text"
                  value={row.currency}
                  maxLength={3}
                  onChange={(e) => updateRow(row.key, { currency: e.target.value.toUpperCase() })}
                  disabled={submitting}
                />
              </label>
              <label className="batch-cell">
                Valor inicial
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={row.initialValue}
                  onChange={(e) => updateRow(row.key, { initialValue: e.target.value })}
                  disabled={submitting}
                />
              </label>
              <div className="batch-cell">
                <AccountSelect
                  value={row.accountId}
                  onChange={(v) => updateRow(row.key, { accountId: v })}
                  disabled={submitting}
                  hideLabel
                  kind="investment"
                />
              </div>
              <button
                type="button"
                className="link danger batch-remove"
                onClick={() => removeRow(row.key)}
                disabled={submitting}
                aria-label="Remover linha"
              >
                ✕
              </button>
              {highlighted && <span className="field-error">{rowError?.message}</span>}
              {!highlighted && localInvalid && <span className="field-error">Nome/moeda/valor inválidos.</span>}
            </li>
          )
        })}
      </ul>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={addRow} disabled={submitting}>
          + Linha
        </button>
        <span className="account-hint">
          {filledRows.length}/{MAX_ITEMS} preenchidas
        </span>
      </div>

      {success && (
        <p className="state state-empty" role="status">
          {success}
        </p>
      )}
      {generalError && (
        <p className="form-error" role="alert">
          {generalError}
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-primary" onClick={() => void handleSubmit()} disabled={!canSubmit}>
          {submitting ? 'Enviando…' : `Enviar lote (${filledRows.length})`}
        </button>
      </div>
    </main>
  )
}
