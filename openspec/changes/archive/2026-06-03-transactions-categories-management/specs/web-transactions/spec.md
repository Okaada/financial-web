## ADDED Requirements

### Requirement: Editar transação

A tela SHALL permitir editar uma transação via `PUT /api/transactions/:id` (full replace),
com o mesmo corpo do POST (`{ type, amount, currency, occurredOn, categoryId?, cardId?,
description? }`, `amount` em centavos); `categoryId`/`cardId` podem ser setados ou `null`.

#### Scenario: Edição bem-sucedida

- **WHEN** o usuário abre uma transação existente, altera campos válidos e submete
- **THEN** o app envia `PUT /api/transactions/:id` com `amount` em centavos e, ao receber
  `200`, atualiza o item na lista com o recurso retornado

#### Scenario: Validação 400 de campo na edição

- **WHEN** `PUT /api/transactions/:id` retorna `400 bad_request` por campo inválido
- **THEN** a tela apresenta a `message` junto ao formulário sem perder os dados digitados

#### Scenario: Categoria inválida ou arquivada na edição (400 por id no corpo)

- **WHEN** `PUT /api/transactions/:id` retorna `400` porque o `categoryId` é inválido,
  arquivado ou não pertence ao usuário
- **THEN** a tela trata como erro do campo de categoria, exibe a `message` e permite
  reescolher

#### Scenario: Transação inexistente ou de outro usuário

- **WHEN** `PUT /api/transactions/:id` retorna `404`
- **THEN** a tela trata como "não encontrada" (não revela existência), sem disparar login
  nem tratar como erro de sistema

### Requirement: Excluir transação

A tela SHALL permitir excluir uma transação via `DELETE /api/transactions/:id`, que responde
`204`, mediante confirmação do usuário.

#### Scenario: Exclusão bem-sucedida

- **WHEN** o usuário confirma a exclusão e o backend responde `204`
- **THEN** a tela remove a transação da lista

#### Scenario: Confirmação antes de excluir

- **WHEN** o usuário aciona "excluir"
- **THEN** a tela pede confirmação antes de enviar o `DELETE` (evita exclusão acidental)

#### Scenario: Transação inexistente ou de outro usuário

- **WHEN** `DELETE /api/transactions/:id` retorna `404`
- **THEN** a tela trata como "não encontrada", sem disparar login nem erro de sistema

### Requirement: Filtros na listagem de transações

A tela SHALL permitir filtrar a listagem via `GET /api/transactions` com query `type`,
`categoryId`, `cardId`, `from` e `to`. Filtros vazios SHALL ser omitidos da query.

#### Scenario: Aplicar filtros

- **WHEN** o usuário define um ou mais filtros (ex.: `type=expense`, `from=2026-01-01`,
  `to=2026-01-31`) e aplica
- **THEN** o app monta a query apenas com os campos preenchidos e relista com o resultado

#### Scenario: Limpar filtros

- **WHEN** o usuário limpa os filtros
- **THEN** o app refaz `GET /api/transactions` sem query e mostra a lista completa

#### Scenario: Filtro sem resultados

- **WHEN** a query filtrada retorna `{ "items": [] }`
- **THEN** a tela mostra o estado vazio explícito (ex.: "nenhuma transação para o filtro"),
  preservando os filtros aplicados
