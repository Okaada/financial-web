## Context

Já existe a feature de investimentos (`web-investments`: listar/criar/renomear/arquivar +
aporte/valuation, com re-fetch após aporte/valuation) e as contas (§3.5). O CONTRACT §7 agora
tem `initialValue`/`totalInvested`/`accountId` + `PUT { name, initialValue, accountId }` +
`POST /investments/batch` + filtro `accountId`. O cliente único é `client.ts` (com
`ApiError.index` para batch, já adicionado na feature de transações). Helpers: `money.ts`
(`formatCents`, `parseToCentsSigned`), `accounts/api.ts` (`listAccounts`, `getAccount`),
`accounts/AccountSelect`.

## Goals / Non-Goals

**Goals:**
- Modelo novo (initialValue/totalInvested/currentValue distintos; accountId).
- Aporte → re-fetch → `totalInvested` atualizado na hora.
- Seletor de conta só `kind=investment`; dashboard por conta e por tipo (por moeda).
- Edição completa (name/initialValue/accountId; type/currency imutáveis); criação em lote.

**Non-Goals:**
- NÃO recalcular agregados (`totalInvested`/`totalContributed`/`currentValue`) no front.
- NÃO converter/misturar moedas nos totais.
- NÃO inventar endpoint — só §7 (+ batch) e §3.5.

## Decisions

### 1. Tipos e API

`Investment` ganha `initialValue`, `totalInvested`, `accountId`, e `name: string` (obrigatório).
`CreateInvestmentInput = { name, type, currency, initialValue?, accountId? }`;
`UpdateInvestmentInput = { name, initialValue, accountId: string | null }` (substitui o
rename). `InvestmentFilters` ganha `accountId`. `investments/api.ts`: `listInvestments`
(archived+accountId), `updateInvestment` (PUT novo), `createBatch`, mantém
contributions/valuations/getInvestment/archive.

### 2. `AccountSelect` com filtro por `kind`

Adiciona-se uma prop opcional `kind?: AccountKind` ao `AccountSelect` que filtra os itens
carregados (`listAccounts({archived:false})`) por `kind === props.kind`. Investimentos usam
`kind="investment"`. Reuso do mesmo componente (sem duplicar).

### 3. Aporte → re-fetch → totalInvested

Após `addContribution` `201`, chama `getInvestment(id)` e substitui o item na lista pelo
recurso re-buscado; um aviso curto sinaliza o novo `totalInvested`. Mesmo padrão para
valuation (re-fetch para refletir `currentValue`). O front nunca soma.

### 4. Dashboard por conta e por tipo (agrupamento da lista)

Computa-se, da lista retornada (sem paginação): (a) por `accountId` → por `currency` →
Σ`totalInvested` (e Σ`currentValue` quando não-null); (b) por `type` → por `currency` →
Σ`totalInvested`; (c) grupo "sem conta" (`accountId null`). Nome da conta vem de um mapa
`id→name` de `listAccounts()`. É agregação de apresentação sobre valores já derivados —
nunca recalcula o agregado de um investimento, nunca soma moedas distintas.

### 5. Edição: type/currency read-only

O `PUT` envia só `{ name, initialValue, accountId }`. `type`/`currency` aparecem como
somente-leitura. `accountId` "sem conta" → `null` (limpa o vínculo). O `400` de
`accountId`/`initialValue` é mapeado ao campo correspondente pela `error.message`.

### 6. Lote (`POST /investments/batch`)

`createBatch(items)` reusa o padrão de transações: `ApiError.index` (já existe) destaca a
linha do `400`. Acesso via botão "Criar em lote" na tela de investimentos (sub-view com
"voltar"), sem novo item de sidebar.

## Risks / Trade-offs

- **Reescrita da tela de investimentos** → grande, mas o modelo mudou substancialmente;
  preserva-se o padrão (estados, re-fetch, taxonomia).
- **Agrupar no front** → só sobre a lista completa de valores já derivados; sem misturar
  moedas; documentado.
- **`name` agora obrigatório** → o create exige `name`; dados antigos com nome continuam
  exibidos normalmente.

## Migration Plan

CONTRACT §7 já atualizado (pré-condição). Modifica `web-investments` e adiciona
`web-investments-batch`. Sem migração de dados, sem mudança de deploy. Rollback = reverter os
tipos/feature.

## Open Questions

- Série temporal de valuations (linha do tempo): opcional; por ora listar as valuations da
  sessão (sem endpoint de histórico). Pode evoluir depois.
