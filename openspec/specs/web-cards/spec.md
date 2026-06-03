# web-cards

## Purpose

Definir a tela de gestão de cartões de crédito: listar (filtro `archived`), criar, editar
(`closingDay` imutável), arquivar, registrar taxas de milhas (append-only) e exibir as
milhas acumuladas. `milesPerUnit` é multiplicador decimal e `miles`/`totalMiles` são
contagens inteiras — nunca formatados como centavos.

## Requirements

### Requirement: Listar cartões

A tela SHALL listar os cartões via `GET /api/cards` (filtro `archived` opcional), lendo
`{ "items": [...] }`, exibindo `name` (ou "(sem nome)"), `closingDay`, `dueDay`, `currency` e
o estado `archived`.

#### Scenario: Lista com itens

- **WHEN** `GET /api/cards` retorna `200` com `{ "items": [card, ...] }`
- **THEN** a tela exibe cada cartão com nome, dia de fechamento, dia de vencimento e moeda

#### Scenario: Filtro por arquivados

- **WHEN** o usuário filtra por `archived` (`true`/`false`)
- **THEN** o app monta a query apenas com o filtro preenchido e relista

#### Scenario: Lista vazia

- **WHEN** `GET /api/cards` retorna `{ "items": [] }`
- **THEN** a tela mostra o estado vazio explícito (ex.: "nenhum cartão")

### Requirement: Criar cartão

A tela SHALL permitir criar um cartão via `POST /api/cards` com
`{ name?, closingDay(1-31), dueDay(1-31), currency }`.

#### Scenario: Criação bem-sucedida

- **WHEN** o usuário informa `closingDay`/`dueDay` (1–31) e `currency` válidos (e `name`
  opcional) e submete
- **THEN** o app envia `POST /api/cards` e, ao receber `201`, inclui o cartão na lista

#### Scenario: Validação 400

- **WHEN** `POST /api/cards` retorna `400` (dias fora de 1–31, moeda inválida)
- **THEN** a tela exibe a `message` do erro sem perder os dados digitados

### Requirement: Editar cartão (closingDay imutável)

A tela SHALL permitir editar um cartão via `PUT /api/cards/:id` enviando apenas
`{ name?, dueDay? }`. O `closingDay` é **imutável** e NÃO SHALL ser enviado como alteração.

#### Scenario: Edição bem-sucedida

- **WHEN** o usuário altera `name` e/ou `dueDay` e submete
- **THEN** o app envia `PUT /api/cards/:id` sem `closingDay` e, ao receber `200`, reflete a
  mudança na lista

#### Scenario: closingDay imutável

- **WHEN** o `closingDay` é apresentado na edição
- **THEN** ele é somente-leitura; a UI não permite alterá-lo (evita o `400` de
  closing_day imutável por construção)

#### Scenario: Cartão inexistente ou de outro usuário

- **WHEN** `PUT /api/cards/:id` retorna `404`
- **THEN** a tela trata como "não encontrado", sem disparar login nem erro de sistema

### Requirement: Arquivar cartão (sem hard delete)

A tela SHALL permitir arquivar um cartão via `POST /api/cards/:id/archive`. NÃO há exclusão
definitiva.

#### Scenario: Arquivamento bem-sucedido

- **WHEN** o usuário arquiva um cartão e o backend responde `200`
- **THEN** a tela reflete `archived: true`

### Requirement: Taxas de milhas (append-only)

A tela SHALL listar as taxas via `GET /api/cards/:id/rates` e permitir registrar novas via
`POST /api/cards/:id/rates` `{ milesPerUnit(decimal ≥ 0), effectiveFrom }`. As taxas são
**append-only/versionadas** (não se edita/apaga uma taxa existente). `milesPerUnit` é um
**multiplicador decimal**, NÃO centavos.

#### Scenario: Listar taxas

- **WHEN** `GET /api/cards/:id/rates` retorna `{ "items": [rate, ...] }`
- **THEN** a tela exibe cada taxa com `milesPerUnit` (número decimal) e `effectiveFrom`

#### Scenario: Registrar nova taxa

- **WHEN** o usuário informa `milesPerUnit` (≥ 0) e `effectiveFrom` e submete
- **THEN** o app envia `POST /api/cards/:id/rates` e, ao receber `201`, inclui a taxa na
  lista (a anterior permanece — é versionado)

#### Scenario: Taxa em cartão arquivado (400)

- **WHEN** o cartão está arquivado e o backend responde `400`
- **THEN** a tela exibe a `message` do erro

### Requirement: Milhas acumuladas

A tela SHALL exibir as milhas acumuladas via `GET /api/cards/:id/miles` →
`{ cardId, totalMiles }`. `totalMiles` é uma **contagem inteira** (NÃO centavos) e soma
apenas as faturas **pagas**.

#### Scenario: Exibir milhas

- **WHEN** `GET /api/cards/:id/miles` retorna `{ "cardId": "...", "totalMiles": 22500 }`
- **THEN** a tela exibe `22.500 milhas` (inteiro formatado, sem unidade monetária)

### Requirement: Estados de UI explícitos na tela de cartões

A tela SHALL apresentar estados explícitos para carregando, vazio, erro e sem-sessão.

#### Scenario: Carregando

- **WHEN** a lista está sendo buscada
- **THEN** a tela mostra um indicador de carregamento

#### Scenario: Erro inesperado de sistema

- **WHEN** uma chamada falha com erro não-`401`
- **THEN** a tela mostra um estado de erro com opção de tentar novamente

#### Scenario: Sem-sessão

- **WHEN** uma chamada retorna `401`
- **THEN** o tratamento central de `401` redireciona para o login; a tela não renderiza
  conteúdo protegido
