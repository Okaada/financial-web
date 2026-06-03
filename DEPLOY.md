# Deploy — Finance Web

Um **único Cloudflare Worker** (Workers + Static Assets): serve o SPA de `dist/` e faz o
proxy de `/api/*` para a Finance API (Worker `finance-api`) no mesmo origin, via service
binding — sem CORS, sem projeto separado. Deploy com `wrangler deploy`.

## Pré-condições

- O Worker **`finance-api`** existe na mesma conta Cloudflare (alvo do service binding
  `FINANCE_API` em `wrangler.toml`). Se o nome mudar, ajuste o `service` lá.
- A zone `gatolandios.com.br` está ativa na conta. O domínio custom
  `financial.gatolandios.com.br` é declarado em `wrangler.toml`
  (`routes = [{ pattern = "financial.gatolandios.com.br", custom_domain = true }]`): o
  próprio `wrangler deploy` provisiona o hostname (DNS + SSL) e o mantém anexado ao Worker.
  Não há passo manual no painel.

## Deploy (Cloudflare Builds — conectado ao repositório)

O repositório está conectado à Cloudflare (Workers → Builds). A cada push em `main` ela
roda, em ordem:

- **Build command:** `npm run build`  (gera `dist/`)
- **Deploy command:** `npx wrangler deploy`  (bundla `worker/index.ts` e sobe `dist/` como
  assets, lendo as bindings de `wrangler.toml`)

> Garanta esses dois comandos nas configurações de Build do Worker. O build **precisa** rodar
> antes do deploy para `dist/` existir. Nenhum secret é necessário no repo — a Cloudflare
> Builds roda no contexto da conta.

Para publicar manualmente:

```bash
! npx wrangler login          # login interativo (rode você mesmo nesta sessão)
npm run build && npx wrangler deploy
```

Validar a config sem publicar (offline): `npx wrangler deploy --dry-run`.

## Como o mesmo-origin funciona

- O custom domain manda **todo** o tráfego de `financial.gatolandios.com.br` para o Worker
  `finance-web` — não só o SPA, mas também `/api/*`.
- O front sempre chama caminhos relativos `/api/...` (`src/api/paths.ts`), então o browser
  bate no mesmo host e anexa o cookie `fa_session` automaticamente.
- O Worker recebe toda requisição e separa: `/api/*` é encaminhado à Finance API (prefixo
  `/api` removido: `/api/auth/login` → `/auth/login`) via service binding — espelha o
  `rewrite` do `vite.config.ts` em dev. Todo o resto vai para `env.ASSETS` (SPA), com
  fallback `index.html` via `not_found_handling = "single-page-application"`.
- O cookie `fa_session` é **host-only** para `financial.gatolandios.com.br`; como login,
  callback e o `302 → /` passam pelo mesmo host, o ciclo fecha sem CORS nem `SameSite=None`.
- Headers de segurança extra (HSTS, `nosniff`, `Referrer-Policy`) vêm de `public/_headers`,
  copiado para `dist/_headers` e servido pelos Static Assets.

## Verificação pós-deploy

- `GET /api/...` responde da API (não a página do SPA); demais rotas servem `index.html`.
- Fluxo completo: abrir o app sem sessão → redireciona para `/api/auth/login` → Google →
  volta autenticado para `/` → listar/criar transações → **Sair** limpa a sessão.
