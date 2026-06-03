# web-dashboard

## Purpose

Definir a tela inicial **Visão geral** (dashboard): uma composição de blocos independentes
que reúnem indicadores das demais áreas (faturas em aberto, previstos do mês,
investimentos, últimas transações) a partir de endpoints `GET` já existentes. A tela exibe
**apenas valores já agregados pelo backend** ou listas curtas — nunca recalcula/soma
agregados no front nem inventa endpoint de resumo (não há `/summary` no CONTRACT). Cada
bloco carrega, esvazia e erra de forma isolada; a falha de um não derruba os demais.

## Requirements

### Requirement: Tela inicial de visão geral

O app SHALL apresentar uma tela **Visão geral** (dashboard) como tela inicial, composta
por blocos independentes que reúnem indicadores das demais áreas. A tela SHALL exibir
**apenas valores já agregados pelo backend**, contagens ou listas curtas — NÃO SHALL
recalcular nem somar agregados no front, nem inventar endpoints de resumo (não há
endpoint de summary no CONTRACT).

#### Scenario: Visão geral é a tela inicial

- **WHEN** o usuário autenticado abre o app
- **THEN** a tela inicial exibida é a Visão geral, com seus blocos (faturas em aberto,
  previstos do mês, investimentos, últimas transações, cartões)

#### Scenario: Nenhum total cruzado fabricado

- **WHEN** a Visão geral exibe valores monetários
- **THEN** cada valor mostrado vem diretamente de um agregado do backend (ex.: `total`
  de uma fatura, `currentValue` de um investimento) — a tela NÃO soma listas para
  produzir "patrimônio total" ou "gasto do mês", pois não há endpoint de resumo no
  CONTRACT

### Requirement: Bloco de faturas em aberto

O bloco de faturas em aberto SHALL listar as faturas com `status === "open"` dos cartões
não arquivados, obtidas via `GET /api/cards?archived=false` e, para cada cartão,
`GET /api/cards/:id/invoices` (o endpoint NÃO aceita filtro de status — o app filtra
`status === "open"` sobre os itens já retornados, o que é uma seleção de campo, não um
recálculo de agregado), exibindo por fatura o cartão, `periodKey`, `dueDate` e `total`
(centavos, formatado — agregado pelo backend).

#### Scenario: Há faturas em aberto

- **WHEN** algum cartão não arquivado possui fatura `open`
- **THEN** o bloco lista cada fatura aberta com o nome do cartão (ou "(sem nome)"),
  competência, vencimento e total formatado a partir dos centavos retornados

#### Scenario: Nenhuma fatura em aberto

- **WHEN** nenhum cartão possui fatura `open` (ou não há cartões)
- **THEN** o bloco mostra um estado vazio explícito (ex.: "nenhuma fatura em aberto")

#### Scenario: Atalho para cartões

- **WHEN** o usuário aciona "ver tudo" no bloco de faturas/cartões
- **THEN** o app navega para a tela de cartões

### Requirement: Bloco de previstos do mês

O bloco de previstos SHALL exibir as ocorrências recorrentes do mês corrente via
`GET /api/recurring-occurrences?from=&to=` (ambos `YYYY-MM-DD` obrigatórios; `from` = 1º
dia e `to` = último dia do mês corrente, derivados de `new Date()`), destacando as ainda
pendentes/à confirmar.

#### Scenario: Previstos do mês corrente

- **WHEN** existem ocorrências previstas para a competência atual
- **THEN** o bloco lista cada previsto com sua descrição/valor formatado (centavos) e
  estado, marcando os pendentes

#### Scenario: Sem previstos

- **WHEN** não há ocorrências para a competência atual
- **THEN** o bloco mostra um estado vazio explícito (ex.: "nenhum previsto para o mês")

#### Scenario: Atalho para previstos

- **WHEN** o usuário aciona "ver tudo" no bloco de previstos
- **THEN** o app navega para a tela de ocorrências recorrentes

### Requirement: Bloco de investimentos

O bloco de investimentos SHALL exibir uma lista curta de `GET /api/investments?archived=false`,
mostrando por investimento o `name` (ou "(sem nome)"), o `type` legível e o `currentValue`
formatado a partir dos centavos agregados pelo backend (ou placeholder quando `null`).

#### Scenario: Lista curta de investimentos

- **WHEN** o usuário possui investimentos não arquivados
- **THEN** o bloco exibe os investimentos com nome, tipo e valor atual formatado (ou
  "sem marcação" quando `currentValue` é `null`)

#### Scenario: Sem investimentos

- **WHEN** não há investimentos não arquivados
- **THEN** o bloco mostra um estado vazio explícito (ex.: "nenhum investimento")

#### Scenario: Atalho para investimentos

- **WHEN** o usuário aciona "ver tudo" no bloco de investimentos
- **THEN** o app navega para a tela de investimentos

### Requirement: Bloco de últimas transações

O bloco de últimas transações SHALL exibir as N transações mais recentes de
`GET /api/transactions`, com valor formatado (centavos), `occurredOn`, `type` e
`description` quando presente.

#### Scenario: Últimas transações

- **WHEN** `GET /api/transactions` retorna itens
- **THEN** o bloco exibe as N mais recentes com valor formatado, data, tipo e descrição
  (quando presente)

#### Scenario: Sem transações

- **WHEN** `GET /api/transactions` retorna `{ "items": [] }`
- **THEN** o bloco mostra um estado vazio explícito (ex.: "nenhuma transação ainda")

#### Scenario: Atalho para transações

- **WHEN** o usuário aciona "ver tudo" no bloco de transações
- **THEN** o app navega para a tela de transações

### Requirement: Isolamento de falha por bloco

Cada bloco da Visão geral SHALL ter estados de UI próprios (carregando, vazio, erro com
"tentar novamente"); a falha de um bloco NÃO SHALL derrubar os demais nem a tela inteira.

#### Scenario: Carregando por bloco

- **WHEN** os dados de um bloco estão sendo buscados
- **THEN** aquele bloco mostra um indicador de carregamento enquanto os outros podem já
  estar prontos

#### Scenario: Erro isolado em um bloco

- **WHEN** a chamada de um bloco falha com erro não-`401` (ex.: `500` ou falha de rede)
- **THEN** apenas aquele bloco mostra um estado de erro com opção de "tentar novamente",
  e os demais blocos continuam exibindo seus dados

#### Scenario: Recurso ausente tratado como vazio

- **WHEN** uma chamada de bloco retorna `404` (recurso de outro usuário/inexistente)
- **THEN** o bloco trata como "não encontrado"/vazio, sem disparar login nem erro de
  sistema

#### Scenario: Sem-sessão

- **WHEN** qualquer chamada de bloco retorna `401`
- **THEN** o tratamento central de `401` redireciona para o login; a Visão geral não
  renderiza conteúdo protegido
