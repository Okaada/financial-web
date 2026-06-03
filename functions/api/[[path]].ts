/// <reference types="@cloudflare/workers-types" />

// Same-origin proxy as a Cloudflare Pages Function.
//
// Every request to `financial.gatolandios.com.br/api/*` is handled here, in the SAME
// Pages project as the SPA — no separate Worker, no route precedence to manage. This
// strips the `/api` prefix (the backend expects `/auth/login`, not `/api/auth/login` —
// CONTRACT.md §11) and forwards to the Finance API via the `FINANCE_API` service binding.
//
// `new Request(url, request)` preserves method, body, query, and headers (incl. the
// session cookie). The API's response — including `Set-Cookie` and redirect `Location` —
// is returned to the browser unchanged. This mirrors, in production, the `rewrite` the
// dev server does in vite.config.ts.

interface Env {
  // Service binding to the existing `finance-api` Worker (declared in wrangler.toml).
  FINANCE_API: Fetcher
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  // Strip the `/api` prefix; `/api` and `/api/` both map to `/`.
  url.pathname = url.pathname.replace(/^\/api/, '') || '/'
  return env.FINANCE_API.fetch(new Request(url, request))
}
