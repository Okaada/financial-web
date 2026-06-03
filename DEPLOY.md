# Deploy — Finance Web

Um único projeto na **Cloudflare Pages**: o SPA é servido de `dist/` e as requisições
`/api/*` são tratadas no mesmo origin por uma **Pages Function**
(`functions/api/[[path]].ts`), que encaminha para a Finance API (Worker `finance-api`)
via service binding — sem CORS, sem Worker separado. Um build, um deploy.

## Pré-condições

- O Worker **`finance-api`** existe na mesma conta Cloudflare (alvo do service binding
  `FINANCE_API` em `wrangler.toml`). Se o nome mudar, ajuste o `service` lá.
- Projeto Pages `finance-web` criado uma vez (o primeiro `wrangler pages deploy` cria, ou
  rode `wrangler pages project create finance-web --production-branch main`).
- Domínio custom `financial.gatolandios.com.br` anexado ao projeto Pages (uma vez, pelo
  dashboard ou `wrangler pages domain add`). A Cloudflare gerencia o CNAME na zone.
- Secrets de CI (GitHub Actions): `CLOUDFLARE_API_TOKEN` (escopo **Pages: Edit**) e
  `CLOUDFLARE_ACCOUNT_ID`. Nunca no repo nem no bundle.

## Deploy

A cada push em `main`, `.github/workflows/deploy.yml` builda e publica:

```bash
npm ci && npm run build
npx wrangler pages deploy dist --project-name finance-web --branch main
```

A Pages Function (`functions/`) e o binding `FINANCE_API` (`wrangler.toml`) sobem junto com
o deploy — não há passo separado.

Para publicar manualmente:

```bash
! npx wrangler login          # login interativo (rode você mesmo nesta sessão)
npm run build && npx wrangler pages deploy dist --project-name finance-web --branch main
```

> Se a conta não aplicar o binding declarado no `wrangler.toml`, configure o service
> binding `FINANCE_API → finance-api` uma vez em Pages → Settings → Functions → Service
> bindings.

## Como o mesmo-origin funciona

- `/api/*` é atendido pela Pages Function (precede os assets estáticos); todo o resto serve
  o SPA, com fallback `index.html` via `public/_redirects` para deep-links/refresh.
- A Function remove o prefixo `/api` (`/api/auth/login` → `/auth/login`) e encaminha via
  service binding — espelha o `rewrite` do `vite.config.ts` em dev.
- O cookie `fa_session` é **host-only** para `financial.gatolandios.com.br`; como login,
  callback e o `302 → /` passam pelo mesmo host, o ciclo fecha sem CORS nem `SameSite=None`.

## Verificação pós-deploy

- `GET /api/...` responde da API (não a página do SPA); demais rotas servem `index.html`.
- Fluxo completo: abrir o app sem sessão → redireciona para `/api/auth/login` → Google →
  volta autenticado para `/` → listar/criar transações → **Sair** limpa a sessão.
