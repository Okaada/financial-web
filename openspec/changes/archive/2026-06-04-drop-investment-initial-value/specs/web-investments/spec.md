## MODIFIED Requirements

### Requirement: Listar investimentos com agregados do backend

A tela SHALL listar os investimentos via `GET /api/investments` (filtros `archived` e
`accountId` opcionais), lendo `{ "items": [...] }`, e SHALL exibir `name`, `type` legível,
`totalInvested` (= `totalContributed`, soma dos aportes) e `currentValue`
**formatados a partir dos centavos agregados pelo backend**, com `totalInvested` e
`currentValue` apresentados **distintamente** (o que se colocou via aportes vs. o que vale
hoje). O front NÃO SHALL recalcular esses agregados.

> **Removed**: `initialValue` não é mais exibido. `totalInvested` agora representa
> apenas a soma dos aportes (sem campo inicial separado).

#### Scenario: Lista com itens

- **WHEN** `GET /api/investments` retorna `200` com `{ "items": [investment, ...] }`
- **THEN** a tela exibe cada investimento com `name`, `type` legível, `totalInvested`
  formatado e `currentValue` formatado (ou placeholder quando `null`)

#### Scenario: Total investido e valor atual distintos

- **WHEN** um investimento tem `totalInvested` e `currentValue`
- **THEN** os dois são exibidos separadamente e rotulados (ex.: "investido" vs. "valor atual"),
  deixando claro que `currentValue` é independente de `totalInvested`

#### Scenario: Valor atual ainda não marcado

- **WHEN** um investimento tem `currentValue: null`
- **THEN** a tela exibe um placeholder (ex.: "sem marcação") em vez de `R$ 0,00`

#### Scenario: Filtros por arquivados e por conta

- **WHEN** o usuário filtra por `archived` e/ou `accountId`
- **THEN** o app monta a query apenas com os filtros preenchidos e relista

#### Scenario: Lista vazia

- **WHEN** `GET /api/investments` retorna `{ "items": [] }`
- **THEN** a tela mostra o estado vazio explícito (ex.: "nenhum investimento")

### Requirement: Criar investimento

A tela SHALL permitir criar um investimento via `POST /api/investments` com o corpo
`{ name, type, currency, accountId? }`, onde `name` é obrigatório, `type`
pertence à taxonomia `renda_fixa | acoes | fii | cripto | outro`, e `currency` é não-vazia.
O campo `initialValue` NÃO SHALL ser enviado.

> **Removed**: `initialValue` removido do corpo de criação e do formulário.
> Para registrar um valor inicial, o usuário deve lançar um aporte após criar o investimento.

#### Scenario: Criação bem-sucedida

- **WHEN** o usuário informa `name`, `type`/`currency` válidos e opcionalmente `accountId`, e
  submete
- **THEN** o app envia `POST /api/investments` e, ao receber `201`, inclui o investimento na
  lista

#### Scenario: Type restrito à taxonomia

- **WHEN** o formulário oferece o campo `type`
- **THEN** as opções são exatamente `renda_fixa`, `acoes`, `fii`, `cripto`, `outro`

#### Scenario: Validação 400

- **WHEN** `POST /api/investments` retorna `400` (`type`/`currency`/`accountId` inválidos)
- **THEN** a tela exibe a `error.message` junto ao formulário sem perder os dados digitados

### Requirement: Editar investimento

A tela SHALL permitir editar um investimento via `PUT /api/investments/:id` enviando
`{ name, accountId }`. `type` e `currency` são **imutáveis** e NÃO SHALL ser
enviados; `accountId: null` limpa o vínculo com a conta. O campo `initialValue`
NÃO SHALL ser enviado.

> **Removed**: `initialValue` removido do corpo de edição e do formulário.

#### Scenario: Edição bem-sucedida

- **WHEN** o usuário altera `name`/`accountId` e submete
- **THEN** o app envia `PUT /api/investments/:id` **sem** `type`/`currency`/`initialValue`
  e, ao receber `200`, reflete a mudança

#### Scenario: type e currency somente-leitura

- **WHEN** a edição é apresentada
- **THEN** `type` e `currency` são somente-leitura; a UI não permite alterá-los

#### Scenario: Limpar o vínculo de conta

- **WHEN** o usuário escolhe "sem conta" na edição
- **THEN** o app envia `accountId: null`, limpando o vínculo

#### Scenario: Investimento inexistente ou de outro usuário

- **WHEN** `PUT /api/investments/:id` retorna `404`
- **THEN** a tela trata como "não encontrado", sem disparar login nem erro de sistema
