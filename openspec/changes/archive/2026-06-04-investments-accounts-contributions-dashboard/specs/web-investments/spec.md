## MODIFIED Requirements

### Requirement: Listar investimentos com agregados do backend

A tela SHALL listar os investimentos via `GET /api/investments` (filtros `archived` e
`accountId` opcionais), lendo `{ "items": [...] }`, e SHALL exibir `name`, `type` legível,
`initialValue`, `totalInvested` (= `initialValue` + `totalContributed`) e `currentValue`
**formatados a partir dos centavos agregados pelo backend**, com `totalInvested` e
`currentValue` apresentados **distintamente** (o valor que se colocou vs. o que vale hoje). O
front NÃO SHALL recalcular esses agregados.

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
`{ name, type, currency, initialValue?, accountId? }`, onde `name` é obrigatório, `type`
pertence à taxonomia `renda_fixa | acoes | fii | cripto | outro`, `currency` é não-vazia, e
`initialValue` é inteiro em centavos (pode ser negativo, default `0`).

#### Scenario: Criação bem-sucedida

- **WHEN** o usuário informa `name`, `type`/`currency` válidos, e opcionalmente `initialValue`
  (centavos) e `accountId`, e submete
- **THEN** o app envia `POST /api/investments` e, ao receber `201`, inclui o investimento na
  lista

#### Scenario: Type restrito à taxonomia

- **WHEN** o formulário oferece o campo `type`
- **THEN** as opções são exatamente `renda_fixa`, `acoes`, `fii`, `cripto`, `outro`

#### Scenario: Valor inicial em centavos (pode ser negativo)

- **WHEN** o usuário informa um valor inicial (ex.: `-10,00`)
- **THEN** o app converte para centavos inteiros (`-1000`) antes de enviar; se omitido, envia
  `0` ou omite o campo

#### Scenario: Validação 400

- **WHEN** `POST /api/investments` retorna `400` (`type`/`currency`/`initialValue`/`accountId`
  inválidos)
- **THEN** a tela exibe a `error.message` junto ao formulário sem perder os dados digitados

### Requirement: Registrar aporte

A tela SHALL permitir registrar um aporte via `POST /api/investments/:id/contributions` com
`{ amount(inteiro > 0, centavos), occurredOn, note? }`. **Logo após** o sucesso, o app SHALL
re-buscar o investimento (`GET /api/investments/:id`) e exibir o `totalInvested` atualizado
(valor inicial + soma dos aportes), deixando claro o impacto do novo aporte. O front NÃO soma
no cliente.

#### Scenario: Aporte bem-sucedido atualiza o total investido

- **WHEN** o usuário informa `amount` > 0 (centavos), `occurredOn` válido (e `note` opcional)
  e submete
- **THEN** o app envia o `POST`, recebe `201`, re-busca `GET /api/investments/:id` e exibe o
  `totalInvested` atualizado a partir do backend, sinalizando o impacto do aporte

#### Scenario: Valor inválido (400)

- **WHEN** `POST .../contributions` retorna `400` (`amount <= 0`, data inválida)
- **THEN** a tela exibe a `error.message` sem perder os dados digitados

#### Scenario: Aporte em investimento arquivado (400)

- **WHEN** o investimento está arquivado e o backend responde `400`
- **THEN** a tela trata como erro do formulário e informa que arquivados não aceitam aportes

## REMOVED Requirements

### Requirement: Renomear investimento

**Reason**: O `PUT /api/investments/:id` deixou de ser apenas rename — agora aceita
`{ name, initialValue, accountId }`.
**Migration**: Ver a nova requirement "Editar investimento".

## ADDED Requirements

### Requirement: Editar investimento

A tela SHALL permitir editar um investimento via `PUT /api/investments/:id` enviando
`{ name, initialValue, accountId }`. `type` e `currency` são **imutáveis** e NÃO SHALL ser
enviados; `accountId: null` limpa o vínculo com a conta.

#### Scenario: Edição bem-sucedida

- **WHEN** o usuário altera `name`/`initialValue`/`accountId` e submete
- **THEN** o app envia `PUT /api/investments/:id` **sem** `type`/`currency` e, ao receber
  `200`, reflete a mudança (incluindo o novo `totalInvested`, se vier)

#### Scenario: type e currency somente-leitura

- **WHEN** a edição é apresentada
- **THEN** `type` e `currency` são somente-leitura; a UI não permite alterá-los

#### Scenario: Limpar o vínculo de conta

- **WHEN** o usuário escolhe "sem conta" na edição
- **THEN** o app envia `accountId: null`, limpando o vínculo

#### Scenario: Investimento inexistente ou de outro usuário

- **WHEN** `PUT /api/investments/:id` retorna `404`
- **THEN** a tela trata como "não encontrado", sem disparar login nem erro de sistema

### Requirement: Vínculo com conta de investimento

O formulário (criar e editar) SHALL oferecer um seletor de conta que lista **apenas** contas
`GET /api/accounts?archived=false` com `kind === "investment"`, permitindo vincular o
investimento (`accountId`) ou deixá-lo sem conta. Conta de outro `kind`, arquivada, de outro
usuário ou inexistente → `400`.

#### Scenario: Seletor só de contas de investimento

- **WHEN** o seletor de conta é exibido
- **THEN** ele lista apenas contas não-arquivadas com `kind === "investment"`, além da opção
  "sem conta"

#### Scenario: Conta não utilizável (400 por id no corpo)

- **WHEN** o backend responde `400` porque o `accountId` é de `kind` diferente, arquivado ou
  não pertence ao usuário
- **THEN** a tela trata como erro do campo de conta, exibe a `error.message` e permite
  reescolher

### Requirement: Dashboard por conta e por tipo

A tela SHALL apresentar uma visão que **agrupa** os investimentos da lista retornada por
`accountId` e por `type`, somando `totalInvested` (e `currentValue` quando houver) por grupo,
**agrupando por `currency` dentro de cada grupo** (sem converter moedas). O front apenas soma
os agregados já derivados pelo backend; NÃO recalcula nem mistura moedas. Cards de resumo: total
por conta, total por tipo, e total **sem conta** (`accountId null`). O nome da conta vem de
`GET /api/accounts`.

#### Scenario: Total por conta

- **WHEN** investimentos estão vinculados a contas
- **THEN** a visão mostra, por conta (nome de `GET /api/accounts`) e por moeda, o total de
  `totalInvested` formatado

#### Scenario: Total por tipo

- **WHEN** há investimentos de tipos diferentes
- **THEN** a visão mostra, por `type` e por moeda, o total de `totalInvested`

#### Scenario: Sem conta vinculada

- **WHEN** há investimentos com `accountId null`
- **THEN** a visão mostra o total desses (por moeda) num grupo "sem conta"

#### Scenario: Nunca mistura moedas

- **WHEN** existem investimentos em moedas diferentes num mesmo grupo
- **THEN** cada moeda tem seu próprio total; o app NÃO soma moedas diferentes
