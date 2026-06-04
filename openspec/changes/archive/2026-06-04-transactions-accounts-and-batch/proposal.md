## Why

As contas (§3.5) já existem, mas os lançamentos ainda não se vinculam a elas: não há como
dizer "essa despesa saiu da conta X" nem ver os lançamentos/saldo por conta. Além disso, lançar
um a um é lento — o pedido principal é **entrada em lote** (tipo planilha). O backend agora
aceita `accountId` nas transações e expõe `POST /api/transactions/batch` (documentados no
CONTRACT §4). Esta mudança liga lançamentos a contas, adiciona a visão por conta com saldo, e
entrega o lançamento em lote all-or-nothing.

## What Changes

- **Vínculo com conta (`accountId`)** no formulário de transação (criar/editar): seletor de
  conta (`GET /api/accounts?archived=false`, só não-arquivadas), opcional. No `POST` omite
  quando vazio; no `PUT` (full replace) envia `null`.
- **Filtro e visão "por conta"**: filtro `accountId` na listagem; ao filtrar por uma conta,
  exibir o **saldo** dela (`GET /api/accounts/:id` → `currentBalance`) junto dos lançamentos.
- **Seletor de categoria compatível com o `type`**: o seletor passa a carregar categorias do
  **mesmo tipo** do lançamento (`GET /api/categories?type=income|expense`) — não mais fixo em
  `expense` — alinhando com a regra de compatibilidade do backend.
- **Feedback de saldo**: após criar/editar/excluir um lançamento vinculado a uma conta, o app
  **re-busca a conta afetada** e mostra o novo `currentBalance`, deixando claro o impacto.
- **Entrada em LOTE** (`POST /api/transactions/batch`) — o destaque:
  - UI tipo **grade/planilha**: adicionar várias linhas (e/ou colar), escolher conta/categoria
    por linha, validar localmente antes de enviar.
  - **All-or-nothing**: máx **100** itens; array vazio → bloqueado/`400`; se **um** item for
    inválido, o lote inteiro falha (`400` com `index`) e **nada** é gravado. A UI destaca a
    linha do `index` retornado com a `error.message`.
- **Regras de negócio como 400** (mensagem do backend, sem perder o formulário): categoria
  arquivada/não-própria/tipo incompatível; cartão arquivado/não-próprio; conta
  arquivada/não-própria; `type` inválido; `amount` não inteiro. Recurso por id de outro
  usuário → `404`.

## Capabilities

### New Capabilities
- `web-transactions-batch`: tela de lançamento em lote (grade), validação local por linha,
  envio `POST /api/transactions/batch` com semântica all-or-nothing e destaque da linha do
  `index` no `400`, com estados de UI.

### Modified Capabilities
- `web-transactions`: adiciona o **seletor de conta** (`accountId`) no formulário, o **filtro
  e visão por conta** (com `currentBalance`), o **feedback de saldo** após mutação, e altera o
  **seletor de categoria** para carregar pelo `type` do lançamento (não mais fixo em
  `expense`).

## Impact

- **Documentação**: CONTRACT.md §4 ganhou `accountId` (resource/POST/PUT/GET) e
  `POST /transactions/batch` — pré-condição desta mudança.
- **Código**: `src/api/types.ts` (Transaction/inputs ganham `accountId`; tipos de batch +
  erro com `index`); `src/api/paths.ts` (`TRANSACTIONS_BATCH_PATH`); `transactions/api.ts`
  (filtro `accountId`, `createBatch`, `listCategoriesByType`, reuso de `getAccount`); novo
  `AccountSelect`; `TransactionForm` (seletor de conta + categoria por type + 400→campo);
  `TransactionsScreen` (filtro/visão por conta + feedback de saldo); nova feature/tela de
  lote (`BatchEntryScreen` + grade) e item na sidebar. Tudo via o cliente único.
- **API**: só rotas do CONTRACT (§4 transactions/batch, §3.5 accounts, §5 categories). Sem
  segredo no bundle; valores em centavos; JS não toca `fa_session`; CSP intacta.
