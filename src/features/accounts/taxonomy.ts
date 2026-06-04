// Fixed bank-account taxonomy (CONTRACT.md §3.5). Labels are UI-only; the values are the
// closed set the backend accepts.

import type { AccountKind } from '../../api/types'

export const ACCOUNT_KINDS: { value: AccountKind; label: string }[] = [
  { value: 'checking', label: 'Conta corrente' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'wallet', label: 'Carteira' },
  { value: 'investment', label: 'Investimento' },
]

const LABELS = Object.fromEntries(
  ACCOUNT_KINDS.map((k) => [k.value, k.label]),
) as Record<AccountKind, string>

export function accountKindLabel(kind: AccountKind): string {
  return LABELS[kind] ?? kind
}
