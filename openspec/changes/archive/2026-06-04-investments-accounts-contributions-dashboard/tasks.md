## 1. Tipos, paths e API

- [x] 1.1 `src/api/types.ts`: `Investment` ganha `initialValue`, `totalInvested`,
  `accountId: string | null`, e `name: string` (obrigatório). `CreateInvestmentInput =
  { name, type, currency, initialValue?, accountId? }`; substituir `RenameInvestmentInput` por
  `UpdateInvestmentInput = { name, initialValue, accountId: string | null }`;
  `InvestmentFilters` ganha `accountId`.
- [x] 1.2 `src/api/paths.ts`: `INVESTMENTS_BATCH_PATH` (`/investments/batch`).
- [x] 1.3 `src/features/investments/api.ts`: `listInvestments` aceita `accountId`; substituir
  `renameInvestment` por `updateInvestment(id, { name, initialValue, accountId })`;
  `createInvestment` com novo corpo; `createBatch(items)`; manter contributions/valuations/
  getInvestment/archive.

## 2. Seletor de conta de investimento

- [x] 2.1 `accounts/AccountSelect.tsx`: prop opcional `kind?: AccountKind` que filtra os itens
  por `kind`. (Investimentos usam `kind="investment"`.)

## 3. Tela de investimentos (novo modelo + dashboard)

- [x] 3.1 Formulário criar/editar: `name`, `type` (select; read-only na edição), `currency`
  (read-only na edição), `initialValue` (centavos, aceita negativo via `parseToCentsSigned`),
  seletor de conta (`kind=investment`). 400 → campo correspondente via `error.message`. PUT
  envia só `{ name, initialValue, accountId|null }`.
- [x] 3.2 Item de investimento: exibir `initialValue`, `totalInvested` e `currentValue`
  **distintos** (placeholder quando `currentValue` null); aporte → `addContribution` →
  re-buscar (`getInvestment`) → mostrar `totalInvested` atualizado com aviso de impacto;
  valuation → re-buscar para refletir `currentValue`; arquivar.
- [x] 3.3 Filtros (archived + accountId) e **dashboard**: agrupar a lista por `accountId` (com
  nome da conta de `listAccounts`) e por `type`, somando `totalInvested`/`currentValue` por
  moeda; grupo "sem conta" (`accountId null`). Não misturar moedas. Estados loading/empty/error;
  `404` no detalhe → "não encontrado".

## 4. Criação em lote

- [x] 4.1 Grade de lote de investimentos (linhas: name, type, currency, initialValue,
  accountId `kind=investment`); validação local (name/currency obrigatórios, initialValue
  válido, máx 100, não-vazio).
- [x] 4.2 Envio `createBatch`: `201` → confirma; `400` com `index` → destaca a linha
  (`error.message`, nada gravado); sem `index` → mensagem geral. Botão "Criar em lote" na tela
  de investimentos (sub-view com "voltar"), sem novo item de sidebar.

## 5. Qualidade

- [x] 5.1 `npm run typecheck`, `npm run lint`, `npm run build` verdes; zero `fetch(` fora de
  `client.ts`, zero `dangerouslySetInnerHTML`, nenhum recurso externo, JS não toca
  `fa_session`; o front não recalcula agregados (só agrupa/exibe/re-busca).
- [ ] 5.2 Verificação manual contra o backend real: criar com initialValue/conta; aporte
  atualiza `totalInvested` na hora; valuation reflete `currentValue`; editar (type/currency
  imutáveis, limpar conta); dashboard por conta/tipo/sem-conta por moeda; lote válido cria
  todos; lote inválido destaca a linha do `index`; `400` de conta não-investimento exibe
  mensagem; `404` → "não encontrado".
