# web-accounts

## Purpose

Definir a área de **contas bancárias** (CONTRACT §3.5, distinta da §9 conta de usuário/LGPD):
listar contas com saldo, uma **visão geral** que agrupa `currentBalance` por moeda (separando
normais de investimento), e o CRUD (criar, editar com `currency` imutável, arquivar via
soft-delete, detalhe com `404`). O `currentBalance` é **derivado pelo backend** — o front só
exibe; a visão geral apenas agrupa os saldos já prontos da lista completa, sem recalcular nem
misturar moedas. Valores em centavos, formatados no front.

## Requirements

### Requirement: Listar contas

A tela SHALL listar as contas via `GET /api/accounts` (filtro `archived` opcional), lendo
`{ "items": [...] }`, e SHALL exibir por conta `name`, `kind` (legível), `currency`,
`openingBalance` e `currentBalance` **formatados a partir dos centavos**. O front NÃO SHALL
recalcular o `currentBalance` — ele é derivado pelo backend.

#### Scenario: Lista com itens

- **WHEN** `GET /api/accounts?archived=false` retorna `200` com `{ "items": [account, ...] }`
- **THEN** a tela exibe cada conta com nome, tipo legível, moeda, saldo inicial e saldo atual
  formatados a partir dos centavos retornados

#### Scenario: Filtro por arquivadas

- **WHEN** o usuário alterna mostrar/ocultar arquivadas (`archived` `true`/`false`)
- **THEN** o app monta a query apenas com o filtro preenchido e relista

#### Scenario: Lista vazia

- **WHEN** `GET /api/accounts` retorna `{ "items": [] }`
- **THEN** a tela mostra o estado vazio explícito (ex.: "nenhuma conta ainda")

### Requirement: Visão geral por moeda (normais vs. investimento)

A tela SHALL apresentar uma visão geral que **agrupa** as contas retornadas por `currency` e
exibe o total de `currentBalance` por moeda, **separando** contas normais das de investimento
(`kind = investment`). O front apenas **soma os `currentBalance` já derivados pelo backend**
da lista completa retornada (sem paginação); NÃO SHALL recalcular saldos nem misturar moedas.

#### Scenario: Totais por moeda

- **WHEN** a lista de contas é exibida
- **THEN** a visão geral mostra, para cada `currency` presente, o total de `currentBalance`
  formatado, calculado somando apenas contas daquela moeda

#### Scenario: Normais separadas de investimento

- **WHEN** há contas com `kind = investment` e contas de outros tipos
- **THEN** a visão geral apresenta os totais de contas normais separados dos totais de contas
  de investimento

#### Scenario: Nunca mistura moedas

- **WHEN** existem contas em moedas diferentes
- **THEN** cada moeda tem seu próprio total; o app NÃO soma valores de moedas diferentes num
  único número

### Requirement: Criar conta

A tela SHALL permitir criar uma conta via `POST /api/accounts` com
`{ name, kind, currency, openingBalance? }`, onde `kind ∈ {checking, cash, wallet,
investment}` e `openingBalance` é inteiro em centavos (pode ser negativo, default `0`). O
front SHALL validar `kind`/`currency` antes de enviar.

#### Scenario: Criação bem-sucedida

- **WHEN** o usuário informa `name`, escolhe um `kind` válido, uma `currency` não-vazia e
  (opcionalmente) um `openingBalance` em centavos, e submete
- **THEN** o app envia `POST /api/accounts` e, ao receber `201`, inclui a conta na lista

#### Scenario: kind restrito à taxonomia

- **WHEN** o formulário oferece o campo `kind`
- **THEN** as opções são exatamente `checking`, `cash`, `wallet`, `investment` (sem texto
  livre)

#### Scenario: Saldo inicial em centavos (pode ser negativo)

- **WHEN** o usuário informa um saldo inicial (ex.: `-10,00`)
- **THEN** o app converte para centavos inteiros (`-1000`) antes de enviar; se omitido, envia
  `0` ou omite o campo

#### Scenario: Validação 400

- **WHEN** `POST /api/accounts` retorna `400` (`kind` inválido / `currency` vazia)
- **THEN** a tela exibe a `error.message` do corpo junto ao formulário, sem perder os dados
  digitados

### Requirement: Editar conta (currency imutável)

A tela SHALL permitir editar uma conta via `PUT /api/accounts/:id` enviando apenas
`{ name, kind, openingBalance }`. A `currency` é **imutável** e NÃO SHALL ser enviada como
alteração.

#### Scenario: Edição bem-sucedida

- **WHEN** o usuário altera `name`/`kind`/`openingBalance` e submete
- **THEN** o app envia `PUT /api/accounts/:id` **sem** `currency` e, ao receber `200`, reflete
  a mudança na lista (incluindo o novo `currentBalance` derivado, se vier)

#### Scenario: currency somente-leitura

- **WHEN** a `currency` é apresentada na edição
- **THEN** ela é somente-leitura; a UI não permite alterá-la (evita o `400` por construção)

#### Scenario: Conta inexistente ou de outro usuário

- **WHEN** `PUT /api/accounts/:id` retorna `404`
- **THEN** a tela trata como "não encontrada", sem disparar login nem erro de sistema

### Requirement: Arquivar conta (soft-delete)

A tela SHALL permitir arquivar uma conta via `POST /api/accounts/:id/archive` (soft-delete).
Uma conta arquivada continua legível e com saldo calculado, mas é sinalizada como arquivada e
não recebe novos lançamentos.

#### Scenario: Arquivamento bem-sucedido

- **WHEN** o usuário arquiva uma conta e o backend responde `200` com o recurso arquivado
- **THEN** a tela reflete `archived: true` (conforme o filtro atual)

#### Scenario: Arquivada continua legível

- **WHEN** uma conta arquivada é exibida
- **THEN** seu `currentBalance` continua sendo exibido (derivado pelo backend) e ela é
  marcada como arquivada

### Requirement: Detalhe da conta

A tela SHALL exibir o detalhe via `GET /api/accounts/:id`, tratando `404` como "não
encontrada" sem revelar existência.

#### Scenario: Abrir detalhe

- **WHEN** o usuário abre uma conta e `GET /api/accounts/:id` retorna `200`
- **THEN** a tela exibe os dados da conta (nome, tipo, moeda, saldo inicial e atual
  formatados)

#### Scenario: Conta de outro usuário ou inexistente

- **WHEN** `GET /api/accounts/:id` retorna `404`
- **THEN** a tela trata como "não encontrada", sem disparar login nem erro de sistema

### Requirement: Estados de UI explícitos na tela de contas

A tela SHALL apresentar estados explícitos para carregando, vazio, erro e sem-sessão.

#### Scenario: Carregando

- **WHEN** a lista está sendo buscada
- **THEN** a tela mostra um indicador de carregamento

#### Scenario: Erro inesperado de sistema

- **WHEN** uma chamada falha com erro não-`401`/não-`404` (ex.: `500` ou falha de rede)
- **THEN** a tela mostra um estado de erro com opção de tentar novamente, sem travar o app

#### Scenario: Sem-sessão

- **WHEN** uma chamada retorna `401`
- **THEN** o tratamento central de `401` marca "sem sessão" e o app exibe a tela de login; a
  tela de contas não renderiza conteúdo protegido
