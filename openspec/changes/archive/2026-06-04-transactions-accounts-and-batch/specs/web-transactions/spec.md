## MODIFIED Requirements

### Requirement: Seletor de categoria

O formulário SHALL oferecer um seletor de categoria populado por
`GET /api/categories?type=<type>`, onde `<type>` é o **tipo do lançamento** (`income` ou
`expense`) — não mais fixo em `expense` — lendo os itens de `{ "items": [...] }` (não
arquivadas). Ao trocar o `type` do lançamento, o seletor SHALL recarregar com as categorias
compatíveis.

#### Scenario: Carregar categorias compatíveis com o tipo

- **WHEN** o formulário é aberto (ou o `type` é alterado) para `expense`
- **THEN** o app busca `GET /api/categories?type=expense` e popula o seletor com as categorias
  retornadas (não arquivadas)

#### Scenario: Tipo income carrega categorias de income

- **WHEN** o `type` do lançamento é `income`
- **THEN** o seletor é populado por `GET /api/categories?type=income`

#### Scenario: Categoria opcional

- **WHEN** o usuário não seleciona categoria
- **THEN** o app omite `categoryId` no corpo (o campo é opcional), enviando a transação sem
  categoria

#### Scenario: Categoria incompatível/arquivada (400)

- **WHEN** o backend responde `400` porque o `categoryId` é de tipo incompatível, arquivado ou
  não pertence ao usuário
- **THEN** a tela trata como erro do campo de categoria, exibe a `error.message` e permite
  reescolher

## ADDED Requirements

### Requirement: Seletor de conta na transação

O formulário (criar e editar) SHALL oferecer um seletor de conta **opcional**, populado por
`GET /api/accounts?archived=false` (só não-arquivadas), permitindo vincular o lançamento a uma
conta (`accountId`) ou deixá-lo sem conta.

#### Scenario: Carregar contas para o seletor

- **WHEN** o formulário de transação é aberto
- **THEN** o app busca `GET /api/accounts?archived=false` e popula o seletor com as contas
  retornadas, além da opção "sem conta"

#### Scenario: Vincular a uma conta

- **WHEN** o usuário escolhe uma conta e cria/edita o lançamento
- **THEN** o app envia `accountId` no corpo; no `POST` omite quando "sem conta"; no `PUT`
  (full replace) envia `null` quando "sem conta"

#### Scenario: Conta inválida ou arquivada (400 por id no corpo)

- **WHEN** o backend responde `400` porque o `accountId` é inválido, arquivado ou não pertence
  ao usuário
- **THEN** a tela trata como erro do campo de conta, exibe a `error.message` e permite
  reescolher

### Requirement: Filtro e visão por conta

A listagem SHALL permitir filtrar por `accountId` (`GET /api/transactions?accountId=`). Quando
filtrada por uma conta, a tela SHALL exibir o **saldo** daquela conta
(`GET /api/accounts/:id` → `currentBalance` formatado) junto dos lançamentos.

#### Scenario: Filtrar por conta mostra saldo + lançamentos

- **WHEN** o usuário filtra por uma `accountId`
- **THEN** o app relista `GET /api/transactions?accountId=...` e exibe o `currentBalance` da
  conta (de `GET /api/accounts/:id`) acima/junto da lista

#### Scenario: Limpar o filtro de conta

- **WHEN** o usuário remove o filtro de conta
- **THEN** o app relista sem `accountId` e oculta o bloco de saldo por conta

### Requirement: Feedback de saldo após mutação

Após criar, editar ou excluir um lançamento **vinculado a uma conta**, o app SHALL re-buscar a
conta afetada (`GET /api/accounts/:id`) e refletir o novo `currentBalance` — o front NÃO
recalcula o saldo, apenas re-busca o valor derivado pelo backend.

#### Scenario: Saldo reflete o novo lançamento

- **WHEN** o usuário cria/edita/exclui um lançamento com `accountId` e a operação tem sucesso
- **THEN** o app re-busca `GET /api/accounts/:id` da conta afetada e exibe o `currentBalance`
  atualizado, deixando claro o impacto do lançamento

#### Scenario: Lançamento sem conta não dispara re-busca

- **WHEN** o lançamento não tem `accountId`
- **THEN** o app não precisa re-buscar conta alguma (não há saldo de conta a atualizar)
