// Fixed investment taxonomy (CONTRACT.md §7). Labels are UI-only; the values are the
// closed set the backend accepts.

import type { InvestmentType } from '../../api/types'

export const INVESTMENT_TYPES: { value: InvestmentType; label: string }[] = [
  { value: 'renda_fixa', label: 'Renda fixa' },
  { value: 'acoes', label: 'Ações' },
  { value: 'fii', label: 'FII' },
  { value: 'cripto', label: 'Cripto' },
  { value: 'outro', label: 'Outro' },
]

const LABELS = Object.fromEntries(
  INVESTMENT_TYPES.map((t) => [t.value, t.label]),
) as Record<InvestmentType, string>

export function investmentTypeLabel(type: InvestmentType): string {
  return LABELS[type] ?? type
}
