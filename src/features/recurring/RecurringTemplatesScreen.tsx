// Recurring templates screen (web-recurring-templates spec). Explicit UI states:
// loading, empty, error (non-401, retry), no-session. List with `active` filter; edit
// and delete (with confirm).

import { useCallback, useEffect, useState } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { RecurringTemplate } from '../../api/types'
import { formatCents } from '../../lib/money'
import { deleteTemplate, listTemplates } from './api'
import { RecurringTemplateForm } from './RecurringTemplateForm'

type Status = 'loading' | 'ready' | 'error'
type ActiveFilter = '' | 'true' | 'false'

export function RecurringTemplatesScreen() {
  const [status, setStatus] = useState<Status>('loading')
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [editing, setEditing] = useState<RecurringTemplate | null>(null)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('')

  const load = useCallback(async (filter: ActiveFilter) => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const items = await listTemplates({
        active: filter === '' ? undefined : filter === 'true',
      })
      setTemplates(items)
      setStatus('ready')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar recorrentes.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load(activeFilter)
  }, [load, activeFilter])

  function handleSaved(saved: RecurringTemplate) {
    setNotice(null)
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === saved.id)
      return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev]
    })
    setEditing(null)
  }

  async function handleDelete(template: RecurringTemplate) {
    if (!window.confirm('Excluir este recorrente? Esta ação não pode ser desfeita.')) return
    setNotice(null)
    try {
      await deleteTemplate(template.id)
      setTemplates((prev) => prev.filter((t) => t.id !== template.id))
      if (editing?.id === template.id) setEditing(null)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      if (err instanceof ApiError && err.status === 404) {
        setTemplates((prev) => prev.filter((t) => t.id !== template.id))
        setNotice('Recorrente não encontrado (já removido).')
      } else {
        setNotice(err instanceof ApiError ? err.message : 'Falha ao excluir. Tente novamente.')
      }
    }
  }

  return (
    <main className="screen">
      <h1>Recorrentes</h1>

      {editing ? (
        <RecurringTemplateForm
          initial={editing}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <RecurringTemplateForm onSaved={handleSaved} />
      )}

      <form className="filters">
        <label>
          Situação
          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}>
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </label>
      </form>

      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}

      <section className="recurring">
        {status === 'loading' && <p className="state state-loading">Carregando…</p>}

        {status === 'error' && (
          <div className="state state-error" role="alert">
            <p>{errorMessage}</p>
            <button type="button" onClick={() => void load(activeFilter)}>
              Tentar novamente
            </button>
          </div>
        )}

        {status === 'ready' && templates.length === 0 && (
          <p className="state state-empty">Nenhum recorrente.</p>
        )}

        {status === 'ready' && templates.length > 0 && (
          <ul className="category-list">
            {templates.map((t) => (
              <li key={t.id} className={`category transaction-${t.type}`}>
                <span className="transaction-amount">{formatCents(t.amount, t.currency)}</span>
                <span className="category-name">{t.description ?? '(sem descrição)'}</span>
                <span className="category-type">
                  {t.type === 'expense' ? 'Despesa' : 'Receita'} · dia {t.dayOfMonth} · a cada{' '}
                  {t.intervalMonths} {t.intervalMonths === 1 ? 'mês' : 'meses'}
                </span>
                {!t.active && <span className="badge">inativo</span>}
                <span className="category-actions">
                  <button type="button" className="link" onClick={() => setEditing(t)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => void handleDelete(t)}
                  >
                    Excluir
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
