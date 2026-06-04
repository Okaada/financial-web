# web-transactions-batch

## Purpose

Definir a entrada de lançamentos **em lote** (tipo grade/planilha): adicionar/colar várias
linhas, escolher conta/categoria por linha, validar localmente e enviar via
`POST /api/transactions/batch`. A semântica é **all-or-nothing** (CONTRACT §4): máx 100
itens, array vazio rejeitado, e se um item for inválido o lote inteiro falha (`400` com
`index`) sem gravar nada — a UI destaca a linha do índice. Valores em centavos.

## Requirements

### Requirement: Grade de lançamento em lote

A tela SHALL oferecer uma entrada em lote tipo **grade/planilha**, onde o usuário adiciona
várias linhas (e/ou cola dados), cada linha sendo um lançamento com os mesmos campos do create
único (`type`, `amount` em centavos, `currency`, `occurredOn`, e opcionalmente `categoryId`,
`cardId`, `accountId`, `description`, `externalRef`). A grade SHALL permitir escolher conta e
categoria **por linha** (contas não-arquivadas; categorias compatíveis com o `type` da linha).

#### Scenario: Adicionar e editar linhas

- **WHEN** o usuário adiciona linhas e preenche os campos (incl. conta/categoria por linha)
- **THEN** cada linha representa um lançamento a ser criado; o usuário pode adicionar/remover
  linhas livremente

#### Scenario: Seletores por linha

- **WHEN** uma linha tem `type` definido
- **THEN** seu seletor de categoria oferece categorias do mesmo tipo, e o seletor de conta
  oferece apenas contas não-arquivadas

### Requirement: Validação local antes do envio

A tela SHALL validar cada linha localmente antes de enviar (campos obrigatórios:
`type ∈ {income, expense}`, `amount` inteiro em centavos, `currency`, `occurredOn`),
sinalizando linhas inválidas, e SHALL impedir o envio de um lote **vazio**.

#### Scenario: Linha inválida sinalizada localmente

- **WHEN** uma linha tem campo obrigatório faltando/!inválido (ex.: `amount` não numérico)
- **THEN** a tela sinaliza a linha e não envia até corrigir

#### Scenario: Lote vazio bloqueado

- **WHEN** não há nenhuma linha preenchida
- **THEN** a tela bloqueia o envio (o backend rejeitaria um array vazio com `400`)

#### Scenario: Limite de 100 itens

- **WHEN** o usuário tenta enviar mais de 100 linhas
- **THEN** a tela sinaliza o limite (o backend aceita no máximo 100 por lote)

### Requirement: Envio all-or-nothing com destaque do índice no 400

A tela SHALL enviar o lote via `POST /api/transactions/batch` com um **array** de itens e
tratar a resposta: `201 { items: [...] }` ⇒ todos criados; `400` ⇒ **nada** foi gravado e o
corpo traz `index` (zero-based) do item inválido — a tela SHALL **destacar a linha** desse
índice com a `error.message`.

#### Scenario: Lote válido cria todos

- **WHEN** o lote é válido e o backend responde `201` com `{ "items": [...] }`
- **THEN** a tela confirma a criação de todos os itens e limpa/atualiza a grade

#### Scenario: Um item inválido falha o lote inteiro

- **WHEN** o backend responde `400` com `{ "error": { code, message }, "index": N }`
- **THEN** a tela destaca a linha de índice `N` com a `message`, deixa claro que **nenhum**
  item foi gravado, e mantém os dados digitados para correção

#### Scenario: Erro sem índice

- **WHEN** o `400` não traz `index` (ex.: array vazio rejeitado)
- **THEN** a tela mostra a `error.message` geral, sem destacar uma linha específica

### Requirement: Feedback de saldo após o lote

Após um lote bem-sucedido que contém itens vinculados a contas, a tela SHALL refletir o saldo
atualizado das contas afetadas re-buscando-as (`GET /api/accounts/:id`) — sem recalcular no
front.

#### Scenario: Saldos das contas afetadas atualizam

- **WHEN** um lote `201` continha itens com `accountId`
- **THEN** o app re-busca as contas afetadas e exibe seus `currentBalance` atualizados

### Requirement: Estados de UI explícitos no lote

A tela de lote SHALL apresentar estados explícitos para carregando (envio), erro e sem-sessão.

#### Scenario: Enviando

- **WHEN** o lote está sendo enviado
- **THEN** a tela mostra um indicador de progresso e evita envio duplicado

#### Scenario: Erro de sistema

- **WHEN** o envio falha com erro não-`401`/não-`400` (ex.: `500`/rede)
- **THEN** a tela mostra um estado de erro com opção de tentar novamente, sem perder a grade

#### Scenario: Sem-sessão

- **WHEN** uma chamada retorna `401`
- **THEN** o tratamento central marca "sem sessão" e o app exibe a tela de login
