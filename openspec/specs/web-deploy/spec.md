# web-deploy

## Purpose

Definir a publicação do front como um Cloudflare Worker (Workers + Static Assets) via
`wrangler deploy` / Cloudflare Builds: build de `dist/`, domínio custom, fallback de SPA e
headers de segurança — sem segredos no repositório nem no bundle.

## Requirements

### Requirement: Publicação do SPA como Cloudflare Worker com Static Assets

O SPA SHALL ser publicado como um Cloudflare Worker (Workers + Static Assets) a partir do
diretório de build `dist/`, servido no domínio custom `financial.gatolandios.com.br`, via
`wrangler deploy`.

#### Scenario: Build e publish

- **WHEN** o deploy é executado
- **THEN** o front é buildado com `npm run build` (saída em `dist/`) e publicado com
  `wrangler deploy`, que bundla `worker/index.ts` e sobe `dist/` como assets
- **AND** o service binding `FINANCE_API` e o binding `ASSETS` são lidos de `wrangler.toml`
- **AND** nenhum segredo é incluído no bundle (apenas caminhos relativos `/api`)

#### Scenario: Domínio custom

- **WHEN** o deploy é executado com o domínio declarado em `wrangler.toml`
  (`routes` com `custom_domain = true`)
- **THEN** `wrangler` provisiona/mantém `financial.gatolandios.com.br` (DNS + SSL, zone
  `gatolandios.com.br`) apontando todo o tráfego do host para o Worker
- **AND** tanto o SPA quanto `/api/*` chegam ao Worker pelo mesmo host

### Requirement: Fallback de SPA

O Worker SHALL servir `index.html` para rotas de navegação client-side que não correspondem
a um asset, para que refresh/deep-link funcionem.

#### Scenario: Refresh em rota client-side

- **WHEN** o browser navega/atualiza em um caminho que não é um arquivo estático nem `/api/*`
- **THEN** o Worker responde `index.html` com status `200`
  (`not_found_handling = "single-page-application"`)

#### Scenario: /api não é capturado pelo fallback

- **WHEN** a requisição é para `/api/*`
- **THEN** o Worker a encaminha para a Finance API e NÃO serve `index.html`

### Requirement: Headers de segurança nos assets

O **Worker** (`worker/index.ts`) SHALL anexar headers de segurança às respostas de asset do
SPA (e NÃO às respostas de `/api/*`), sendo a fonte autoritativa desses headers. Os headers
SHALL incluir a **CSP completa** — incluindo `frame-ancestors 'none'`, que o `<meta>` do
HTML **não** consegue definir — além de `Strict-Transport-Security`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy` restritivo e `X-Frame-Options: DENY`.
Não se SHALL depender de `public/_headers` (mecanismo de Cloudflare Pages, não garantido sob
Workers + Static Assets); o `<meta>` CSP do `index.html` permanece apenas como fallback para
servir estático sem o Worker.

#### Scenario: Headers presentes nas respostas do SPA

- **WHEN** o Worker serve um documento/asset do SPA (via `env.ASSETS`)
- **THEN** a resposta inclui `Content-Security-Policy` (com `frame-ancestors 'none'`),
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`
  restritivo e `X-Frame-Options: DENY`

#### Scenario: frame-ancestors é entregue como header, não via meta

- **WHEN** a proteção contra enquadramento (clickjacking) é aplicada
- **THEN** `frame-ancestors 'none'` vem no header `Content-Security-Policy` da resposta (o
  `<meta>` não a define, por ser ignorada ali)

#### Scenario: Respostas de API não são tocadas

- **WHEN** o Worker encaminha uma requisição `/api/*` para a Finance API
- **THEN** a resposta do backend passa intocada (Set-Cookie, Location e demais headers), sem
  os headers de segurança do SPA serem sobrepostos

### Requirement: Deploy via Cloudflare Builds (conectado ao repositório)

O deploy SHALL ser executado pela Cloudflare Builds a partir do repositório conectado, sem
segredos no repositório nem no bundle.

#### Scenario: Deploy no push para main

- **WHEN** há push para `main`
- **THEN** a Cloudflare Builds roda `npm run build` e então `npx wrangler deploy`
- **AND** roda no contexto da conta Cloudflare, sem precisar de secrets commitados
