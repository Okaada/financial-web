## 1. Assets do SPA

- [x] 1.1 Fallback de SPA via `not_found_handling = "single-page-application"` no `wrangler.toml` (substitui `public/_redirects`)
- [x] 1.2 Criar `public/_headers` com headers de segurança (HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`) complementando a CSP do `index.html` (copiado para `dist/_headers`)
- [x] 1.3 `wrangler.toml` do Worker (`main = "worker/index.ts"`, `[assets] directory = "./dist"`, `compatibility_date`)

## 2. Proxy mesmo-origin (Worker + Static Assets)

- [x] 2.1 Criar `worker/index.ts`: encaminha `/api/*` (prefixo removido) via service binding `FINANCE_API`; demais rotas → `env.ASSETS` (SPA)
- [x] 2.2 Declarar os bindings `FINANCE_API → finance-api` e `ASSETS` no `wrangler.toml` (um Worker só, sem projeto extra)
- [x] 2.3 Adicionar `@cloudflare/workers-types` (apenas tipos) para o Worker; nenhum `node_modules` adicional
- [x] 2.4 Validar a config com `wrangler deploy --dry-run` (entry-point + assets + bindings ok)

## 3. Deploy (Cloudflare Builds)

- [x] 3.1 Repositório conectado à Cloudflare (Workers → Builds); deploy no push para `main`
- [x] 3.2 Build command `npm run build` e deploy command `npx wrangler deploy` nas configurações de Build
- [x] 3.3 Sem secrets no repo/bundle — a Cloudflare Builds roda no contexto da conta

## 4. Domínio custom e provisionamento

- [x] 4.1 Declarar o domínio custom `financial.gatolandios.com.br` no `wrangler.toml` (`routes` com `custom_domain = true`): `wrangler deploy` provisiona DNS + SSL e mantém o host anexado ao Worker, sem passo manual
- [x] 4.2 Sem Terraform: front simples sem segredos; o provisionamento é a conexão do repo + o domínio declarado no `wrangler.toml`, o deploy é o próprio `wrangler deploy`

## 5. Documentação e verificação

- [x] 5.1 Documentar (DEPLOY.md) a pré-condição do Worker `finance-api`, os bindings, os comandos de Build e o domínio custom
- [ ] 5.2 Verificar: `/api/*` responde da API; demais rotas servem `index.html`
- [ ] 5.3 Verificar o fluxo de login completo em produção (start → callback → `302 /` autenticado) e logout, confirmando cookie `fa_session` no host
