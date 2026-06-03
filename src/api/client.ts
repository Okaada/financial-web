// THE single HTTP access layer (design.md D2; web-http-client spec).
//
// This is the ONLY module allowed to call fetch against /api/* — the front's
// equivalent of the backend's "single point of access". Every call:
//   - uses credentials: 'same-origin' so the browser attaches the fa_session cookie
//     (the JS never reads/writes the cookie itself);
//   - parses the standard error envelope { error: { code, message } } into a
//     structured ApiError, never leaking the raw Response;
//   - handles 401 centrally by marking the session unauthenticated (App then shows the
//     login screen) — callers never handle 401, and we do NOT auto-navigate to login;
//   - marks the session authenticated on any successful protected response;
//   - classifies 404 as a structured `not_found` (does NOT trigger login and is not
//     a "system error") so callers can render "not found";
//   - treats 204 No Content as success without parsing a body.
//
// The eslint `no-restricted-globals` rule forbids fetch elsewhere; this file is the
// single exception.

import { markAuthenticated, markUnauthenticated } from './authState'
import { API_PREFIX } from './paths'
import type { ErrorEnvelope } from './types'

/** Structured error surfaced to callers instead of a raw Response. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }

  /** True when the resource was not found / belongs to another tenant (404). */
  get isNotFound(): boolean {
    return this.status === 404
  }
}

/**
 * Sentinel thrown after a 401 triggers the central login redirect. Callers' promises
 * reject with this and never resolve with success data (web-http-client: "a 401 does
 * not resolve with success"). The app is navigating away, so this is rarely observed.
 */
export class UnauthenticatedError extends Error {
  constructor() {
    super('authentication required')
    this.name = 'UnauthenticatedError'
  }
}

interface RequestOptions {
  method?: string
  /** JSON-serializable body; Content-Type: application/json is set automatically. */
  body?: unknown
  /** Query params; undefined/null values are omitted. */
  query?: Record<string, string | undefined>
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (!path.startsWith(API_PREFIX)) {
    throw new Error(`HTTP client only targets ${API_PREFIX}/*, got: ${path}`)
  }
  if (!query) return path
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, value)
  }
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

/** Parse the error envelope; fall back to a generic code when the body is unusable. */
async function toApiError(response: Response): Promise<ApiError> {
  const fallbackCode = response.status === 404 ? 'not_found' : 'unexpected_error'
  try {
    const data = (await response.json()) as Partial<ErrorEnvelope>
    const code = data.error?.code ?? fallbackCode
    const message = data.error?.message ?? response.statusText ?? 'Request failed'
    return new ApiError(response.status, code, message)
  } catch {
    // No body, or a body that is not the JSON error envelope (e.g. 500 with no body).
    return new ApiError(response.status, fallbackCode, response.statusText || 'Request failed')
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options

  const response = await fetch(buildUrl(path, query), {
    method,
    // Same-origin: the browser attaches the fa_session cookie automatically.
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  // Central 401 handling: mark the session unauthenticated (App shows the login screen);
  // the call never resolves with data. We do NOT navigate to login here — only the
  // explicit "Entrar com Google" button does (avoids silent re-SSO after logout).
  if (response.status === 401) {
    markUnauthenticated()
    throw new UnauthenticatedError()
  }

  if (!response.ok) {
    // 404 and every other error become a structured ApiError (404 = not_found, not a
    // system failure and not a login trigger).
    throw await toApiError(response)
  }

  // A successful protected response confirms we have a session.
  markAuthenticated()

  // 204 No Content (e.g. logout) — success with no body to parse.
  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function apiGet<T>(path: string, query?: RequestOptions['query']): Promise<T> {
  return request<T>(path, { method: 'GET', query })
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body })
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body })
}

/** DELETE returns 204 No Content — request() resolves with undefined. */
export function apiDelete(path: string): Promise<void> {
  return request<void>(path, { method: 'DELETE' })
}
