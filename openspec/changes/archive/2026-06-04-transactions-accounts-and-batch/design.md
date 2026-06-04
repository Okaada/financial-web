## Context

A feature de transações já existe (`web-transactions`: lista, filtros, criar/editar/excluir,
seletores de categoria e cartão) e as contas (§3.5). O CONTRACT §4 agora tem `accountId` nas
transações e `POST /transactions/batch`. O cliente HTTP único é `client.ts` (único `fetch(`),
com 401/403 centrais e `ApiError` estruturado. Valores em centavos.

## Goals / Non-Goals

**Goals:**
- Vincular lançamentos a contas (`accountId`) e ver lançamentos/saldo por conta.
- Seletor de categoria compatível com o `type` do lançamento.
- Entrada em lote (grade) all-or-nothing com destaque do `index` no `400`.
- Feedback de saldo: re-buscar a conta afetada após mutação (sem recalcular no front).

**Non-Goals:**
- NÃO recalcular `currentBalance` no front (sempre re-busca o derivado).
- NÃO inventar endpoint — só §4 (transactions/batch), §3.5 (accounts), §5 (categories).
- NÃO um editor de planilha completo; a grade é simples (linhas + colar básico).

## Decisions

### 1. `accountId` em tipos/inputs e no full-replace do PUT

`Transaction` ganha `accountId: string | null`. `CreateTransactionInput` ganha `accountId?`
(omitido no POST quando "sem conta"); `UpdateTransactionInput` ganha `accountId: string | null`
(no PUT full-replace envia `null` quando "sem conta"), espelhando o tratamento já usado para
`cardId`.

### 2. Seletor de categoria por `type`

O `TransactionForm` recarrega o seletor de categoria quando o `type` muda: `income` →
`GET /categories?type=income`; `expense` → `type=expense`. Generaliza `listExpenseCategories`
para `listCategoriesByType(type)`. Se a categoria selecionada não pertence ao novo tipo, é
limpa. O `400` de categoria incompatível/arquivada continua mapeado ao campo de categoria.

### 3. `AccountSelect` (espelhando `CardSelect`)

Novo componente que lista `GET /accounts?archived=false` e oferece "sem conta". Reutilizado no
form único e na grade de lote. O mapeamento de `400` por id no corpo ganha o caso de conta
(além de cartão/categoria), pela `error.message`.

### 4. Visão por conta + feedback de saldo

Na `TransactionsScreen`, quando o filtro `accountId` está setado, busca-se `getAccount(id)` e
exibe-se o `currentBalance` num cabeçalho. Após qualquer mutação (criar/editar/excluir) que
envolva uma conta, re-busca-se a(s) conta(s) afetada(s) — no editar, tanto a conta nova quanto
a anterior, se diferentes — e atualiza-se o saldo exibido (e um aviso curto com o novo saldo).
O front nunca soma; só re-busca o valor derivado.

### 5. Lote: grade + all-or-nothing + `index`

`POST /transactions/batch` recebe um **array**. O `client.ts` é o único a fazer `fetch`, então
o `batch` api chama `apiPost(TRANSACTIONS_BATCH_PATH, items)`. Para o `400` com `index`,
estende-se o `ApiError` com um campo opcional `index?: number`, populado por `toApiError` a
partir do corpo `{ error: {...}, index }`. A grade valida localmente (campos obrigatórios,
`amount` inteiro via `parseToCents`, máx 100, não-vazio) antes de enviar; no `400` destaca a
linha de `err.index` com a `message`; no `201` confirma e (se havia `accountId`) re-busca as
contas afetadas.

Acesso à grade: um botão **"Lançar em lote"** na `TransactionsScreen` alterna para a
`BatchEntryScreen` (estado local, com "voltar") — **sem** novo item na sidebar, evitando
inchaço (já são 9). Colar: um campo de texto que aceita linhas separadas por tab/nova-linha e
as adiciona como linhas (best-effort), além de adicionar/remover linha manualmente.

### 6. `ApiError.index` opcional (mudança mínima no cliente)

`ApiError` ganha `readonly index?: number`. `toApiError` lê `data.index` quando numérico.
Não afeta os demais usos (continua `undefined`). Mantém o `client.ts` como único ponto de
parsing do envelope.

## Risks / Trade-offs

- **Grade de lote complexa** → Mitigação: grade simples (inputs/selects por linha) + validação
  local; colar é best-effort. O backend é a autoridade final (all-or-nothing).
- **Saber a conta afetada no editar** → Mitigação: guardar o `accountId` anterior do
  lançamento e re-buscar ambos (anterior e novo) se diferentes.
- **`index` fora do envelope padrão** → Coberto por estender `ApiError`/`toApiError`; sem
  quebrar os outros erros.

## Migration Plan

CONTRACT §4 já atualizado (pré-condição). Mudança aditiva: estende `web-transactions` e
adiciona `web-transactions-batch`. Sem migração de dados, sem mudança de deploy. Rollback =
remover o seletor de conta/visão por conta/lote e reverter os tipos.

## Open Questions

- Colar/planilha avançada (colunas mapeadas, undo) é evolução futura; a grade atual cobre o
  caso "lançar em lote" pedido.
