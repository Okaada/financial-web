## ADDED Requirements

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

- **WHEN** o Worker está publicado e o domínio custom anexado
- **THEN** ele responde em `financial.gatolandios.com.br` (zone `gatolandios.com.br`)

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

Os Static Assets SHALL enviar headers de segurança que o `<meta>` do HTML não cobre,
complementando a CSP já presente no `index.html`.

#### Scenario: Headers presentes nas respostas do SPA

- **WHEN** o Worker serve um documento/asset do SPA
- **THEN** a resposta inclui, via `public/_headers` (copiado para `dist/_headers`), ao menos
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` e um `Referrer-Policy`
  restritivo

### Requirement: Deploy via Cloudflare Builds (conectado ao repositório)

O deploy SHALL ser executado pela Cloudflare Builds a partir do repositório conectado, sem
segredos no repositório nem no bundle.

#### Scenario: Deploy no push para main

- **WHEN** há push para `main`
- **THEN** a Cloudflare Builds roda `npm run build` e então `npx wrangler deploy`
- **AND** roda no contexto da conta Cloudflare, sem precisar de secrets commitados
