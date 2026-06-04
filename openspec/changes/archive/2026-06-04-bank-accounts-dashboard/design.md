## Context

O backend agora expõe `/api/accounts` (CONTRACT §3.5) com `currentBalance` derivado. O front
já tem o cliente HTTP único (`client.ts`, 401 central → estado "sem sessão"), o store de auth
observável (`authState.ts`: `unknown|authenticated|unauthenticated`), a sidebar, e helpers de
dinheiro (`money.ts`). Falta a área de contas e o tratamento do cadastro gated
(`403 signup_denied`).

## Goals / Non-Goals

**Goals:**
- Dashboard de contas (lista + visão geral por moeda, normais vs. investimento) e CRUD.
- Tela "acesso por convite" para `403 signup_denied`.
- Exibir `currentBalance` derivado pelo backend (nunca recalcular saldo de conta).

**Non-Goals:**
- NÃO vincular contas ao formulário de transações (campo `accountId` em lançamentos) — é
  outra mudança; aqui o saldo derivado já vem pronto.
- NÃO inventar endpoint — só o que está no CONTRACT §3.5/§2.
- NÃO recalcular saldos por conta no front.

## Decisions

### 1. `403 signup_denied` como terceiro estado de auth

`authState.ts` ganha o status `signup_denied`. O `client.ts`, ao receber `403`, lê o envelope
`{ error: { code } }`; se `code === 'signup_denied'`, chama `markSignupDenied()` e lança um
erro (não resolve com dados). Outros `403` viram `ApiError` normal. O `App` (já um gate de
auth via `useSyncExternalStore`) passa a renderizar `InviteOnlyScreen` nesse estado. A tela
oferece "Sair" (reusa `logout()`, que marca "sem sessão" → tela de login).

Alternativa: tratar 403 só nas telas. Rejeitada — é um estado global de acesso, melhor no
gate central.

### 2. Visão geral = agrupamento da lista completa (não recálculo)

`GET /accounts` retorna a lista completa (sem paginação, como os demais list endpoints). A
visão geral agrupa por `currency` e soma `currentBalance` (valores **já derivados** pelo
backend), separando `kind === 'investment'` dos demais. Isso é **agregação de apresentação**
sobre valores finais — não recalcula o saldo de nenhuma conta (a regra "front never sums" mira
recomputar agregados do backend; aqui apenas agrupamos balances prontos da lista completa).
Nunca soma moedas diferentes.

### 3. `currentBalance` read-only; `currency` imutável; `kind` fixo

A lista/detalhe exibem `currentBalance` formatado, nunca editável. O `PUT` envia só
`{ name, kind, openingBalance }` (sem `currency`), e o campo currency é somente-leitura na
edição. `kind` é um `select` da taxonomia fixa (`checking|cash|wallet|investment`), com
rótulos legíveis (helper de labels, como cards/investments).

### 4. `openingBalance` pode ser negativo

`money.ts#parseToCents` hoje rejeita negativos. Para o saldo inicial, adiciona-se um parser que
aceita sinal (`parseToCentsSigned`) — aceita `-` opcional e converte para centavos inteiros
(positivos ou negativos); `''` → trata como `0`/omitido. A exibição usa `formatCents`
(que já lida com negativos via `Intl`).

### 5. Estrutura espelhando cards/investments

`src/features/accounts/`: `api.ts` (list/get/create/update/archive), `taxonomy.ts`
(ACCOUNT_KINDS + label), `AccountsScreen.tsx` (overview + filtro + lista + criar),
`AccountForm.tsx` (criar/editar, currency read-only na edição), `AccountDetail.tsx`
(opcional inline). `paths.ts`: `ACCOUNTS_PATH` + `accountPath`/`accountArchivePath`.
`types.ts`: `Account`, `AccountKind`, `Create/UpdateAccountInput`. `App.tsx`: view `accounts`
na sidebar (+ ícone).

### 6. Credenciais do cookie

O cliente usa `credentials: 'same-origin'`, que **já** anexa o cookie `fa_session`
automaticamente no mesmo origin (o pedido mencionou `'include'`; em same-origin ambos enviam,
e `'same-origin'` é a opção mais estrita/correta). Mantido como está — o JS nunca lê o cookie.

## Risks / Trade-offs

- **Agrupar saldos no front** → Mitigação: só agrupa a lista completa (sem paginação) de
  valores já derivados; nunca recomputa saldo de conta nem soma moedas distintas.
- **`signup_denied` ocorrer só no onboarding** → O gate central cobre qualquer `403
  signup_denied` em qualquer chamada protegida (incl. a sondagem inicial), então a tela de
  convite aparece de forma consistente.
- **Parser de negativo** → Coberto por `parseToCentsSigned` com teste de sinal; `formatCents`
  já exibe negativos.

## Migration Plan

CONTRACT.md já recebeu §3.5 (pré-condição). Mudança aditiva no front (nova feature + novo
estado de auth + view na sidebar). Sem migração de dados, sem mudança de deploy. Rollback =
remover a feature/estado e a view.

## Open Questions

- Vincular `accountId` a transações (para o saldo refletir lançamentos criados no front) é uma
  evolução futura — depende de o `POST/PUT /transactions` aceitar `accountId` (não consta no
  §4 atual). Fora do escopo desta mudança.
