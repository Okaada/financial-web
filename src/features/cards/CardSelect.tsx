// Card selector for the transaction form (web-transactions delta "Seletor de cartão").
// Reads GET /api/cards?archived=false; offers an explicit "sem cartão" option because
// cardId is optional (omitted/null when not selected).

import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import type { Card } from '../../api/types'
import { listCards } from './api'

interface CardSelectProps {
  value: string // '' means "sem cartão"
  onChange: (cardId: string) => void
  disabled?: boolean
}

export function CardSelect({ value, onChange, disabled }: CardSelectProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    listCards({ archived: false })
      .then((items) => {
        if (active) setCards(items)
      })
      .catch((err) => {
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
      Cartão
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
      >
        <option value="">Sem cartão</option>
        {cards.map((card) => (
          <option key={card.id} value={card.id}>
            {card.name ?? '(sem nome)'}
          </option>
        ))}
      </select>
      {loading && <span className="hint">Carregando cartões…</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}
