// Category selector for the create form (web-transactions "Seletor de categoria").
// Reads GET /api/categories?type=expense; offers an explicit "sem categoria" option
// because categoryId is optional (omitted from the body when not selected).

import { useEffect, useState } from 'react'
import type { Category } from '../../api/types'
import { ApiError } from '../../api/client'
import { listExpenseCategories } from './api'

interface CategorySelectProps {
  value: string // '' means "sem categoria"
  onChange: (categoryId: string) => void
  disabled?: boolean
}

export function CategorySelect({ value, onChange, disabled }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    listExpenseCategories()
      .then((items) => {
        if (active) setCategories(items)
      })
      .catch((err) => {
        // 401 is handled centrally by the HTTP client (redirect); only surface other
        // errors here.
        if (active && err instanceof ApiError) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <label>
      Categoria
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
      >
        <option value="">Sem categoria</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      {loading && <span className="hint">Carregando categorias…</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}
