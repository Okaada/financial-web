## 1. Cadastro gated (signup_denied)

- [x] 1.1 `src/api/authState.ts`: adicionar o status `signup_denied` + `markSignupDenied()`.
- [x] 1.2 `src/api/client.ts`: ao receber `403`, ler `error.code`; se `signup_denied`, chamar
  `markSignupDenied()` e lançar erro (não resolver com dados). Outros `403` → `ApiError`
  normal.
- [x] 1.3 Criar `src/features/auth/InviteOnlyScreen.tsx`: card centralizado "acesso por
  convite" com botão "Sair" (reusa `logout()`); reusar estilos `.login*`.
- [x] 1.4 `src/App.tsx`: rotear o estado `signup_denied` → `InviteOnlyScreen` (no gate de
  auth, antes do shell).

## 2. API, tipos e helpers de contas

- [x] 2.1 `src/api/paths.ts`: `ACCOUNTS_PATH` + `accountPath(id)` + `accountArchivePath(id)`.
- [x] 2.2 `src/api/types.ts`: `AccountKind = 'checking'|'cash'|'wallet'|'investment'`,
  `Account` (`{ id, name, kind, currency, openingBalance, currentBalance, archived,
  createdAt, updatedAt }`), `CreateAccountInput`, `UpdateAccountInput` (sem `currency`).
- [x] 2.3 `src/features/accounts/api.ts`: `listAccounts(filters?)`, `getAccount(id)`,
  `createAccount`, `updateAccount`, `archiveAccount` — via o cliente único.
- [x] 2.4 `src/features/accounts/taxonomy.ts`: `ACCOUNT_KINDS` + `accountKindLabel`.
- [x] 2.5 `src/lib/money.ts`: adicionar `parseToCentsSigned` (aceita `-` opcional; `''` → 0),
  para o `openingBalance` (pode ser negativo).

## 3. Telas de contas

- [x] 3.1 `AccountForm.tsx`: criar/editar — `name`, `kind` (select da taxonomia), `currency`
  (editável só na criação; somente-leitura na edição), `openingBalance` (centavos, aceita
  negativo). Erro `400` inline via `error.message`.
- [x] 3.2 `AccountsScreen.tsx`: **visão geral** (totais de `currentBalance` por `currency`,
  normais vs. investimento), filtro arquivadas, lista (nome/tipo/moeda/saldos formatados),
  criar, editar, arquivar; estados loading/empty/error; `404` no detalhe → "não encontrada".
- [x] 3.3 `App.tsx`: adicionar a view `accounts` na sidebar (rótulo "Contas") + ícone SVG
  inline em `NavIcons`.

## 4. Qualidade

- [x] 4.1 `npm run typecheck`, `npm run lint`, `npm run build` verdes; zero `fetch(` fora de
  `client.ts`, zero `dangerouslySetInnerHTML`, nenhum recurso externo, JS não toca
  `fa_session`; o front não recalcula `currentBalance` (só agrupa/exibe).
- [ ] 4.2 Verificação manual contra o backend real: login → contas com saldo; visão geral por
  moeda (normais vs. investimento); criar/editar (currency imutável)/arquivar/detalhe; `404`
  → "não encontrada"; `400` inline; `403 signup_denied` → tela de convite.
