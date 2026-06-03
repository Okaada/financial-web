## 1. Assets de SPA no Pages

- [x] 1.1 Criar `public/_redirects` com fallback de SPA (`/* /index.html 200`)
- [x] 1.2 Criar `public/_headers` com headers de segurança (HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`) complementando a CSP do `index.html`
- [x] 1.3 Criar `wrangler.toml` do Pages (`pages_build_output_dir = "dist"`, `name = "finance-web"`, `compatibility_date`)

## 2. Proxy mesmo-origin (Pages Function)

- [x] 2.1 Criar `functions/api/[[path]].ts` que remove o prefixo `/api` e encaminha via service binding `FINANCE_API` (preservando método/corpo/headers/redirects)
- [x] 2.2 Declarar o service binding `FINANCE_API → finance-api` no `wrangler.toml` do Pages (sem Worker separado, sem rota de precedência)
- [x] 2.3 Adicionar `@cloudflare/workers-types` (apenas tipos) para a Function; nenhum projeto/`node_modules` adicional

## 3. CI de deploy (Wrangler)

- [x] 3.1 Criar workflow de CI (push em `main`) que roda `npm ci`, `npm run build` e gating (`typecheck`/`lint`)
- [x] 3.2 Publicar com `wrangler pages deploy dist --project-name finance-web` (a Function e o binding sobem junto, sem passo separado)
- [x] 3.3 Usar `CLOUDFLARE_API_TOKEN` (escopo **Pages: Edit**) e `CLOUDFLARE_ACCOUNT_ID` como secrets do CI; nenhum segredo no bundle/repo

## 4. Provisionamento (uma vez)

- [x] 4.1 Documentar a criação única do projeto Pages `finance-web` (`wrangler pages project create` ou primeiro deploy) e a anexação do domínio custom `financial.gatolandios.com.br`
- [x] 4.2 Sem Terraform: para um front simples sem segredos, o provisionamento é a criação única do projeto + domínio; o deploy é o próprio `wrangler pages deploy`

## 5. Documentação e verificação

- [x] 5.1 Documentar (DEPLOY.md) a pré-condição do Worker `finance-api`, o service binding, os secrets de CI e o deploy único
- [ ] 5.2 Verificar: `/api/*` é atendido pela Function (responde da API); demais rotas servem `index.html`
- [ ] 5.3 Verificar o fluxo de login completo em produção (start → callback → `302 /` autenticado) e logout, confirmando cookie `fa_session` no host
