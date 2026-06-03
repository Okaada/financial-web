## ADDED Requirements

### Requirement: Listar faturas de um cartão

A tela SHALL listar as faturas de um cartão via `GET /api/cards/:id/invoices`, lendo
`{ "items": [...] }`, exibindo `periodKey`, janela (`periodStart`/`closingDate`/`dueDate`),
`status`, `total` (centavos, formatado) e `miles` (inteiro derivado).

#### Scenario: Lista com itens

- **WHEN** `GET /api/cards/:id/invoices` retorna `200` com `{ "items": [invoice, ...] }`
- **THEN** a tela exibe cada fatura com competência, datas, status, total formatado e milhas

#### Scenario: Cartão sem faturas

- **WHEN** o retorno é `{ "items": [] }`
- **THEN** a tela mostra um estado vazio (ex.: "nenhuma fatura ainda") — faturas surgem
  quando há lançamentos vinculados ao cartão, criadas pelo backend (a UI não cria faturas)

### Requirement: Detalhe da fatura com transações

A tela SHALL exibir o detalhe via `GET /api/invoices/:id`, que retorna a fatura **mais**
`transactions`, listando os lançamentos que a compõem.

#### Scenario: Abrir detalhe

- **WHEN** o usuário abre uma fatura e `GET /api/invoices/:id` retorna `200` com a fatura e
  `"transactions": [...]`
- **THEN** a tela exibe os dados da fatura e a lista de transações (valor formatado, data,
  descrição quando presente)

#### Scenario: Fatura inexistente ou de outro usuário

- **WHEN** `GET /api/invoices/:id` retorna `404`
- **THEN** a tela trata como "não encontrada", sem disparar login nem erro de sistema

### Requirement: Máquina de estados da fatura (fechar/pagar)

A tela SHALL permitir avançar o estado da fatura conforme `open → closed → paid`, via
`POST /api/invoices/:id/close` e `POST /api/invoices/:id/pay`, oferecendo cada ação apenas
quando o `status` atual a permite.

#### Scenario: Fechar fatura aberta

- **WHEN** a fatura está `open` e o usuário aciona "Fechar"
- **THEN** o app envia `POST /api/invoices/:id/close`, recebe `200` com a fatura `closed` e
  atualiza o status exibido

#### Scenario: Pagar fatura fechada

- **WHEN** a fatura está `closed` e o usuário aciona "Pagar"
- **THEN** o app envia `POST /api/invoices/:id/pay`, recebe `200` com a fatura `paid` e
  atualiza o status

#### Scenario: Ações condicionais ao status

- **WHEN** a fatura está `paid` (ou `open`)
- **THEN** a UI não oferece a ação inválida (ex.: não há "Pagar" numa `open`, nem "Fechar"
  numa `paid`)

#### Scenario: Transição inválida (400)

- **WHEN** uma transição inválida é tentada e o backend responde `400`
- **THEN** a tela exibe a `message` do erro sem travar, e re-sincroniza o estado da fatura

### Requirement: Reabertura automática é refletida, não causada pela UI

A UI NÃO SHALL criar nem reabrir faturas; ela apenas reflete o estado retornado pelo backend
(faturas são criadas preguiçosamente e reabrem sozinhas quando um lançamento do período muda).

#### Scenario: Estado sempre vem do backend

- **WHEN** o usuário volta à lista/detalhe de faturas após editar um lançamento do período
- **THEN** a tela mostra o `status` atual conforme o backend (que pode ter reaberto a fatura),
  sem a UI tentar inferir/alterar esse estado

### Requirement: Estados de UI explícitos nas faturas

A tela SHALL apresentar estados explícitos para carregando, vazio, erro e sem-sessão.

#### Scenario: Carregando

- **WHEN** as faturas/detalhe estão sendo buscados
- **THEN** a tela mostra um indicador de carregamento

#### Scenario: Erro inesperado de sistema

- **WHEN** uma chamada falha com erro não-`401`
- **THEN** a tela mostra um estado de erro com opção de tentar novamente

#### Scenario: Sem-sessão

- **WHEN** uma chamada retorna `401`
- **THEN** o tratamento central de `401` redireciona para o login; a tela não renderiza
  conteúdo protegido
