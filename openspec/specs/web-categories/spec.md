# web-categories

## Purpose

Definir a tela de gestão de categorias do front: listar (filtro `type`/`archived`), criar
(`POST /api/categories`), renomear (`PUT` só `name` — `type` é imutável) e arquivar
(`POST /api/categories/:id/archive`, sem hard delete), com estados de UI explícitos.

## Requirements

### Requirement: Listar categorias

A tela de categorias SHALL listar as categorias do usuário via
`GET /api/categories`, lendo os itens de `{ "items": [...] }`, e SHALL permitir filtrar por
`type` (`income`/`expense`/`investment`) e por `archived` (`true`/`false`) via query.

#### Scenario: Lista com itens

- **WHEN** `GET /api/categories` retorna `200` com `{ "items": [category, ...] }`
- **THEN** a tela exibe cada categoria com `name`, `type` e o estado `archived`

#### Scenario: Filtro por tipo e arquivadas

- **WHEN** o usuário aplica filtros (ex.: `type=expense`, `archived=false`)
- **THEN** o app monta a query apenas com os filtros preenchidos (valores vazios são
  omitidos) e relista

#### Scenario: Lista vazia

- **WHEN** `GET /api/categories` retorna `{ "items": [] }`
- **THEN** a tela mostra o estado vazio explícito (ex.: "nenhuma categoria"), não uma lista
  ambígua

### Requirement: Criar categoria

A tela SHALL permitir criar uma categoria via `POST /api/categories` com o corpo
`{ name, type }`, onde `type` ∈ {`income`, `expense`, `investment`}.

#### Scenario: Criação bem-sucedida

- **WHEN** o usuário informa `name` e `type` válidos e submete
- **THEN** o app envia `POST /api/categories` e, ao receber `201`, inclui a nova categoria
  na lista

#### Scenario: Validação 400

- **WHEN** `POST /api/categories` retorna `400` (`name` ausente ou `type` fora do conjunto)
- **THEN** a tela exibe a `message` do erro junto ao formulário sem perder os dados
  digitados

### Requirement: Renomear categoria

A tela SHALL permitir renomear uma categoria via `PUT /api/categories/:id` enviando
**apenas `name`**. O `type` é imutável e NÃO SHALL ser enviado.

#### Scenario: Renome bem-sucedido

- **WHEN** o usuário edita o `name` de uma categoria e submete
- **THEN** o app envia `PUT /api/categories/:id` com `{ name }` (sem `type`) e, ao receber
  `200`, reflete o novo nome na lista

#### Scenario: Categoria inexistente ou de outro usuário

- **WHEN** `PUT /api/categories/:id` retorna `404`
- **THEN** a tela trata como "não encontrada" (o backend não revela existência), sem
  disparar login nem tratar como erro de sistema

#### Scenario: Tentativa de alterar o type

- **WHEN** o corpo inclui `type` e o backend responde `400` (type imutável)
- **THEN** a tela exibe a `message`; o app deve enviar somente `name` para evitar esse caso

### Requirement: Arquivar categoria (sem hard delete)

A tela SHALL permitir arquivar uma categoria via `POST /api/categories/:id/archive`. NÃO há
exclusão definitiva — apenas arquivamento.

#### Scenario: Arquivamento bem-sucedido

- **WHEN** o usuário arquiva uma categoria e o backend responde `200` com o recurso
  arquivado
- **THEN** a tela reflete `archived: true` (e a categoria deixa de aparecer no seletor de
  novas transações)

#### Scenario: Não existe exclusão definitiva

- **WHEN** o usuário gerencia categorias
- **THEN** a UI oferece apenas "arquivar" — não há ação de hard delete

### Requirement: Estados de UI explícitos na tela de categorias

A tela SHALL apresentar estados explícitos para carregando, vazio, erro e sem-sessão.

#### Scenario: Carregando

- **WHEN** a lista está sendo buscada
- **THEN** a tela mostra um indicador de carregamento

#### Scenario: Erro inesperado de sistema

- **WHEN** uma chamada falha com erro não-`401` (ex.: `500` ou falha de rede)
- **THEN** a tela mostra um estado de erro com opção de tentar novamente, sem travar o app

#### Scenario: Sem-sessão

- **WHEN** uma chamada retorna `401`
- **THEN** o tratamento central de `401` redireciona para o login; a tela não renderiza
  conteúdo protegido
