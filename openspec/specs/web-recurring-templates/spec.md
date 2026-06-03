# web-recurring-templates

## Purpose

Definir a tela de gestão de templates recorrentes do front: listar (filtro `active`), criar,
editar (full replace) e excluir (`204`, hard delete) — valores em centavos, `categoryId`
opcional, com estados de UI explícitos.

## Requirements

### Requirement: Listar templates recorrentes

A tela SHALL listar os templates recorrentes do usuário via `GET /api/recurring-templates`,
lendo `{ "items": [...] }`, e SHALL permitir filtrar por `active` (`true`/`false`) via query.

#### Scenario: Lista com itens

- **WHEN** `GET /api/recurring-templates` retorna `200` com `{ "items": [template, ...] }`
- **THEN** a tela exibe cada template com `description` (quando presente), valor formatado,
  `type`, `dayOfMonth`, `intervalMonths` e a vigência (`startDate`/`endDate`)

#### Scenario: Filtro por ativos

- **WHEN** o usuário filtra por `active=true`
- **THEN** o app monta a query apenas com o filtro preenchido e relista

#### Scenario: Lista vazia

- **WHEN** `GET /api/recurring-templates` retorna `{ "items": [] }`
- **THEN** a tela mostra o estado vazio explícito (ex.: "nenhum recorrente")

### Requirement: Criar template recorrente

A tela SHALL permitir criar um template via `POST /api/recurring-templates` com o corpo
`{ type, amount, currency, dayOfMonth, intervalMonths, startDate, endDate?, description?,
categoryId?, active? }`, onde `amount` é inteiro em centavos.

#### Scenario: Criação bem-sucedida

- **WHEN** o usuário preenche um formulário válido e submete
- **THEN** o app envia `POST /api/recurring-templates` com `amount` em centavos e, ao
  receber `201`, inclui o template na lista

#### Scenario: Validação 400

- **WHEN** `POST /api/recurring-templates` retorna `400` (campo inválido, ex.: `dayOfMonth`
  fora de 1–31, `intervalMonths` < 1, ou `categoryId` inválido/arquivado)
- **THEN** a tela exibe a `message` do erro junto ao formulário sem perder os dados
  digitados (erro de categoria mapeado ao campo de categoria)

### Requirement: Editar template recorrente

A tela SHALL permitir editar um template via `PUT /api/recurring-templates/:id` (mesmo corpo
do POST), com `amount` em centavos.

#### Scenario: Edição bem-sucedida

- **WHEN** o usuário altera campos válidos de um template e submete
- **THEN** o app envia `PUT /api/recurring-templates/:id` e, ao receber `200`, atualiza o
  item na lista

#### Scenario: Template inexistente ou de outro usuário

- **WHEN** `PUT /api/recurring-templates/:id` retorna `404`
- **THEN** a tela trata como "não encontrado", sem disparar login nem erro de sistema

### Requirement: Excluir template recorrente

A tela SHALL permitir excluir um template via `DELETE /api/recurring-templates/:id` (responde
`204`), mediante confirmação do usuário.

#### Scenario: Exclusão bem-sucedida

- **WHEN** o usuário confirma a exclusão e o backend responde `204`
- **THEN** a tela remove o template da lista

#### Scenario: Confirmação antes de excluir

- **WHEN** o usuário aciona "excluir"
- **THEN** a tela pede confirmação antes de enviar o `DELETE`

### Requirement: Estados de UI explícitos na tela de templates

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
