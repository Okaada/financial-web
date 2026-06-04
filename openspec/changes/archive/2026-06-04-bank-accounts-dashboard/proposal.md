## Why

O app já tem auth (login Google, logout, §9) e várias áreas, mas falta o "start do
monitoramento": o usuário entrar e ver suas **contas com saldo** num só lugar. O backend
agora expõe `/api/accounts` (documentado no CONTRACT §3.5) com `currentBalance` **derivado no
backend**. Falta também tratar o cadastro **gated por convite** (`403 signup_denied`), hoje
sem tela própria. Esta mudança entrega o dashboard de contas + CRUD e a tela de "acesso por
convite".

## What Changes

- **Tela "acesso por convite" (signup gated)**: quando uma chamada protegida retorna `403`
  com `code: "signup_denied"`, o app entra num estado dedicado e exibe uma tela explicando
  que o acesso é por convite (com opção de sair). Novo estado de auth além de
  autenticado/sem-sessão.
- **Dashboard de contas** (`/api/accounts`):
  - Listar `GET /api/accounts?archived=false` → `{ items: [...] }`, exibindo `name`, `kind`,
    `currency`, `openingBalance` e `currentBalance` (centavos → formatados como moeda).
  - **Visão geral**: total por **moeda** (somando `currentBalance` agrupado por `currency`
    sobre a lista completa retornada), separando **contas normais** de **investimento**
    (`kind = investment`). O front NÃO recalcula o saldo de cada conta — só agrupa os valores
    já derivados pelo backend.
- **CRUD de contas**:
  - **Criar** `POST /api/accounts { name, kind, currency, openingBalance? }` —
    `kind ∈ {checking, cash, wallet, investment}`, `openingBalance` em centavos (pode ser
    negativo, default 0); validar `kind`/`currency` no front; `400` inline.
  - **Editar** `PUT /api/accounts/:id { name, kind, openingBalance }` — `currency` é
    **imutável** (não enviada/editável).
  - **Arquivar** (soft-delete) `POST /api/accounts/:id/archive`; filtro mostrar/ocultar
    arquivadas; conta arquivada continua legível e com saldo, mas é sinalizada.
  - **Detalhe** `GET /api/accounts/:id`; `404` → "não encontrada" (nunca expõe existência).
- **Estados transversais**: `401` → tela de login (já central); `403 signup_denied` → tela de
  convite; `404` → "não encontrado"; `400` → erro de validação inline via `error.message`;
  loading/empty/error em todas as listas.

## Capabilities

### New Capabilities
- `web-accounts`: dashboard de contas (lista + visão geral por moeda, normais vs.
  investimento), CRUD (criar/editar com `currency` imutável/arquivar/detalhe) e estados de UI
  explícitos, exibindo `currentBalance` derivado pelo backend (sem recalcular no front).

### Modified Capabilities
- `web-session-auth`: adiciona o estado/ā tela de **"acesso por convite"** para
  `403 signup_denied`, ao lado de autenticado/sem-sessão.

## Impact

- **Documentação**: CONTRACT.md ganhou a §3.5 Bank accounts (fonte da verdade) — pré-condição
  desta mudança.
- **Código**: nova feature `src/features/accounts/` (api.ts + tipos + AccountsScreen +
  formulário + overview/detalhe); `src/api/types.ts` (Account + inputs); `src/api/paths.ts`
  (ACCOUNTS_PATH + helpers); `src/api/authState.ts` ganha `signup_denied`; `src/api/client.ts`
  detecta `403 signup_denied`; nova `InviteOnlyScreen`; `App.tsx` roteia o novo estado e
  adiciona a view `accounts` na sidebar. Tudo via o cliente único (`fetch(` só lá).
- **API**: só rotas já existentes (CONTRACT §2 auth/§3.5 accounts). Sem segredo no bundle, JS
  não toca `fa_session`, CSP intacta.
