# same-origin-routing

## Purpose

Definir a montagem mesmo-origin na Cloudflare: um único Worker (Workers + Static Assets)
serve o SPA e encaminha `/api/*` para a Finance API (Worker `finance-api`), preservando o
cookie de sessão ao longo do login, sem CORS.

## Requirements

### Requirement: Roteação mesmo-origin de /api para a Finance API

A infra SHALL fazer com que requisições para `financial.gatolandios.com.br/api/*` sejam
servidas pela Finance API (Worker `finance-api`) no MESMO origin do SPA, sem CORS. Um
**único Worker** (Workers + Static Assets) SHALL receber as requisições e encaminhar `/api/*`.

#### Scenario: /api é encaminhado; o resto serve o SPA

- **WHEN** o browser requisita um caminho sob `financial.gatolandios.com.br/api/*`
- **THEN** o Worker (`worker/index.ts`) encaminha a requisição para a Finance API
- **AND** caminhos fora de `/api/*` são servidos como assets estáticos (`env.ASSETS`), com
  fallback para `index.html` em rotas client-side

#### Scenario: Remoção do prefixo /api no encaminhamento

- **WHEN** o Worker recebe uma requisição para `/api/auth/login` (ou qualquer `/api/<rota>`)
- **THEN** ele encaminha para a Finance API com o caminho `/auth/login` (prefixo `/api`
  removido), espelhando o `rewrite` que o dev-server faz
- **AND** o encaminhamento usa o service binding `FINANCE_API` para o Worker `finance-api`
  (sem hop público/cross-origin)

#### Scenario: Preservação de método, corpo e cabeçalhos

- **WHEN** o Worker encaminha uma requisição (ex.: `POST /api/transactions` com corpo
  JSON, ou `POST /api/auth/logout`)
- **THEN** método, corpo, query string e cabeçalhos (incluindo o cookie de sessão) são
  preservados no encaminhamento
- **AND** o status, corpo e cabeçalhos da resposta da API (incluindo `Set-Cookie` e
  `Location` de redirects) são repassados ao browser sem alteração

### Requirement: Cookie de sessão funciona no mesmo origin

A montagem mesmo-origin SHALL preservar o cookie `fa_session` ao longo do fluxo de login,
sem exigir CORS nem `SameSite=None`.

#### Scenario: Login fecha o ciclo no mesmo host

- **WHEN** o usuário inicia login (`GET /api/auth/login`), o backend conduz o OIDC e
  redireciona com `Set-Cookie: fa_session=...` e `Location: /`
- **THEN** o cookie é host-only para `financial.gatolandios.com.br` (mesmo host do SPA) e o
  `302 → /` cai no SPA servido pelos Static Assets, já autenticado
- **AND** nenhuma configuração de CORS é necessária

#### Scenario: redirect_uri do OIDC volta pelo host do front

- **WHEN** o backend inicia o OIDC
- **THEN** o `redirect_uri` é `https://financial.gatolandios.com.br/api/auth/callback` (host
  do front, com `/api`), de modo que os cookies transientes `fa_oidc_*` (host-only do front)
  são enviados no callback
- **AND** um callback por outro host (ex.: o domínio do backend) faria o login falhar com
  `401 "invalid login state"`
