# web-investments-batch

## Purpose

Definir a **criação de investimentos em lote** (grade), via `POST /api/investments/batch`:
adicionar linhas (cada uma um investimento com `name`/`type`/`currency`/`initialValue?`/`accountId?`),
escolher a conta de investimento (`kind=investment`) por linha, validar localmente e enviar
com semântica **all-or-nothing** (CONTRACT §7): máx 100, array vazio rejeitado, e se um item
for inválido o lote inteiro falha (`400` com `index`) sem gravar nada — a UI destaca a linha
do índice. Valores em centavos.

## Requirements

### Requirement: Grade de criação de investimentos em lote

A tela SHALL oferecer uma criação em lote tipo grade, onde cada linha é um investimento com
os mesmos campos do create único (`name`, `type`, `currency`, `initialValue?`, `accountId?`).
A grade SHALL permitir escolher a conta de investimento (`kind === "investment"`, não
arquivadas) por linha e validar localmente antes de enviar.

#### Scenario: Adicionar linhas

- **WHEN** o usuário adiciona linhas e preenche `name`/`type`/`currency` (e opcionalmente
  `initialValue`/`accountId`)
- **THEN** cada linha representa um investimento a ser criado

#### Scenario: Validação local

- **WHEN** uma linha tem `name`/`currency` vazios ou `initialValue` inválido
- **THEN** a tela sinaliza a linha e não envia até corrigir; um lote vazio é bloqueado; o
  limite é 100 itens

### Requirement: Envio do lote all-or-nothing com índice no 400

A tela SHALL enviar via `POST /api/investments/batch` um **array** de itens e tratar a
resposta:
`201 { items: [...] }` ⇒ todos criados; `400` ⇒ **nada** foi gravado e o corpo traz
`index` (zero-based) do item inválido — a tela SHALL destacar a linha desse índice com a
`error.message`.

#### Scenario: Lote válido cria todos

- **WHEN** o lote é válido e o backend responde `201` com `{ "items": [...] }`
- **THEN** a tela confirma a criação de todos e atualiza/limpa a grade

#### Scenario: Item inválido falha o lote inteiro

- **WHEN** o backend responde `400` com `{ "error": { code, message }, "index": N }` (ex.:
  `type` fora da taxonomia, `currency` ausente, `accountId` não-usável)
- **THEN** a tela destaca a linha de índice `N` com a `message`, deixa claro que **nenhum** item
  foi gravado, e mantém os dados para correção

#### Scenario: Erro sem índice

- **WHEN** o `400` não traz `index` (ex.: array vazio)
- **THEN** a tela mostra a `error.message` geral, sem destacar uma linha

### Requirement: Estados de UI no lote de investimentos

A tela SHALL apresentar estados explícitos para enviando, erro e sem-sessão.

#### Scenario: Enviando

- **WHEN** o lote está sendo enviado
- **THEN** a tela mostra progresso e evita envio duplicado

#### Scenario: Sem-sessão

- **WHEN** uma chamada retorna `401`
- **THEN** o tratamento central marca "sem sessão" e o app exibe a tela de login
