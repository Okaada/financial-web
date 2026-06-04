// Recurring template form — create and edit (web-recurring-templates spec; design D4).
// Sends amount in cents; surfaces 400 (field validation and invalid/archived category)
// next to the form without losing input. PUT uses the same body shape as POST.

import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import type {
  CreateRecurringTemplateInput,
  RecurringTemplate,
  TransactionType,
} from '../../api/types'
import { centsToInput, parseToCents } from '../../lib/money'
import { CategorySelect } from '../transactions/CategorySelect'
import { createTemplate, updateTemplate } from './api'

interface RecurringTemplateFormProps {
  initial?: RecurringTemplate
  onSaved: (template: RecurringTemplate) => void
  onCancel?: () => void
}

const DEFAULT_CURRENCY = 'BRL'

export function RecurringTemplateForm({ initial, onSaved, onCancel }: RecurringTemplateFormProps) {
  const editing = initial !== undefined

  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amountInput, setAmountInput] = useState(initial ? centsToInput(initial.amount) : '')
  const [currency, setCurrency] = useState(initial?.currency ?? DEFAULT_CURRENCY)
  const [dayOfMonth, setDayOfMonth] = useState(initial ? String(initial.dayOfMonth) : '1')
  const [intervalMonths, setIntervalMonths] = useState(
    initial ? String(initial.intervalMonths) : '1',
  )
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [active, setActive] = useState(initial?.active ?? true)

  const [submitting, setSubmitting] = useState(false)
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
    const day = Number(dayOfMonth)
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      setFormError('Dia do mês deve ser um inteiro entre 1 e 31.')
      return
    }
    const interval = Number(intervalMonths)
    if (!Number.isInteger(interval) || interval < 1) {
      setFormError('Intervalo (meses) deve ser um inteiro ≥ 1.')
      return
    }
    if (startDate.trim() === '') {
      setFormError('Informe a data de início (startDate).')
      return
    }

    const input: CreateRecurringTemplateInput = {
      type,
      amount, // cents
      currency,
      dayOfMonth: day,
      intervalMonths: interval,
      startDate,
      active,
    }
    if (endDate.trim() !== '') input.endDate = endDate
    if (description.trim() !== '') input.description = description.trim()
    if (categoryId !== '') input.categoryId = categoryId

    setSubmitting(true)
    try {
      const saved = editing
        ? await updateTemplate(initial.id, input)
        : await createTemplate(input)
      onSaved(saved)
      if (!editing) {
        setAmountInput('')
        setDescription('')
        setCategoryId('')
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        if (/categor/i.test(err.message) || /category/i.test(err.code)) {
          setCategoryError(err.message)
        } else {
          setFormError(err.message)
        }
      } else if (err instanceof ApiError && err.status === 404) {
        setFormError('Recorrente não encontrado.')
      } else if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError('Falha ao salvar o recorrente. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <h2>{editing ? 'Editar recorrente' : 'Novo recorrente'}</h2>

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
        Dia do mês
        <input
          type="number"
          min={1}
          max={31}
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value)}
          disabled={submitting}
        />
      </label>

      <label>
        Intervalo (meses)
        <input
          type="number"
          min={1}
          value={intervalMonths}
          onChange={(e) => setIntervalMonths(e.target.value)}
          disabled={submitting}
        />
      </label>

      <label>
        Início
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={submitting}
        />
      </label>

      <label>
        Fim (opcional)
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={submitting}
        />
      </label>

      <div className="field">
        <CategorySelect value={categoryId} onChange={setCategoryId} type={type} disabled={submitting} />
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

      <label className="checkbox">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          disabled={submitting}
        />
        Ativo
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
