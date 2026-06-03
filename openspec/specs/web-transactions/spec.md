# web-transactions

## Purpose

Definir a tela de transações do front: listar (`GET /api/transactions`) e criar
(`POST /api/transactions`) transações, tratando `amount` como inteiro em centavos,
oferecendo seletor de categoria (`GET /api/categories?type=expense`) e apresentando
estados de UI explícitos (carregando, vazio, erro, sem-sessão).

## Requirements

### Requirement: Listar transações

A tela de transações SHALL listar as transações do usuário via `GET /api/transactions`,
lendo os itens do envelope de resposta `{ "items": [...] }`.

#### Scenario: Lista com itens

- **WHEN** `GET /api/transactions` retorna `200` com `{ "items": [transaction, ...] }`
- **THEN** a tela exibe cada transação com `type`, valor formatado, `currency`,
  `occurredOn` e `description` (quando presente)

#### Scenario: Lista vazia

- **WHEN** `GET /api/transactions` retorna `200` com `{ "items": [] }`
- **THEN** a tela mostra o estado vazio explícito (ex.: "nenhuma transação ainda"), e não
  uma lista em branco ambígua

### Requirement: Formatação de valores em centavos

A tela SHALL tratar `amount` como inteiro em centavos: SHALL formatá-lo para exibição
(unidade monetária com a `currency` da transação) e SHALL enviar o valor de volta em
centavos ao criar uma transação.

#### Scenario: Exibição de valor

- **WHEN** uma transação tem `amount: 1000` e `currency: "BRL"`
- **THEN** a tela exibe o equivalente a `R$ 10,00` (formatação no front)

#### Scenario: Envio de valor

- **WHEN** o usuário informa um valor monetário no formulário (ex.: `10,00`)
- **THEN** o app converte para centavos inteiros (`1000`) antes de enviar no corpo do
  `POST /api/transactions`

### Requirement: Criar transação

A tela SHALL permitir criar uma transação via `POST /api/transactions` com o corpo
`{ type, amount, currency, occurredOn, categoryId?, description? }`, onde `amount` é
inteiro em centavos.

#### Scenario: Criação bem-sucedida

- **WHEN** o usuário preenche um formulário válido e submete
- **THEN** o app envia `POST /api/transactions` com `amount` em centavos
- **AND** ao receber `201` com o recurso criado, a tela atualiza a lista incluindo a nova
  transação

#### Scenario: Validação 400 de campo

- **WHEN** `POST /api/transactions` retorna `400 bad_request` por campo inválido
  (`type`/`amount`/`currency`/`occurredOn`)
- **THEN** a tela apresenta a `message` do erro junto ao formulário sem perder os dados já
  digitados

#### Scenario: Categoria inválida ou arquivada (400 por id no corpo)

- **WHEN** `POST /api/transactions` retorna `400` porque o `categoryId` enviado é
  inválido, arquivado ou não pertence ao usuário (id referenciado no corpo ⇒ `400`, e a
  existência nunca é confirmada)
- **THEN** a tela trata como erro de validação do campo de categoria, exibe a `message` e
  permite ao usuário escolher outra categoria

### Requirement: Seletor de categoria

O formulário de criação SHALL oferecer um seletor de categoria populado por
`GET /api/categories?type=expense`, lendo os itens de `{ "items": [...] }`.

#### Scenario: Carregar categorias para o seletor

- **WHEN** o formulário é aberto
- **THEN** o app busca `GET /api/categories?type=expense` e popula o seletor com as
  categorias retornadas (não arquivadas)

#### Scenario: Categoria opcional

- **WHEN** o usuário não seleciona categoria
- **THEN** o app omite `categoryId` no corpo (o campo é opcional), enviando a transação sem
  categoria

### Requirement: Estados de UI explícitos na tela de transações

A tela de transações SHALL apresentar estados de UI explícitos para carregando, vazio,
erro e sem-sessão, em vez de telas ambíguas ou em branco.

#### Scenario: Carregando

- **WHEN** a lista de transações está sendo buscada
- **THEN** a tela mostra um indicador de carregamento

#### Scenario: Erro inesperado de sistema

- **WHEN** `GET /api/transactions` falha com erro não-`401` (ex.: `500` ou falha de rede)
- **THEN** a tela mostra um estado de erro com possibilidade de tentar novamente, sem
  travar o app

#### Scenario: Sem-sessão

- **WHEN** uma chamada da tela retorna `401`
- **THEN** o tratamento central de `401` redireciona para o login; a tela não renderiza
  conteúdo protegido para um usuário sem sessão

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

### Requirement: Seletor de cartão na transação

O formulário de transação (criar e editar) SHALL oferecer um seletor de cartão opcional,
populado por `GET /api/cards` (não arquivados), permitindo associar o lançamento a um cartão
(`cardId`) ou deixá-lo ad-hoc ("sem cartão").

#### Scenario: Carregar cartões para o seletor

- **WHEN** o formulário de transação é aberto
- **THEN** o app busca `GET /api/cards?archived=false` e popula o seletor com os cartões
  retornados, além da opção "sem cartão"

#### Scenario: Associar a um cartão

- **WHEN** o usuário escolhe um cartão e cria/edita a transação
- **THEN** o app envia `cardId` no corpo (no `POST`/`PUT`), vinculando o lançamento à fatura
  do período no backend

#### Scenario: Sem cartão (ad-hoc)

- **WHEN** o usuário não seleciona cartão
- **THEN** no `POST` o `cardId` é omitido; no `PUT` (full replace) o `cardId` é enviado como
  `null`, mantendo o lançamento fora de qualquer fatura

#### Scenario: Cartão inválido ou arquivado (400 por id no corpo)

- **WHEN** o backend responde `400` porque o `cardId` é inválido, arquivado ou não pertence
  ao usuário
- **THEN** a tela trata como erro do campo de cartão, exibe a `message` e permite reescolher
