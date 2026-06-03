// Presentational shell for a dashboard block: header with a "ver tudo" shortcut, and the
// shared loading/error chrome. The block's ready content is provided as children; empty
// state is the child's concern (it knows its own "nothing here" copy).

import type { ReactNode } from 'react'
import type { BlockState } from './useBlock'

interface DashboardBlockProps<T> {
  title: string
  /** Optional "ver tudo" shortcut to the full screen for this area. */
  onSeeAll?: () => void
  seeAllLabel?: string
  state: BlockState<T>
  reload: () => void
  /** Rendered only when state is ready; receives the loaded data. */
  children: (data: T) => ReactNode
}

export function DashboardBlock<T>({
  title,
  onSeeAll,
  seeAllLabel = 'Ver tudo',
  state,
  reload,
  children,
}: DashboardBlockProps<T>) {
  return (
    <section className="dash-block">
      <header className="dash-block-head">
        <h2>{title}</h2>
        {onSeeAll && (
          <button type="button" className="link" onClick={onSeeAll}>
            {seeAllLabel}
          </button>
        )}
      </header>

      {state.status === 'loading' && <p className="state state-loading">Carregando…</p>}

      {state.status === 'error' && (
        <div className="state state-error" role="alert">
          <p>{state.message}</p>
          <button type="button" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      )}

      {state.status === 'ready' && children(state.data)}
    </section>
  )
}
