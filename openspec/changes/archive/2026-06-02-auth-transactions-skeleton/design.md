## Context

A Finance Web é uma SPA React (Vite) + TypeScript, 100% atrás de autenticação, servida na
Cloudflare Pages. Ela consome a Finance API (repo separado) cujo contrato real está em
`CONTRACT.md` — a fonte da verdade para endpoints, shapes e status codes.

Este é o primeiro código de aplicação do repo: hoje não há scaffold, cliente HTTP nem
telas. Esta change estabelece o esqueleto mínimo utilizável (login + logout + estado de
sessão inferido + tela de transações) e, ao fazê-lo, fixa duas decisões transversais que
toda tela futura herda: a estratégia **mesmo-origin** e o **ponto único de acesso HTTP**.

Restrições herdadas do contrato e do contexto do projeto:

- **OIDC é 100% do backend.** O front nunca vê `client_secret`, nunca troca code por token,
  nunca processa `id_token`. Login é redirect; logout é `POST`.
- **Sessão é cookie `fa_session`** (`HttpOnly; Secure; SameSite=Lax`, TTL 15 min). O JS não
  lê nem grava o cookie; o browser o anexa sozinho em requisições same-origin.
- **`404` não revela existência:** recurso de outro tenant retorna `404` igual a inexistente.
- **`400` para id referenciado em corpo:** `categoryId` inválido/arquivado/não-pertencente
  enviado no corpo retorna `400`, não `404`.
- **Valores em centavos** (inteiro); formatação é responsabilidade do front.
- **Nomes reais de auth** (divergência registrada no CONTRACT.md §11): `GET /auth/login`,
  `POST /auth/logout`. NÃO existe `/auth/google/start`. Sob o roteamento mesmo-origin do
  Worker, ficam acessíveis como `/api/auth/login` e `/api/auth/logout`.

## Goals / Non-Goals

**Goals:**

- Uma única camada de cliente HTTP (wrapper de `fetch`) por onde toda chamada à API passa,
  com `credentials: 'same-origin'`, parse do envelope de erro e tratamento central de `401`.
- Login por navegação top-level; logout por `POST`; estado de autenticação inferido sem
  `whoami`.
- Tela de transações: listar + criar, com formatação de centavos, seletor de categoria e
  estados de UI explícitos (carregando/vazio/erro/sem-sessão).
- Fixar e documentar a estratégia mesmo-origin (sem CORS).

**Non-Goals:**

- Edição/exclusão de transação, filtros (`type`/`categoryId`/`cardId`/`from`/`to`).
- Recorrentes, investimentos, cartões/faturas, dashboard, conta/LGPD e admin.
- Qualquer manipulação de cookie/sessão pelo JS, refresh de token, ou cache de sessão
  client-side.
- Endpoint de `whoami` (não existe no contrato) — não inventar.

## Decisions

### D1 — Mesmo-origin, sem CORS

Front e API são servidos no mesmo origin: o app em `app.dominio` e a API roteada em
`app.dominio/api/*` (rota do Worker). Toda chamada usa caminho relativo `/api/...`.

- **Por que:** como o cookie de sessão é `SameSite=Lax` e `HttpOnly`, requisições
  same-origin o carregam automaticamente, sem preflight nem configuração de CORS, e sem que
  o JS precise (ou consiga) tocar no cookie. Cross-origin exigiria `SameSite=None`, CORS com
  credenciais e ampliaria a superfície de CSRF.
- **Consequência:** o front nunca usa URL absoluta para a API; nenhuma variável de ambiente
  de "API base URL" cross-origin. Em dev, o dev-server faz proxy de `/api` para o backend
  local (sem mudar o código do cliente).
- **Alternativa considerada:** API em subdomínio separado (`api.dominio`) + CORS. Rejeitada:
  mais configuração, cookie cross-site e mais superfície de ataque, sem benefício aqui.

### D2 — Cliente HTTP único (o "ponto único de acesso" do front)

Um módulo único (ex.: `src/api/client.ts`) expõe funções como `apiGet`/`apiPost` e é o
**único** lugar que chama `fetch` contra `/api/*`. Responsabilidades centralizadas:

1. Injeta `credentials: 'same-origin'` e `Content-Type: application/json` em toda chamada.
2. Faz parse do envelope `{ error: { code, message } }` e devolve um erro estruturado
   (`status`, `code`, `message`) — nunca a `Response` crua.
3. Trata `401` de forma central: dispara o login (navegação top-level). Nenhuma tela trata
   `401` por conta própria.
4. Classifica `404` como `not_found` estruturado (não dispara login, não é "erro de
   sistema"); deixa o chamador decidir como exibir.
5. `204` resolve com sucesso sem parsear corpo.

- **Por que:** espelha no front o "ponto único de acesso" do backend — comportamento de
  sessão/erro consistente e impossível de divergir tela a tela. Centralizar `401` evita
  que cada componente reimplemente o redirect (e erre).
- **Alternativa considerada:** `fetch` espalhado + interceptors ad-hoc. Rejeitada: duplica
  lógica de sessão/erro e abre brecha para inconsistência.

### D3 — Login/logout: redirect vs. fetch

- **Login** é **navegação top-level** (`window.location.assign('/api/auth/login')`), não
  `fetch`. O backend responde `302` para o Google e, ao final, `302` de volta para `/`. Um
  `fetch` não pode seguir esse fluxo de redirect entre origens nem setar o cookie de
  navegação corretamente — precisa ser o próprio browser navegando.
- **Logout** é `POST /api/auth/logout` via cliente HTTP (resposta `204`), seguido de
  redirect ao login. Como é uma mutação same-origin que limpa cookie, `fetch` é adequado.

### D4 — Estado de autenticação inferido (sem whoami)

O contrato não tem `whoami`. Ao montar o app (gate de autenticação), faz-se **uma** chamada
a um endpoint protegido leve — reaproveitando a própria carga inicial da tela de transações
(`GET /api/transactions`):

- `401` ⇒ sem sessão ⇒ login (via tratamento central de `401`).
- `2xx` ⇒ autenticado ⇒ renderiza a tela.

- **Por que reaproveitar `GET /api/transactions`:** evita uma chamada de sondagem extra e
  dedicada; a primeira tela já é protegida, então sua carga inicial é a própria prova de
  sessão. Mantém uma fonte única de verdade do estado (sem cache especulativo de "logado").
- **Alternativa considerada:** endpoint de sondagem dedicado. Rejeitada: não há `whoami` e
  inventar endpoint viola o contrato; uma chamada barata à própria tela basta.

### D5 — Centavos e formatação

`amount` trafega como inteiro em centavos. Helpers puros de formatação
(`formatCents(amount, currency)`) para exibição e parsing (`parseToCents(input)`) para o
envio. O envio sempre em centavos; nenhuma conversão implícita "float→money".

- **Por que:** dinheiro como inteiro evita erro de ponto flutuante; isolar em helpers
  testáveis garante consistência entre listagem e formulário.

### D6 — Estados de UI explícitos

Toda tela protegida modela explicitamente: `loading`, `empty`, `error`, `no-session`. O
estado `no-session` resulta do tratamento central de `401` (redirect), não de UI própria;
`error` cobre falhas não-`401` (ex.: `500`, rede) com retry; `empty` distingue lista vazia
de carregamento.

## Risks / Trade-offs

- **TTL de sessão curto (15 min) ⇒ `401` no meio do uso** → o tratamento central de `401`
  redireciona para o login de forma transparente; nenhuma tela precisa antecipar expiração.
  Trade-off aceito: o usuário pode ser mandado ao login após inatividade (sem refresh
  silencioso, que não existe no contrato).
- **Logout não revoga server-side (token válido até `exp`)** → mitigação: limpamos o cookie
  via `POST /auth/logout` e redirecionamos; documentar que é limpeza de cliente, não
  revogação. Sem ação adicional possível no front.
- **Sondagem por `GET /api/transactions` acopla o gate de auth à tela inicial** → mitigação:
  manter o gate desacoplado o suficiente para trocar o endpoint de prova se a tela inicial
  mudar no futuro; o estado de sessão deriva do cliente HTTP, não do componente.
- **XSS faria requisição autenticada mesmo com cookie `HttpOnly`** → mitigação obrigatória:
  sem `dangerouslySetInnerHTML` com dado não sanitizado; CSP restritiva; tratar
  `description`/`externalRef` (texto livre do usuário) como dados, nunca como HTML.
- **Confusão de nome de endpoint (`/auth/google/start` no contexto vs. `/auth/login` real)**
  → mitigação: CONTRACT.md §11 é autoritativo; usar `/api/auth/login`. Registrado aqui para
  não regredir.
- **Sem segredos no bundle** → nenhuma credencial OIDC no front; o bundle é público.
