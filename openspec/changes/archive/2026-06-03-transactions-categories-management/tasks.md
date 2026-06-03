## 1. Cliente HTTP e paths

- [x] 1.1 Adicionar `apiPut` e `apiDelete` em `src/api/client.ts` reusando `request<T>` (mantendo o client como único ponto de `fetch`; 204 já resolve `undefined`)
- [x] 1.2 Adicionar paths em `src/api/paths.ts`: helpers para `/api/transactions/:id`, `/api/categories/:id` e `/api/categories/:id/archive`

## 2. Tipos

- [x] 2.1 Em `src/api/types.ts`: `UpdateTransactionInput` (full replace: `type, amount, currency, occurredOn, categoryId|null, cardId|null, description?`), `CreateCategoryInput` (`{ name, type }`), `RenameCategoryInput` (`{ name }`) e tipo dos filtros de transação (`type?, categoryId?, cardId?, from?, to?`)

## 3. API de transações (editar/excluir/filtros)

- [x] 3.1 `updateTransaction(id, input)` → `PUT /api/transactions/:id` (corpo completo montado do recurso atual)
- [x] 3.2 `deleteTransaction(id)` → `DELETE /api/transactions/:id` (204)
- [x] 3.3 `listTransactions(filters?)` → `GET /api/transactions` com query (omitindo filtros vazios)

## 4. UI de transações (editar/excluir/filtros)

- [x] 4.1 Reusar `TransactionForm` em modo edição (preencher do recurso; preservar `cardId`/campos não editados no full replace; `categoryId` setável ou `null`)
- [x] 4.2 Ações de editar e excluir por item na `TransactionsScreen` (excluir com confirmação; remover da lista no 204)
- [x] 4.3 Tratar `400` (campo / categoria arquivada-inválida → erro do campo de categoria) e `404` (não encontrada) na edição/exclusão, sem perder dados digitados
- [x] 4.4 Barra de filtros (`type`, `categoryId`, `from`, `to`; `cardId` na query) que monta a query e relista; estado vazio específico de filtro; ação de limpar filtros

## 5. API de categorias

- [x] 5.1 Novo `src/features/categories/api.ts`: `listCategories(filters?)` (`type`/`archived`), `createCategory({name,type})`, `renameCategory(id,{name})`, `archiveCategory(id)`

## 6. Tela de categorias

- [x] 6.1 `src/features/categories/CategoriesScreen.tsx`: listar com filtros `type`/`archived`; estados carregando/vazio/erro/sem-sessão
- [x] 6.2 Criar categoria (`{name,type}`) com tratamento de `400`; incluir na lista no 201
- [x] 6.3 Renomear categoria enviando só `name` (não expor `type`); tratar `400`/`404`; refletir o novo nome
- [x] 6.4 Arquivar categoria (`POST /:id/archive`); refletir `archived: true`; sem ação de hard delete

## 7. Navegação e integração

- [x] 7.1 Navegação simples entre Transações e Categorias em `App.tsx` (estado local `view`, sem router)
- [x] 7.2 Garantir que o seletor de categoria (criação/edição de transação) continua listando só não arquivadas

## 8. Verificação

- [x] 8.1 `npm run typecheck`, `npm run lint` e `npm run build` verdes; confirmar que `fetch(` só existe em `src/api/client.ts`
- [ ] 8.2 Verificação manual dos fluxos (editar/excluir/filtrar transação; criar/renomear/arquivar categoria; 400 de categoria arquivada) contra backend real
