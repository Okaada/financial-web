# web-investments

## Purpose

Definir a tela de investimentos: listar (com agregados `totalContributed`/`totalInvested`/
`currentValue` vindos do backend), criar (taxonomia fixa, vínculo opcional a conta
`kind=investment`), editar (`name`/`accountId`; `type`/`currency` imutáveis), arquivar,
registrar aportes e marcações de valor (valuations), e um dashboard que agrupa `totalInvested`
por conta e por tipo (por moeda). O front nunca recalcula agregados — re-busca o investimento
após aporte/valuation; `totalInvested` (= `totalContributed`, soma dos aportes) e `currentValue`
(última valuation, independente) são exibidos distintamente.

## Requirements

### Requirement: Listar investimentos com agregados do backend

A tela SHALL listar os investimentos via `GET /api/investments` (filtros `archived` e
`accountId` opcionais), lendo `{ "items": [...] }`, e SHALL exibir `name`, `type` legível,
`totalInvested` (= `totalContributed`, soma dos aportes) e `currentValue`
**formatados a partir dos centavos agregados pelo backend**, com `totalInvested` e
`currentValue` apresentados **distintamente** (o que se colocou via aportes vs. o que vale
hoje). O front NÃO SHALL recalcular esses agregados.

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

### Requirement: Arquivar investimento (sem hard delete)

A tela SHALL permitir arquivar um investimento via `POST /api/investments/:id/archive`. NÃO
há exclusão definitiva.

#### Scenario: Arquivamento bem-sucedido

- **WHEN** o usuário arquiva um investimento e o backend responde `200` com o recurso
  arquivado
- **THEN** a tela reflete `archived: true`

#### Scenario: Arquivado não oferece aporte/valuation

- **WHEN** um investimento está arquivado
- **THEN** a UI não oferece registrar aporte nem valor para ele

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

### Requirement: Registrar valor atual (valuation)

A tela SHALL permitir registrar o valor atual via `POST /api/investments/:id/valuations` com
`{ currentValue(centavos), recordedOn }`. As marcações são append-only no backend; o
`currentValue` autoritativo é o da marcação mais recente. Após sucesso, o app SHALL
re-buscar o investimento para refletir o `currentValue` agregado.

#### Scenario: Marcação bem-sucedida

- **WHEN** o usuário informa `currentValue` (em centavos) e `recordedOn` válidos e submete
- **THEN** o app envia o `POST`, recebe `201` com a Valuation e re-busca
  `GET /api/investments/:id`, atualizando o `currentValue` exibido a partir do backend

#### Scenario: Evolução limitada à sessão (sem endpoint de histórico)

- **WHEN** o usuário registra valuations
- **THEN** a UI pode listar as valuations criadas **nesta sessão** (a partir das respostas
  dos `POST`), deixando claro que não há histórico persistente a buscar (não existe endpoint
  de listagem de valuations no CONTRACT)

#### Scenario: Valor inválido ou investimento arquivado (400)

- **WHEN** `POST .../valuations` retorna `400` (valor inválido ou investimento arquivado)
- **THEN** a tela exibe a `message` do erro sem travar a tela

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

### Requirement: Estados de UI explícitos na tela de investimentos

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
