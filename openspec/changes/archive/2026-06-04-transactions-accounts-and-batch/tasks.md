## 1. Tipos, paths e cliente

- [x] 1.1 `src/api/types.ts`: `Transaction` ganha `accountId: string | null`;
  `CreateTransactionInput` ganha `accountId?`; `UpdateTransactionInput` ganha
  `accountId: string | null`. Adicionar `TransactionFilters.accountId`. Tipos de batch:
  `BatchCreateInput = CreateTransactionInput[]` e envelope de resposta `{ items: Transaction[] }`.
- [x] 1.2 `src/api/paths.ts`: `TRANSACTIONS_BATCH_PATH` (`/transactions/batch`).
- [x] 1.3 `src/api/client.ts`: `ApiError` ganha `readonly index?: number`; `toApiError` lê
  `data.index` quando numérico (corpo `{ error: {...}, index }`). Não muda os demais erros.

## 2. API de transações (extensão)

- [x] 2.1 `transactions/api.ts`: `listTransactions` aceita filtro `accountId`;
  `create/updateTransaction` incluem `accountId` (POST omite quando vazio; PUT envia `null`);
  `listCategoriesByType(type)` (substitui/generaliza `listExpenseCategories`);
  `createBatch(items)` → `POST /api/transactions/batch`. Reusar `getAccount` de accounts.

## 3. Formulário e visão por conta

- [x] 3.1 `AccountSelect.tsx`: lista `GET /accounts?archived=false` + opção "sem conta".
- [x] 3.2 `TransactionForm`: adicionar seletor de conta; recarregar categorias pelo `type`
  (limpando categoria incompatível ao trocar o type); mapear `400` ao campo de
  conta/cartão/categoria via `error.message`; enviar `accountId` (omit/`null`).
- [x] 3.3 `TransactionsScreen`: filtro `accountId`; quando filtrado por conta, exibir
  `currentBalance` (via `getAccount`); após criar/editar/excluir com conta, re-buscar a(s)
  conta(s) afetada(s) (nova e anterior) e refletir o novo saldo com aviso de impacto.

## 4. Lançamento em lote (grade)

- [x] 4.1 `batch/BatchEntryScreen.tsx`: grade de linhas (type, amount→centavos, currency,
  occurredOn, accountId, categoryId por type, description), adicionar/remover linha + colar
  básico (linhas tab/nova-linha); validação local (obrigatórios, `amount` inteiro, máx 100,
  não-vazio).
- [x] 4.2 Envio `createBatch`: `201` → confirma e re-busca contas afetadas; `400` com `index`
  → destaca a linha do índice com `error.message` (deixando claro que nada foi gravado);
  `400` sem `index` → mensagem geral. Estados enviando/erro/sem-sessão.
- [x] 4.3 `TransactionsScreen`: botão "Lançar em lote" alterna para a grade (estado local, com
  "voltar") — sem novo item na sidebar.

## 5. Qualidade

- [x] 5.1 `npm run typecheck`, `npm run lint`, `npm run build` verdes; zero `fetch(` fora de
  `client.ts`, zero `dangerouslySetInnerHTML`, nenhum recurso externo, JS não toca
  `fa_session`; o front não recalcula saldo (só re-busca/exibe).
- [ ] 5.2 Verificação manual contra o backend real: filtrar por conta mostra saldo +
  lançamentos; criar/editar/excluir vinculado a conta reflete o novo saldo; lote válido cria
  todos; lote com item inválido falha inteiro e destaca a linha do `index`; `400` de
  categoria incompatível/cartão/conta exibe mensagem; `404` → "não encontrado".
