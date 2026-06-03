## ADDED Requirements

### Requirement: Listar investimentos com agregados do backend

A tela SHALL listar os investimentos via `GET /api/investments` (filtro `archived`
opcional), lendo `{ "items": [...] }`, e SHALL exibir `name`, `type`, `totalContributed` e
`currentValue` **formatados a partir dos centavos já agregados pelo backend**. O front NÃO
SHALL recalcular/somar agregados.

#### Scenario: Lista com itens

- **WHEN** `GET /api/investments` retorna `200` com `{ "items": [investment, ...] }`
- **THEN** a tela exibe cada investimento com `name` (ou um rótulo "(sem nome)"), o `type`
  legível, `totalContributed` formatado e `currentValue` formatado

#### Scenario: Valor atual ainda não marcado

- **WHEN** um investimento tem `currentValue: null`
- **THEN** a tela exibe um placeholder (ex.: "sem marcação") em vez de `R$ 0,00`, sem
  inventar um valor

#### Scenario: Filtro por arquivados

- **WHEN** o usuário filtra por `archived` (`true`/`false`)
- **THEN** o app monta a query apenas com o filtro preenchido e relista

#### Scenario: Lista vazia

- **WHEN** `GET /api/investments` retorna `{ "items": [] }`
- **THEN** a tela mostra o estado vazio explícito (ex.: "nenhum investimento")

### Requirement: Criar investimento

A tela SHALL permitir criar um investimento via `POST /api/investments` com o corpo
`{ type, currency, name? }`, onde `type` pertence à taxonomia fixa
`renda_fixa | acoes | fii | cripto | outro`.

#### Scenario: Criação bem-sucedida

- **WHEN** o usuário escolhe `type`/`currency` válidos (e opcionalmente `name`) e submete
- **THEN** o app envia `POST /api/investments` e, ao receber `201`, inclui o investimento na
  lista

#### Scenario: Type restrito à taxonomia

- **WHEN** o formulário oferece o campo `type`
- **THEN** as opções são exatamente `renda_fixa`, `acoes`, `fii`, `cripto`, `outro` (sem
  texto livre)

#### Scenario: Validação 400

- **WHEN** `POST /api/investments` retorna `400` (`type`/`currency` inválidos)
- **THEN** a tela exibe a `message` do erro junto ao formulário sem perder os dados
  digitados

### Requirement: Renomear investimento

A tela SHALL permitir renomear um investimento via `PUT /api/investments/:id` enviando
**apenas `name`**.

#### Scenario: Renome bem-sucedido

- **WHEN** o usuário edita o `name` e submete
- **THEN** o app envia `PUT /api/investments/:id` com `{ name }` e, ao receber `200`,
  reflete o novo nome na lista

#### Scenario: Investimento inexistente ou de outro usuário

- **WHEN** `PUT /api/investments/:id` retorna `404`
- **THEN** a tela trata como "não encontrado" (não revela existência), sem disparar login
  nem erro de sistema

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
`{ amount(inteiro > 0, centavos), occurredOn, note? }`. Após sucesso, o app SHALL re-buscar
o investimento para refletir o `totalContributed` agregado (não somar no front).

#### Scenario: Aporte bem-sucedido

- **WHEN** o usuário informa `amount` > 0 (em centavos), `occurredOn` válido (e `note`
  opcional) e submete
- **THEN** o app envia o `POST`, recebe `201` com a Contribution e re-busca
  `GET /api/investments/:id`, atualizando o `totalContributed` exibido a partir do backend

#### Scenario: Valor inválido (400)

- **WHEN** `POST .../contributions` retorna `400` (`amount <= 0`, data inválida)
- **THEN** a tela exibe a `message` do erro sem perder os dados digitados

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
