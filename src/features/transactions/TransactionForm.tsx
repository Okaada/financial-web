// Create-transaction form (web-transactions §"Criar transação", §7 tasks).
// Sends amount in cents; omits categoryId when "sem categoria"; surfaces 400 errors
// (field validation and invalid/archived category) next to the form without losing
// the user's input.

import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import type { CreateTransactionInput, Transaction, TransactionType } from '../../api/types'
import { parseToCents } from '../../lib/money'
import { createTransaction } from './api'
import { CategorySelect } from './CategorySelect'

interface TransactionFormProps {
  onCreated: (transaction: Transaction) => void
}

const DEFAULT_CURRENCY = 'BRL'

export function TransactionForm({ onCreated }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amountInput, setAmountInput] = useState('')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  const [occurredOn, setOccurredOn] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')

  const [submitting, setSubmitting] = useState(false)
  // Errors keyed loosely so 400-category maps to the category field; everything else
  // shows as a form-level message.
  const [formError, setFormError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setCategoryError(null)

    const amount = parseToCents(amountInput)
    if (amount === null) {
      setFormError('Valor inválido. Informe um número (ex.: 10,00).')
      return
    }
    if (occurredOn.trim() === '') {
      setFormError('Informe a data (occurredOn).')
      return
    }

    const input: CreateTransactionInput = {
      type,
      amount, // cents
      currency,
      occurredOn,
    }
    if (categoryId !== '') input.categoryId = categoryId
    if (description.trim() !== '') input.description = description.trim()

    setSubmitting(true)
    try {
      const created = await createTransaction(input)
      onCreated(created)
      // Reset the value fields; keep type/currency for fast repeated entry.
      setAmountInput('')
      setOccurredOn('')
      setCategoryId('')
      setDescription('')
    } catch (err) {
      // 401 is handled centrally (redirect). Here we only get 400/404/5xx.
      if (err instanceof ApiError && err.status === 400) {
        // A body-referenced categoryId that is invalid/archived/not-owned returns 400
        // (CONTRACT.md §1) — surface it on the category field; existence is never
        // confirmed, so we just ask the user to pick another.
        if (/categor/i.test(err.message) || /category/i.test(err.code)) {
          setCategoryError(err.message)
        } else {
          setFormError(err.message)
        }
      } else if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError('Falha ao criar a transação. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h2>Nova transação</h2>

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
        <CategorySelect value={categoryId} onChange={setCategoryId} disabled={submitting} />
        {categoryError && <span className="field-error">{categoryError}</span>}
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

      <button type="submit" disabled={submitting}>
        {submitting ? 'Salvando…' : 'Adicionar'}
      </button>
    </form>
  )
}
