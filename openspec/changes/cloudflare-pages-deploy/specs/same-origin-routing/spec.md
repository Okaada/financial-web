## ADDED Requirements

### Requirement: Roteação mesmo-origin de /api para a Finance API

A infra SHALL fazer com que requisições para `financial.gatolandios.com.br/api/*` sejam
servidas pela Finance API (Worker `finance-api`) no MESMO origin do SPA, sem CORS. Uma
**Pages Function** no próprio projeto Pages SHALL atender essas requisições.

#### Scenario: /api é atendido pela Pages Function

- **WHEN** o browser requisita um caminho sob `financial.gatolandios.com.br/api/*`
- **THEN** a Pages Function (`functions/api/[[path]].ts`) atende a requisição (precede os
  assets estáticos do Pages)
- **AND** caminhos fora de `/api/*` continuam sendo servidos pelo Pages (SPA)

#### Scenario: Remoção do prefixo /api no encaminhamento

- **WHEN** a Function recebe uma requisição para `/api/auth/login` (ou qualquer `/api/<rota>`)
- **THEN** ela encaminha para a Finance API com o caminho `/auth/login` (prefixo `/api`
  removido), espelhando o `rewrite` que o dev-server faz
- **AND** o encaminhamento usa o service binding `FINANCE_API` para o Worker `finance-api`
  (sem hop público/cross-origin)

#### Scenario: Preservação de método, corpo e cabeçalhos

- **WHEN** a Function encaminha uma requisição (ex.: `POST /api/transactions` com corpo
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
  `302 → /` cai no SPA servido pelo Pages, já autenticado
- **AND** nenhuma configuração de CORS é necessária
