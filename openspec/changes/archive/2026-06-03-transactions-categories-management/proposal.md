## Why

O esqueleto atual (change `auth-transactions-skeleton`) só lista e cria transações e lê
categorias num seletor. Falta o ciclo completo de gestão: editar e excluir transações,
filtrar a lista, e administrar as categorias (criar, renomear, arquivar). Sem isso o
usuário não corrige um lançamento errado nem organiza suas categorias — o app é só
append-only. Esta change fecha o CRUD de transações e adiciona a tela de categorias,
reusando o cliente HTTP e o tratamento central de 401/404/400 já existentes.

## What Changes

- **Editar transação.** `PUT /api/transactions/:id` (full replace, mesmo corpo do POST;
  `categoryId`/`cardId` podem ser setados ou `null`). UI de edição reaproveita o formulário
  de criação. `404` quando o id não existe/é de outro usuário (não revela existência);
  `400` para campo inválido ou `categoryId`/`cardId` inválido/arquivado.
- **Excluir transação.** `DELETE /api/transactions/:id` → `204`. Confirmação antes de
  excluir; `404` tratado como "não encontrado". Remove o item da lista ao concluir.
- **Filtros na listagem.** `GET /api/transactions` com query `type`, `categoryId`, `cardId`,
  `from`, `to`. UI de filtros que monta a query (valores vazios são omitidos) e relista.
- **Gestão de categorias (nova tela).** Listar (`GET /api/categories?type=&archived=`),
  criar (`POST /api/categories` `{ name, type }`), renomear (`PUT /api/categories/:id`
  **só `name`** — `type` é imutável, enviar `type` → `400`), arquivar
  (`POST /api/categories/:id/archive` → recurso arquivado; **sem hard delete**).
- **Categoria arquivada não é atribuível.** O seletor de categoria oferece apenas as não
  arquivadas; se ainda assim o backend devolver `400` (id arquivado/ inválido no corpo) ao
  criar/editar transação, a UI trata como erro do campo de categoria e deixa reescolher.

Fora de escopo (diferido): recorrentes, investimentos, cartões, dashboard e admin. O
`cardId` é aceito/preservado nos corpos e exposto como filtro, mas não há tela de cartões
nesta change.

## Capabilities

### New Capabilities
- `web-categories`: tela de gestão de categorias — listar (com filtro `type`/`archived`),
  criar, renomear (só `name`) e arquivar; reflete a regra de não-hard-delete e a
  imutabilidade de `type`.

### Modified Capabilities
- `web-transactions`: adiciona editar (`PUT`), excluir (`DELETE`) e filtros de listagem às
  capacidades já existentes de listar/criar.

## Impact

- **Front:** novos paths em `src/api/paths.ts` (`/api/categories/:id`,
  `/api/categories/:id/archive`, `/api/transactions/:id`); novas chamadas em
  `src/features/transactions/api.ts` (update/delete/filtros) e um novo
  `src/features/categories/` (tela + api); tipos para `UpdateTransactionInput`,
  `CreateCategoryInput`, `RenameCategoryInput`. Navegação simples entre as telas
  Transações e Categorias.
- **Backend/API:** nenhuma mudança — todos os endpoints já existem no CONTRACT.md (§4, §5).
- **Reuso:** cliente HTTP único (`src/api/client.ts`) e o tratamento central de
  401 (→login), 404 (not_found) e 400 (bad_request) permanecem inalterados; `apiPut`/
  `apiDelete` podem ser adicionados ao client mantendo-o como único ponto de `fetch`.
