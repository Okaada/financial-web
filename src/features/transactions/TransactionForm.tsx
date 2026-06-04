// Transaction form — create and edit (web-transactions "Criar transação" / "Editar
// transação"; design D2). Sends amount in cents; surfaces 400 errors (field validation
// and invalid/archived category) next to the form without losing input.
//
// Edit mode is a FULL REPLACE (PUT): the body is built from the existing resource so
// fields the form does not edit (notably `cardId`) are preserved, not wiped.

import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import type {
  CreateTransactionInput,
  Transaction,
  TransactionType,
  UpdateTransactionInput,
} from '../../api/types'
import { centsToInput, parseToCents } from '../../lib/money'
import { AccountSelect } from '../accounts/AccountSelect'
import { CardSelect } from '../cards/CardSelect'
import { createTransaction, updateTransaction } from './api'
import { CategorySelect } from './CategorySelect'

interface TransactionFormProps {
  /** When provided, the form edits this transaction (PUT); otherwise it creates (POST). */
  initial?: Transaction
  onSaved: (transaction: Transaction) => void
  onCancel?: () => void
}

const DEFAULT_CURRENCY = 'BRL'

export function TransactionForm({ initial, onSaved, onCancel }: TransactionFormProps) {
  const editing = initial !== undefined

  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amountInput, setAmountInput] = useState(initial ? centsToInput(initial.amount) : '')
  const [currency, setCurrency] = useState(initial?.currency ?? DEFAULT_CURRENCY)
  const [occurredOn, setOccurredOn] = useState(initial?.occurredOn ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [cardId, setCardId] = useState(initial?.cardId ?? '')
  const [accountId, setAccountId] = useState(initial?.accountId ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [cardError, setCardError] = useState<string | null>(null)
  const [accountError, setAccountError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setCategoryError(null)
    setCardError(null)
    setAccountError(null)

    const amount = parseToCents(amountInput)
    if (amount === null) {
      setFormError('Valor inválido. Informe um número (ex.: 10,00).')
      return
    }
    if (occurredOn.trim() === '') {
      setFormError('Informe a data (occurredOn).')
      return
    }

    setSubmitting(true)
    try {
      let saved: Transaction
      if (editing) {
        // Full replace: send categoryId as value-or-null and preserve cardId from the
        // existing resource (the form does not edit it). description omitted -> cleared.
        const body: UpdateTransactionInput = {
          type,
          amount,
          currency,
          occurredOn,
          categoryId: categoryId === '' ? null : categoryId,
          cardId: cardId === '' ? null : cardId,
          accountId: accountId === '' ? null : accountId,
        }
        if (description.trim() !== '') body.description = description.trim()
        saved = await updateTransaction(initial.id, body)
      } else {
        const body: CreateTransactionInput = { type, amount, currency, occurredOn }
        if (categoryId !== '') body.categoryId = categoryId
        if (cardId !== '') body.cardId = cardId
        if (accountId !== '') body.accountId = accountId
        if (description.trim() !== '') body.description = description.trim()
        saved = await createTransaction(body)
      }

      onSaved(saved)
      if (!editing) {
        // Reset value fields; keep type/currency for fast repeated entry.
        setAmountInput('')
        setOccurredOn('')
        setCategoryId('')
        setCardId('')
        setAccountId('')
        setDescription('')
      }
    } catch (err) {
      // 401 is handled centrally (redirect). Here we only get 400/404/5xx.
      if (err instanceof ApiError && err.status === 400) {
        // A body-referenced categoryId/cardId that is invalid/archived/not-owned returns
        // 400 (CONTRACT.md §1) — surface it on the matching field; existence is never
        // confirmed, so we just ask the user to pick another.
        if (/cart|card/i.test(err.message) || /card/i.test(err.code)) {
          setCardError(err.message)
        } else if (/categor|category/i.test(err.message) || /categor/i.test(err.code)) {
          setCategoryError(err.message)
        } else if (/\bconta\b|account/i.test(err.message) || /account/i.test(err.code)) {
          setAccountError(err.message)
        } else {
          setFormError(err.message)
        }
      } else if (err instanceof ApiError && err.status === 404) {
        setFormError('Transação não encontrada.')
      } else if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError('Falha ao salvar a transação. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h2>{editing ? 'Editar transação' : 'Nova transação'}</h2>

      <label>
        Tipo
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
          disabled={submitting}
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
      </label>

      <label>
        Valor
        <input
          type="text"
          inputMode="decimal"
          placeholder="10,00"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          disabled={submitting}
        />
      </label>

      <label>
        Moeda
        <input
          type="text"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          disabled={submitting}
          maxLength={3}
        />
      </label>

      <label>
        Data
        <input
          type="date"
          value={occurredOn}
          onChange={(e) => setOccurredOn(e.target.value)}
          disabled={submitting}
        />
      </label>

      <div className="field">
        <CategorySelect value={categoryId} onChange={setCategoryId} type={type} disabled={submitting} />
        {categoryError && <span className="field-error">{categoryError}</span>}
      </div>

      <div className="field">
        <AccountSelect value={accountId} onChange={setAccountId} disabled={submitting} />
        {accountError && <span className="field-error">{accountError}</span>}
      </div>

      <div className="field">
        <CardSelect value={cardId} onChange={setCardId} disabled={submitting} />
        {cardError && <span className="field-error">{cardError}</span>}
      </div>

      <label>
        Descrição (opcional)
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
        />
      </label>

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Salvando…' : editing ? 'Salvar' : 'Adicionar'}
        </button>
        {editing && onCancel && (
          <button type="button" className="link" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
