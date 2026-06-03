## ADDED Requirements

### Requirement: Publicação do SPA na Cloudflare Pages

O SPA SHALL ser publicado na Cloudflare Pages a partir do diretório de build `dist/`,
servido no domínio custom `financial.gatolandios.com.br`, via Wrangler
(`wrangler pages deploy`).

#### Scenario: Build e publish

- **WHEN** o deploy é executado
- **THEN** o front é buildado com `npm run build` (saída em `dist/`) e publicado no projeto
  Pages com `wrangler pages deploy dist`
- **AND** a Pages Function (`functions/`) e o service binding `FINANCE_API` sobem no mesmo
  deploy, sem passo separado
- **AND** nenhum segredo é incluído no bundle (apenas caminhos relativos `/api`)

#### Scenario: Domínio custom

- **WHEN** o projeto Pages está provisionado e o domínio anexado
- **THEN** ele responde em `financial.gatolandios.com.br` (zone `gatolandios.com.br`)

### Requirement: Fallback de SPA

O Pages SHALL servir `index.html` para rotas de navegação client-side que não correspondem
a um asset, para que refresh/deep-link funcionem.

#### Scenario: Refresh em rota client-side

- **WHEN** o browser navega/atualiza em um caminho que não é um arquivo estático nem `/api/*`
- **THEN** o Pages responde `index.html` com status `200` (via `_redirects`
  `/* /index.html 200`)

#### Scenario: /api não é capturado pelo fallback

- **WHEN** a requisição é para `/api/*`
- **THEN** ela é atendida pela Pages Function antes dos assets estáticos e NÃO recebe o
  fallback de `index.html`

### Requirement: Headers de segurança no Pages

O Pages SHALL enviar headers de segurança que o `<meta>` do HTML não cobre, complementando
a CSP já presente no `index.html`.

#### Scenario: Headers presentes nas respostas do SPA

- **WHEN** o Pages serve um documento/asset do SPA
- **THEN** a resposta inclui, via `public/_headers`, ao menos
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` e um `Referrer-Policy`
  restritivo

### Requirement: Deploy via CI com Wrangler

O deploy SHALL ser executado por CI usando Wrangler, autenticado por secrets do CI, sem
segredos no repositório nem no bundle.

#### Scenario: Deploy no push para main

- **WHEN** há push para `main`
- **THEN** o CI builda o front e publica o Pages (com a Function embutida) via
  `wrangler pages deploy`
- **AND** a autenticação usa `CLOUDFLARE_API_TOKEN` (escopo Pages: Edit) e
  `CLOUDFLARE_ACCOUNT_ID` como secrets do CI, nunca commitados
