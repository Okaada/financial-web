## Why

A Finance Web já compila (`dist/`), mas não há nenhum caminho de publicação: nem deploy
do SPA, nem — o que é mais importante — a montagem **mesmo-origin** que faz
`financial.gatolandios.com.br/api/*` chegar na Finance API sem CORS. O cliente HTTP do
front assume esse contrato de origem (caminhos relativos `/api`, cookie anexado pelo
browser); sem a infra que o concretiza, o app não autentica em produção. Esta change
entrega o deploy e a roteação que tornam o esqueleto utilizável fora do dev.

## What Changes

- **Um único Worker (Workers + Static Assets).** `worker/index.ts` serve o SPA de `dist/`
  (via binding `ASSETS`, com fallback de SPA) e atende `/api/*` removendo o prefixo `/api`
  (o backend espera `/auth/login`, não `/api/auth/login` — CONTRACT.md) e encaminhando para
  o Worker `finance-api` via **service binding** (sem hop público, sem CORS, cookie
  preservado). Espelha em produção o `rewrite` que o `vite.config.ts` faz em dev. Sem projeto
  separado e sem `node_modules` extra.
- **Deploy via `wrangler deploy`.** Publica o Worker (bundla `worker/index.ts` e sobe `dist/`
  como assets) no domínio custom `financial.gatolandios.com.br`.
- **Fallback de SPA e headers de segurança.** `not_found_handling = "single-page-application"`
  para refresh em rotas client-side; `public/_headers` (copiado para `dist/_headers`) com
  headers que `<meta>` não cobre (HSTS, `X-Content-Type-Options`, `Referrer-Policy`),
  complementando a CSP já presente no `index.html`.
- **Deploy via Cloudflare Builds.** Repositório conectado à Cloudflare; no push para `main`
  ela roda `npm run build` e `npx wrangler deploy`, no contexto da conta (sem secrets no
  repo/bundle).
- **Provisionamento mínimo (uma vez).** Conexão do repo + anexação do domínio custom (sem
  Terraform — front simples, sem segredos; o deploy é o próprio `wrangler deploy`).

Fora de escopo: qualquer mudança no código do front (a change `auth-transactions-skeleton`
cobre isso); configuração do próprio Worker `finance-api` (repo do backend); ambientes de
preview/staging além do necessário para validar produção; IaC/Terraform.

## Capabilities

### New Capabilities
- `web-deploy`: publicação do SPA como Cloudflare Worker (Static Assets) via `wrangler
  deploy` / Cloudflare Builds — build `dist/`, domínio custom, fallback de SPA e headers
  de segurança.
- `same-origin-routing`: roteação `app/api/*` → Finance API por um único Worker com service
  binding e remoção do prefixo `/api`, concretizando a estratégia mesmo-origin (sem CORS)
  que o cliente HTTP do front pressupõe.

### Modified Capabilities
<!-- Nenhuma: capacidades do front (web-http-client, web-session-auth, web-transactions) não mudam de requisito; esta change apenas as habilita em produção. -->

## Impact

- **Novos artefatos de infra/deploy no repo:** `public/_headers`, `wrangler.toml` (Worker,
  com `[assets]` e o service binding) e `worker/index.ts`.
- **Cloudflare:** Worker `finance-web` servindo o SPA (Static Assets) e o proxy `/api/*` em
  `financial.gatolandios.com.br`; service binding `FINANCE_API → finance-api`; repositório
  conectado via Cloudflare Builds.
- **Dependência externa:** o Worker `finance-api` deve existir na mesma conta (alvo do
  service binding). O cookie `fa_session` é host-only para `financial.gatolandios.com.br`,
  então login/callback/`302 → /` fecham o ciclo no mesmo host.
- **Secrets:** nenhum no repo/bundle — a Cloudflare Builds roda no contexto da conta.
