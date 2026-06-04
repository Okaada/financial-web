// Batch entry grid (web-transactions-batch). Add/paste rows, pick account/category per row,
// validate locally, then POST /api/transactions/batch. All-or-nothing: on a 400 the whole
// batch is rejected (nothing written) and ApiError.index points at the bad row, which we
// highlight with the backend message.

import { useRef, useState } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { CreateTransactionInput, Transaction, TransactionType } from '../../api/types'
import { parseToCents } from '../../lib/money'
import { AccountSelect } from '../accounts/AccountSelect'
import { createBatch } from './api'
import { CategorySelect } from './CategorySelect'

const MAX_ITEMS = 100
const DEFAULT_CURRENCY = 'BRL'

interface Row {
  key: number
  type: TransactionType
  amount: string
  currency: string
  occurredOn: string
  accountId: string
  categoryId: string
  description: string
}

interface BatchEntryScreenProps {
  onBack: () => void
  /** Called after a successful batch with the created transactions. */
  onCreated: (created: Transaction[]) => void
}

function emptyRow(key: number): Row {
  return {
    key,
    type: 'expense',
    amount: '',
    currency: DEFAULT_CURRENCY,
    occurredOn: '',
    accountId: '',
    categoryId: '',
    description: '',
  }
}

/** Build the API item for a row, or null when the row is locally invalid. */
function toItem(row: Row): CreateTransactionInput | null {
  const amount = parseToCents(row.amount)
  if (amount === null) return null
  if (row.currency.trim() === '' || row.occurredOn.trim() === '') return null
  const item: CreateTransactionInput = {
    type: row.type,
    amount,
    currency: row.currency.trim(),
    occurredOn: row.occurredOn,
  }
  if (row.accountId !== '') item.accountId = row.accountId
  if (row.categoryId !== '') item.categoryId = row.categoryId
  if (row.description.trim() !== '') item.description = row.description.trim()
  return item
}

export function BatchEntryScreen({ onBack, onCreated }: BatchEntryScreenProps) {
  const nextKey = useRef(1)
  const makeRow = () => emptyRow(nextKey.current++)

  const [rows, setRows] = useState<Row[]>(() => [emptyRow(0), emptyRow(-1), emptyRow(-2)])
  const [submitting, setSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [rowError, setRowError] = useState<{ index: number; message: string } | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pasteText, setPasteText] = useState('')

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()])
  }

  function removeRow(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  // Best-effort paste: each line "type<TAB>amount<TAB>currency<TAB>occurredOn<TAB>description".
  function addFromText() {
    const lines = pasteText.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    const parsed: Row[] = lines.map((line) => {
      const [type, amount, currency, occurredOn, description] = line.split('\t')
      return {
        ...makeRow(),
        type: type === 'income' ? 'income' : 'expense',
        amount: amount ?? '',
        currency: (currency ?? DEFAULT_CURRENCY).toUpperCase(),
        occurredOn: occurredOn ?? '',
        description: description ?? '',
      }
    })
    setRows((prev) => [...prev, ...parsed])
    setPasteText('')
  }

  // A row counts as "filled" if it has any meaningful input.
  const filledRows = rows.filter(
    (r) => r.amount.trim() !== '' || r.occurredOn.trim() !== '' || r.description.trim() !== '',
  )
  const items = filledRows.map(toItem)
  const hasInvalid = items.some((it) => it === null)
  const canSubmit =
    !submitting && filledRows.length > 0 && filledRows.length <= MAX_ITEMS && !hasInvalid

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
    const payload = items.filter((it): it is CreateTransactionInput => it !== null)
    if (payload.length !== filledRows.length) {
      setGeneralError('Há linhas inválidas (valor/data). Corrija antes de enviar.')
      return
    }

    setSubmitting(true)
    try {
      const created = await createBatch(payload)
      setSuccess(`${created.length} lançamento(s) criados.`)
      setRows([makeRow(), makeRow(), makeRow()])
      onCreated(created)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      if (err instanceof ApiError && err.status === 400) {
        if (typeof err.index === 'number') {
          // All-or-nothing: nothing was written; point at the offending row.
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
        <h1>Lançar em lote</h1>
        <button type="button" className="link" onClick={onBack}>
          ← Voltar
        </button>
      </div>

      <p className="account-hint">
        Adicione linhas (ou cole). O envio é tudo-ou-nada: se um item for inválido, nenhum é
        gravado. Máximo {MAX_ITEMS} por lote. Valores em centavos (ex.: 10,00).
      </p>

      <ul className="batch-grid">
        {rows.map((row) => {
          // Map the row to its position among filled rows for the backend index highlight.
          const filledIndex = filledRows.indexOf(row)
          const highlighted = rowError !== null && filledIndex === rowError.index
          const localInvalid =
            filledRows.includes(row) && toItem(row) === null
          return (
            <li
              key={row.key}
              className={highlighted ? 'batch-row batch-row-error' : 'batch-row'}
            >
              <label className="batch-cell">
                Tipo
                <select
                  value={row.type}
                  onChange={(e) => updateRow(row.key, { type: e.target.value as TransactionType })}
                  disabled={submitting}
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </label>
              <label className="batch-cell">
                Valor
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="10,00"
                  value={row.amount}
                  onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                  disabled={submitting}
                />
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
                Data
                <input
                  type="date"
                  value={row.occurredOn}
                  onChange={(e) => updateRow(row.key, { occurredOn: e.target.value })}
                  disabled={submitting}
                />
              </label>
              <div className="batch-cell">
                <AccountSelect
                  value={row.accountId}
                  onChange={(v) => updateRow(row.key, { accountId: v })}
                  disabled={submitting}
                  hideLabel
                />
              </div>
              <div className="batch-cell">
                <CategorySelect
                  value={row.categoryId}
                  onChange={(v) => updateRow(row.key, { categoryId: v })}
                  type={row.type}
                  disabled={submitting}
                  hideLabel
                />
              </div>
              <label className="batch-cell">
                Descrição
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => updateRow(row.key, { description: e.target.value })}
                  disabled={submitting}
                />
              </label>
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
              {!highlighted && localInvalid && (
                <span className="field-error">Valor/data inválidos.</span>
              )}
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

      <details className="batch-paste">
        <summary>Colar linhas</summary>
        <p className="account-hint">
          Uma linha por lançamento, colunas separadas por TAB:{' '}
          <code>tipo⇥valor⇥moeda⇥data⇥descrição</code> (tipo = income/expense).
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={4}
          disabled={submitting}
        />
        <button type="button" className="btn btn-ghost btn-sm" onClick={addFromText} disabled={submitting}>
          Adicionar do texto
        </button>
      </details>

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
