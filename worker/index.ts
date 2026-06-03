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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      url.pathname = url.pathname.replace(/^\/api/, '') || '/'
      return env.FINANCE_API.fetch(new Request(url, request))
    }

    return env.ASSETS.fetch(request)
  },
}
