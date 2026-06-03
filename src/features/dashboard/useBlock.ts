// Per-block async state for the dashboard. Each block loads independently so one failing
// block never takes down the others. A 401 is swallowed here because the single HTTP client
// already redirected to login centrally; a 404 is treated as empty data at the api layer
// (see api.ts emptyOn404), so it never surfaces as an error here.

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'

export type BlockState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T }

export function useBlock<T>(
  loader: () => Promise<T>,
  fallbackError: string,
): { state: BlockState<T>; reload: () => void } {
  const [state, setState] = useState<BlockState<T>>({ status: 'loading' })
  const [nonce, setNonce] = useState(0)

  // Hold the latest loader/fallback in refs so the effect re-runs only on mount and on
  // reload() (nonce), not on every parent re-render that passes a new inline loader.
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  const fallbackRef = useRef(fallbackError)
  fallbackRef.current = fallbackError

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    loaderRef.current()
      .then((data) => {
        if (active) setState({ status: 'ready', data })
      })
      .catch((err) => {
        if (!active) return
        // Central 401 handling already redirected — render nothing further.
        if (err instanceof UnauthenticatedError) return
        const message = err instanceof ApiError ? err.message : fallbackRef.current
        setState({ status: 'error', message })
      })
    return () => {
      active = false
    }
  }, [nonce])

  return { state, reload }
}
