/// <reference types="@cloudflare/workers-types" />

// Single Worker that serves the SPA (static assets) and proxies the API on the same
// origin. Deployed with `wrangler deploy` (Workers + Static Assets).
//
// - `/api/*`  → forwarded to the Finance API (`finance-api`) via the FINANCE_API service
//   binding, with the `/api` prefix stripped (the backend expects `/auth/login`, not
//   `/api/auth/login` — CONTRACT.md §11). Mirrors the dev proxy in vite.config.ts and
//   keeps the `fa_session` cookie on the SPA's own host (no CORS).
// - everything else → static assets, with SPA fallback to index.html
//   (`not_found_handling = "single-page-application"` in wrangler.toml).
//
// `new Request(url, request)` preserves method, body, query, and headers (incl. the
// session cookie); the API response — including `Set-Cookie` and redirect `Location` —
// is returned unchanged.

interface Env {
  ASSETS: Fetcher
  FINANCE_API: Fetcher
}

// Restrictive CSP for the SPA, delivered as a real response header so `frame-ancestors`
// is actually enforced (it is ignored when set via <meta>). Same policy as before: only
// same-origin scripts/connections, inline styles allowed (Vite injects a stylesheet link
// + some inline styles), images from self + data:. No external resources.
const CSP =
  "default-src 'self'; connect-src 'self'; img-src 'self' data:; " +
  "style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; " +
  "base-uri 'self'; frame-ancestors 'none'"

/** Add security headers to an asset response (never to API responses). */
function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('Content-Security-Policy', CSP)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'no-referrer')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      url.pathname = url.pathname.replace(/^\/api/, '') || '/'
      // API responses pass through untouched (Set-Cookie, Location, the backend's own
      // headers) — we only add security headers to our own static assets.
      return env.FINANCE_API.fetch(new Request(url, request))
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request))
  },
}
