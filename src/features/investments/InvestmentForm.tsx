// Create/edit form for an investment (web-investments). On create: name, type, currency,
// and an investment-account link. On edit: type and currency are immutable (read-only, not
// sent); the PUT body is { name, accountId } where accountId '' -> null clears the link.
// 400 surfaces error.message inline. initialValue is gone — record an aporte instead.

import { useState, type FormEvent } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type {
  CreateInvestmentInput,
  Investment,
  InvestmentType,
  UpdateInvestmentInput,
} from '../../api/types'
import { AccountSelect } from '../accounts/AccountSelect'
import { INVESTMENT_TYPES } from './taxonomy'

const DEFAULT_CURRENCY = 'BRL'

interface InvestmentFormProps {
  mode: 'create' | 'edit'
  initial?: Investment
  onCreate?: (input: CreateInvestmentInput) => Promise<void>
  onUpdate?: (input: UpdateInvestmentInput) => Promise<void>
  onCancel?: () => void
}

export function InvestmentForm({ mode, initial, onCreate, onUpdate, onCancel }: InvestmentFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<InvestmentType>(initial?.type ?? 'renda_fixa')
  const [currency, setCurrency] = useState(initial?.currency ?? DEFAULT_CURRENCY)
  const [accountId, setAccountId] = useState(initial?.accountId ?? '')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountError, setAccountError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setAccountError(null)

    if (name.trim() === '') {
      setError('Informe um nome.')
      return
    }
    if (mode === 'create' && currency.trim() === '') {
      setError('Informe a moeda (currency).')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'create') {
        const body: CreateInvestmentInput = {
          name: name.trim(),
          type,
          currency: currency.trim(),
        }
        if (accountId !== '') body.accountId = accountId
        await onCreate?.(body)
      } else {
        await onUpdate?.({
          name: name.trim(),
          accountId: accountId === '' ? null : accountId,
        })
      }
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      if (err instanceof ApiError && err.status === 400 && /\bconta\b|account/i.test(err.message)) {
        setAccountError(err.message)
      } else {
        setError(err instanceof ApiError ? err.message : 'Falha ao salvar o investimento.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h2>{mode === 'create' ? 'Novo investimento' : 'Editar investimento'}</h2>

      <label>
        Nome
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
      </label>

      <label>
        Tipo
        {mode === 'create' ? (
          <select value={type} onChange={(e) => setType(e.target.value as InvestmentType)} disabled={submitting}>
            {INVESTMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        ) : (
          // type is immutable on edit.
          <input
            type="text"
            value={INVESTMENT_TYPES.find((t) => t.value === type)?.label ?? type}
            readOnly
            disabled
          />
        )}
      </label>

      <label>
        Moeda
        {mode === 'create' ? (
          <input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            disabled={submitting}
            maxLength={3}
          />
        ) : (
          // currency is immutable on edit.
          <input type="text" value={currency} readOnly disabled />
        )}
      </label>

      <div className="field">
        <AccountSelect
          value={accountId}
          onChange={setAccountId}
          disabled={submitting}
          kind="investment"
        />
        {accountError && <span className="field-error">{accountError}</span>}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Salvando…' : mode === 'create' ? 'Adicionar' : 'Salvar'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
