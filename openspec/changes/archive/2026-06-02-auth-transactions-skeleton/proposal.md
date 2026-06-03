## Why

A Finance Web ainda não tem nenhuma camada de acesso à Finance API nem qualquer tela
autenticada. Antes de construir dashboard, cartões ou investimentos, precisamos do
esqueleto que torna o app utilizável: entrar (login via redirect do backend), sair, e
uma primeira tela real que prove o caminho ponta-a-ponta (listar e criar transações).
Esse esqueleto também fixa, de uma vez, a estratégia mesmo-origin e o ponto único de
acesso HTTP — decisões que toda tela futura vai herdar.

## What Changes

- **Cliente HTTP único (wrapper de `fetch`).** Toda chamada à API passa por uma camada
  única que injeta `credentials: 'same-origin'`, faz o parse do envelope de erro
  `{ error: { code, message } }`, e centraliza o tratamento de `401` (→ login). Nenhum
  componente chama `fetch` diretamente.
- **Login por navegação top-level.** Login NÃO é `fetch`: é navegação de página inteira
  do browser para `GET /api/auth/login` (`window.location.assign`). O backend conduz todo
  o OIDC e redireciona de volta para `/`. O front nunca vê token, secret ou `id_token`.
- **Logout** via `POST /api/auth/logout` (através do cliente HTTP), seguido de redirect
  para o login.
- **Estado de autenticação inferido (sem `whoami`).** Como o CONTRACT.md não expõe
  endpoint de identidade, ao carregar o app fazemos uma chamada a um endpoint protegido;
  `401` significa "sem sessão" → redireciona para login; sucesso significa "autenticado".
- **Tela de transações.** Listar via `GET /api/transactions` (resposta `{ items: [...] }`)
  e criar via `POST /api/transactions` (`{ type, amount, currency, occurredOn,
  categoryId?, description? }`). `amount` é inteiro em centavos: formatado na exibição,
  enviado em centavos.
- **Seletor de categoria** no formulário, lendo `GET /api/categories?type=expense`.
- **Tratamento contratual de erros de transação:** `404` que não revela existência
  (tratado como "não encontrado", não como falha de sistema) e `400` de
  `categoryId` inválido/arquivado/não-pertencente (mensagem de validação no formulário).
- **Estados de UI explícitos** em toda tela protegida: carregando, vazio, erro e
  sem-sessão.

Diferido para changes futuras (fora de escopo aqui): edição/exclusão de transação,
filtros (`type`/`categoryId`/`cardId`/`from`/`to`), recorrentes, investimentos, cartões e
faturas, dashboard, e telas de conta/admin (LGPD).

## Capabilities

### New Capabilities
- `web-http-client`: camada única de acesso HTTP do front — wrapper de `fetch` com
  `credentials: 'same-origin'`, parse do envelope de erro `{ error: { code, message } }`,
  e tratamento central de `401` (→ login). Ponto único por onde toda chamada passa.
- `web-session-auth`: ciclo de sessão no front — login por navegação top-level para
  `GET /api/auth/login`, logout via `POST /api/auth/logout`, e inferência do estado de
  autenticação por sondagem de endpoint protegido (sem `whoami`), com `401` → login.
- `web-transactions`: tela de transações — listar (`GET /api/transactions`) e criar
  (`POST /api/transactions`) com formatação de centavos, seletor de categoria
  (`GET /api/categories?type=expense`), e estados de UI explícitos
  (carregando/vazio/erro/sem-sessão).

### Modified Capabilities
<!-- Nenhuma: não há specs existentes em openspec/specs/. -->

## Impact

- **Novo projeto front:** scaffold Vite + React + TypeScript (`package.json`, build,
  estrutura `src/`). Este é o primeiro código de aplicação do repo.
- **API consumida (mesmo-origin, sob `/api/*`):** `GET /api/auth/login` (redirect),
  `POST /api/auth/logout`, `GET /api/transactions`, `POST /api/transactions`,
  `GET /api/categories`. Endpoints conforme CONTRACT.md (fonte da verdade) — note que o
  login real é `/auth/login`, não `/auth/google/start`.
- **Decisão transversal fixada aqui:** mesmo-origin (front e API em
  `app.dominio` + `app.dominio/api`) ⇒ sem CORS; sessão é cookie `HttpOnly` que o browser
  anexa sozinho; o JS nunca lê/grava o cookie.
- **Sem segredos no bundle**; higiene de XSS (sem `dangerouslySetInnerHTML` com dado não
  sanitizado).
