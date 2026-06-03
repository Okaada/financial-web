// Categories management screen (web-categories spec). Explicit UI states: loading,
// empty, error (non-401, with retry), no-session. Create, rename (name only — type is
// immutable) and archive (no hard delete).

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import type { Category, CategoryType } from '../../api/types'
import { archiveCategory, createCategory, listCategories, renameCategory } from './api'

type Status = 'loading' | 'ready' | 'error'

interface FilterState {
  type: '' | CategoryType
  archived: '' | 'true' | 'false'
}

const EMPTY_FILTERS: FilterState = { type: '', archived: '' }

const TYPE_LABEL: Record<CategoryType, string> = {
  income: 'Receita',
  expense: 'Despesa',
  investment: 'Investimento',
}

export function CategoriesScreen() {
  const [status, setStatus] = useState<Status>('loading')
  const [categories, setCategories] = useState<Category[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)

  // Create form.
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<CategoryType>('expense')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Inline rename.
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [rowError, setRowError] = useState<string | null>(null)

  const load = useCallback(async (f: FilterState) => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const items = await listCategories({
        type: f.type || undefined,
        archived: f.archived === '' ? undefined : f.archived === 'true',
      })
      setCategories(items)
      setStatus('ready')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setErrorMessage(err instanceof ApiError ? err.message : 'Erro ao carregar categorias.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load(filters)
    // Re-run when filters change.
  }, [load, filters])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setCreateError(null)
    setNotice(null)
    if (newName.trim() === '') {
      setCreateError('Informe um nome.')
      return
    }
    setCreating(true)
    try {
      const created = await createCategory({ name: newName.trim(), type: newType })
      setCategories((prev) => [created, ...prev])
      setNewName('')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setCreateError(err instanceof ApiError ? err.message : 'Falha ao criar a categoria.')
    } finally {
      setCreating(false)
    }
  }

  function startRename(category: Category) {
    setRowError(null)
    setRenamingId(category.id)
    setRenameValue(category.name)
  }

  async function handleRename(id: string) {
    setRowError(null)
    setNotice(null)
    if (renameValue.trim() === '') {
      setRowError('Informe um nome.')
      return
    }
    try {
      // Only `name` is sent — type is immutable (sending it would 400).
      const updated = await renameCategory(id, { name: renameValue.trim() })
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
      setRenamingId(null)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      if (err instanceof ApiError && err.status === 404) {
        setRowError('Categoria não encontrada.')
      } else {
        setRowError(err instanceof ApiError ? err.message : 'Falha ao renomear.')
      }
    }
  }

  async function handleArchive(category: Category) {
    if (!window.confirm(`Arquivar "${category.name}"? Ela deixará de aparecer em novas transações.`)) {
      return
    }
    setNotice(null)
    setRowError(null)
    try {
      const archived = await archiveCategory(category.id)
      setCategories((prev) => prev.map((c) => (c.id === category.id ? archived : c)))
      setNotice(`"${archived.name}" arquivada.`)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      if (err instanceof ApiError && err.status === 404) {
        setRowError('Categoria não encontrada.')
      } else {
        setRowError(err instanceof ApiError ? err.message : 'Falha ao arquivar.')
      }
    }
  }

  return (
    <main className="screen">
      <h1>Categorias</h1>

      <form className="transaction-form" onSubmit={handleCreate}>
        <h2>Nova categoria</h2>
        <label>
          Nome
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={creating}
          />
        </label>
        <label>
          Tipo
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as CategoryType)}
            disabled={creating}
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
            <option value="investment">Investimento</option>
          </select>
        </label>
        {createError && (
          <p className="form-error" role="alert">
            {createError}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" disabled={creating}>
            {creating ? 'Salvando…' : 'Adicionar'}
          </button>
        </div>
      </form>

      <form className="filters">
        <label>
          Tipo
          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as FilterState['type'] }))}
          >
            <option value="">Todos</option>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
            <option value="investment">Investimento</option>
          </select>
        </label>
        <label>
          Situação
          <select
            value={filters.archived}
            onChange={(e) =>
              setFilters((f) => ({ ...f, archived: e.target.value as FilterState['archived'] }))
            }
          >
            <option value="">Todas</option>
            <option value="false">Ativas</option>
            <option value="true">Arquivadas</option>
          </select>
        </label>
      </form>

      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {rowError && (
        <p className="form-error" role="alert">
          {rowError}
        </p>
      )}

      <section className="categories">
        {status === 'loading' && <p className="state state-loading">Carregando…</p>}

        {status === 'error' && (
          <div className="state state-error" role="alert">
            <p>{errorMessage}</p>
            <button type="button" onClick={() => void load(filters)}>
              Tentar novamente
            </button>
          </div>
        )}

        {status === 'ready' && categories.length === 0 && (
          <p className="state state-empty">Nenhuma categoria.</p>
        )}

        {status === 'ready' && categories.length > 0 && (
          <ul className="category-list">
            {categories.map((c) => (
              <li key={c.id} className="category">
                {renamingId === c.id ? (
                  <>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      aria-label="Novo nome"
                    />
                    <span className="category-actions">
                      <button type="button" className="link" onClick={() => void handleRename(c.id)}>
                        Salvar
                      </button>
                      <button type="button" className="link" onClick={() => setRenamingId(null)}>
                        Cancelar
                      </button>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="category-name">{c.name}</span>
                    <span className="category-type">{TYPE_LABEL[c.type]}</span>
                    {c.archived && <span className="badge">arquivada</span>}
                    <span className="category-actions">
                      <button type="button" className="link" onClick={() => startRename(c)}>
                        Renomear
                      </button>
                      {!c.archived && (
                        <button type="button" className="link" onClick={() => void handleArchive(c)}>
                          Arquivar
                        </button>
                      )}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
