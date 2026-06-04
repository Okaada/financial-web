// Category selector for the transaction form (web-transactions "Seletor de categoria").
// Reads GET /api/categories?type=<type> where <type> matches the transaction type (income
// categories for income, expense for expense). Offers an explicit "sem categoria" option
// because categoryId is optional (omitted from the body when not selected). When the type
// changes, it reloads and clears a now-incompatible selection.

import { useEffect, useRef, useState } from 'react'
import type { Category, TransactionType } from '../../api/types'
import { ApiError } from '../../api/client'
import { listCategoriesByType } from './api'

interface CategorySelectProps {
  value: string // '' means "sem categoria"
  onChange: (categoryId: string) => void
  /** The transaction type — categories are loaded to match it. */
  type: TransactionType
  disabled?: boolean
  hideLabel?: boolean
}

export function CategorySelect({ value, onChange, type, disabled, hideLabel }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Read latest value/onChange via refs so the effect runs only when `type` changes (not on
  // every keystroke), without tripping exhaustive-deps.
  const valueRef = useRef(value)
  valueRef.current = value
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    listCategoriesByType(type)
      .then((items) => {
        if (!active) return
        setCategories(items)
        // Drop a selection that is not among the new type's categories.
        if (valueRef.current !== '' && !items.some((c) => c.id === valueRef.current)) {
          onChangeRef.current('')
        }
      })
      .catch((err) => {
        // 401 is handled centrally by the HTTP client (redirect); only surface other errors.
        if (active && err instanceof ApiError) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [type])

  return (
    <label>
      {!hideLabel && 'Categoria'}
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled || loading}>
        <option value="">Sem categoria</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      {loading && !hideLabel && <span className="hint">Carregando categorias…</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}
