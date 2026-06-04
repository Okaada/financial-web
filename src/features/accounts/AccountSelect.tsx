// Account selector for the transaction form / batch grid (web-transactions "Seletor de
// conta"). Reads GET /api/accounts?archived=false; offers an explicit "sem conta" option
// because accountId is optional (omitted on POST / null on PUT when not selected).

import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import type { Account } from '../../api/types'
import { listAccounts } from './api'

interface AccountSelectProps {
  value: string // '' means "sem conta"
  onChange: (accountId: string) => void
  disabled?: boolean
  /** Hide the field label (e.g. inside a grid row). */
  hideLabel?: boolean
}

export function AccountSelect({ value, onChange, disabled, hideLabel }: AccountSelectProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    listAccounts({ archived: false })
      .then((items) => {
        if (active) setAccounts(items)
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
      {!hideLabel && 'Conta'}
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled || loading}>
        <option value="">Sem conta</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} ({account.currency})
          </option>
        ))}
      </select>
      {loading && !hideLabel && <span className="hint">Carregando contas…</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}
