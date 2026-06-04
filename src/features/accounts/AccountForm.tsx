// Create/edit form for a bank account. On create, currency is editable; on edit it is
// read-only (immutable per CONTRACT §3.5 — never sent). openingBalance is in cents and may
// be negative — hidden for kind=investment (balance comes from linked investments, not a seed
// value). A 400 surfaces the backend's error.message inline without losing input.

import { useState, type FormEvent } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { Account, AccountKind, CreateAccountInput, UpdateAccountInput } from '../../api/types'
import { centsToInput, parseToCentsSigned } from '../../lib/money'
import { ACCOUNT_KINDS } from './taxonomy'

const DEFAULT_CURRENCY = 'BRL'

interface AccountFormProps {
  mode: 'create' | 'edit'
  initial?: Account
  onCreate?: (input: CreateAccountInput) => Promise<void>
  onUpdate?: (input: UpdateAccountInput) => Promise<void>
  onCancel?: () => void
}

export function AccountForm({ mode, initial, onCreate, onUpdate, onCancel }: AccountFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<AccountKind>(initial?.kind ?? 'checking')
  const [currency, setCurrency] = useState(initial?.currency ?? DEFAULT_CURRENCY)
  const [openingBalance, setOpeningBalance] = useState(
    initial ? centsToInput(initial.openingBalance) : '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (name.trim() === '') {
      setError('Informe um nome para a conta.')
      return
    }
    if (mode === 'create' && currency.trim() === '') {
      setError('Informe a moeda (currency).')
      return
    }
    // Investment accounts don't use an opening balance — their "balance" is the sum of
    // linked investments. Always send 0; only validate the field for non-investment kinds.
    let cents = 0
    if (kind !== 'investment') {
      const parsed = parseToCentsSigned(openingBalance)
      if (parsed === null) {
        setError('Saldo inicial inválido (use centavos, ex.: 10,00 ou -10,00).')
        return
      }
      cents = parsed
    }

    setSubmitting(true)
    try {
      if (mode === 'create') {
        await onCreate?.({ name: name.trim(), kind, currency: currency.trim(), openingBalance: cents })
      } else {
        await onUpdate?.({ name: name.trim(), kind, openingBalance: cents })
      }
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar a conta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h2>{mode === 'create' ? 'Nova conta' : 'Editar conta'}</h2>

      <label>
        Nome
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
      </label>

      <label>
        Tipo
        <select value={kind} onChange={(e) => setKind(e.target.value as AccountKind)} disabled={submitting}>
          {ACCOUNT_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
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
          // currency is immutable — read-only on edit (CONTRACT §3.5).
          <input type="text" value={currency} readOnly disabled />
        )}
      </label>

      {kind !== 'investment' && (
        <label>
          Saldo inicial (pode ser negativo)
          <input
            type="text"
            inputMode="decimal"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            disabled={submitting}
            placeholder="0,00"
          />
        </label>
      )}

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
