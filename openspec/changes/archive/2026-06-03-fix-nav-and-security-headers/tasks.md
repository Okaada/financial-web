## 1. Correção do crash de navegação

- [x] 1.1 Em `src/App.tsx`, extrair `CurrentScreen` que renderiza a tela ativa como
  **componente** (`<Screen />` / `<DashboardScreen … />`) em vez de chamar `SCREENS[view]()`,
  isolando os hooks de cada tela e eliminando o React `#310` ao navegar.

## 2. Headers de segurança no Worker

- [x] 2.1 Em `worker/index.ts`, anexar nas respostas de **asset** (nunca em `/api/*`) a CSP
  completa (com `frame-ancestors 'none'`) + `Strict-Transport-Security` +
  `X-Content-Type-Options: nosniff` + `Referrer-Policy: no-referrer` + `X-Frame-Options:
  DENY`, via `withSecurityHeaders`.
- [x] 2.2 Em `index.html`, remover `frame-ancestors` do `<meta>` (ignorado ali) e explicitar
  `script-src 'self'`; manter o `<meta>` como fallback.

## 3. Qualidade

- [x] 3.1 `npm run typecheck`, `npm run lint`, `npm run build` verdes; `dist/index.html` sem
  script inline; `wrangler deploy --dry-run` válido (bindings `ASSETS` + `FINANCE_API`).
- [ ] 3.2 Verificação manual pós-deploy: navegar entre todas as telas sem travar; conferir
  nos headers da resposta do SPA a CSP com `frame-ancestors` + HSTS + nosniff + referrer +
  X-Frame-Options; e (config de zona) desativar Rocket Loader/Browser Insights para limpar a
  injeção de script inline da Cloudflare.
