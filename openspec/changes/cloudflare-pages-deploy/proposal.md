## Why

A Finance Web já compila (`dist/`), mas não há nenhum caminho de publicação: nem deploy
do SPA, nem — o que é mais importante — a montagem **mesmo-origin** que faz
`financial.gatolandios.com.br/api/*` chegar na Finance API sem CORS. O cliente HTTP do
front assume esse contrato de origem (caminhos relativos `/api`, cookie anexado pelo
browser); sem a infra que o concretiza, o app não autentica em produção. Esta change
entrega o deploy e a roteação que tornam o esqueleto utilizável fora do dev.

## What Changes

- **Proxy mesmo-origin como Pages Function.** Uma Pages Function
  (`functions/api/[[path]].ts`) no próprio projeto Pages atende `/api/*` (precede os assets
  estáticos), remove o prefixo `/api` (o backend espera `/auth/login`, não `/api/auth/login`
  — CONTRACT.md) e encaminha para o Worker `finance-api` via **service binding** (sem hop
  público, sem CORS, cookie preservado). Espelha em produção o `rewrite` que o
  `vite.config.ts` faz em dev. Sem Worker separado e sem `node_modules` extra.
- **Deploy do SPA na Cloudflare Pages.** Projeto Pages servindo `dist/` no domínio custom
  `financial.gatolandios.com.br`, publicado via **Wrangler** (não build-on-push do dashboard).
  A Function e o service binding sobem no mesmo deploy.
- **Fallback de SPA e headers de segurança.** `public/_redirects`
  (`/* /index.html 200`) para refresh em rotas client-side; `public/_headers` com headers
  que `<meta>` não cobre (HSTS, `X-Content-Type-Options`, `Referrer-Policy`), complementando
  a CSP já presente no `index.html`.
- **CI de deploy (Wrangler).** Workflow que, no push para `main`, builda o front e publica o
  Pages (com a Function embutida) com `wrangler pages deploy`, usando `CLOUDFLARE_API_TOKEN`
  (escopo Pages: Edit) / `CLOUDFLARE_ACCOUNT_ID` como secrets (nenhum segredo no bundle).
- **Provisionamento mínimo (uma vez).** Criação única do projeto Pages e anexação do domínio
  custom (sem Terraform — front simples, sem segredos; o deploy é o próprio
  `wrangler pages deploy`).

Fora de escopo: qualquer mudança no código do front (a change `auth-transactions-skeleton`
cobre isso); configuração do próprio Worker `finance-api` (repo do backend); ambientes de
preview/staging além do necessário para validar produção; IaC/Terraform.

## Capabilities

### New Capabilities
- `web-deploy`: publicação do SPA na Cloudflare Pages via Wrangler/CI — build `dist/`,
  domínio custom, fallback de SPA e headers de segurança.
- `same-origin-routing`: roteação `app/api/*` → Finance API por uma Pages Function com
  service binding e remoção do prefixo `/api`, concretizando a estratégia mesmo-origin (sem
  CORS) que o cliente HTTP do front pressupõe.

### Modified Capabilities
<!-- Nenhuma: capacidades do front (web-http-client, web-session-auth, web-transactions) não mudam de requisito; esta change apenas as habilita em produção. -->

## Impact

- **Novos artefatos de infra/deploy no repo:** `public/_redirects`, `public/_headers`,
  `wrangler.toml` (Pages, com o service binding), `functions/api/[[path]].ts` (Pages
  Function) e o workflow de CI.
- **Cloudflare:** projeto Pages `finance-web` servindo o SPA e a Function em
  `financial.gatolandios.com.br`; service binding `FINANCE_API → finance-api`.
- **Dependência externa:** o Worker `finance-api` deve existir na mesma conta (alvo do
  service binding). O cookie `fa_session` é host-only para `financial.gatolandios.com.br`,
  então login/callback/`302 → /` fecham o ciclo no mesmo host.
- **Secrets de CI:** `CLOUDFLARE_API_TOKEN` (escopo Pages: Edit), `CLOUDFLARE_ACCOUNT_ID`
  (no CI, nunca no bundle).
