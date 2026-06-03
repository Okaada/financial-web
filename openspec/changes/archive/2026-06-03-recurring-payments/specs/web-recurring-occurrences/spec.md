## ADDED Requirements

### Requirement: Listar ocorrências previstas

A tela de Previstos SHALL listar as ocorrências calculadas via
`GET /api/recurring-occurrences` com `from` e `to` **obrigatórios** (`YYYY-MM-DD`), lendo
`{ "items": [...] }`. As ocorrências são calculadas no backend e NÃO são persistidas.

#### Scenario: Período válido com ocorrências

- **WHEN** o usuário informa `from`/`to` válidos e o backend retorna `200` com
  `{ "items": [occurrence, ...] }`
- **THEN** a tela exibe cada ocorrência com `date`, valor formatado, `type`, `competence` e
  o estado `confirmed`

#### Scenario: from/to obrigatórios

- **WHEN** o usuário tenta listar sem `from` ou sem `to`
- **THEN** a tela não envia a requisição e sinaliza que ambas as datas são obrigatórias

#### Scenario: Intervalo inválido (400)

- **WHEN** `GET /api/recurring-occurrences` retorna `400` (ex.: `from > to` ou intervalo
  grande demais)
- **THEN** a tela exibe a `message` do erro e mantém as datas informadas

#### Scenario: Período sem ocorrências

- **WHEN** o backend retorna `{ "items": [] }` para o período
- **THEN** a tela mostra o estado vazio explícito (ex.: "nada previsto no período")

### Requirement: Confirmar ocorrência (idempotente)

A tela SHALL permitir confirmar uma ocorrência via
`POST /api/recurring-templates/:id/confirm` com `{ competence: "YYYY-MM" }`, que materializa
uma transação real. A operação é idempotente por `(template, competence)`.

#### Scenario: Primeira confirmação

- **WHEN** o usuário confirma uma ocorrência ainda não confirmada e o backend responde `201`
  com a transação criada
- **THEN** a tela marca a ocorrência como confirmada e passa a exibir o vínculo
  (`transactionId`), deixando de oferecer "confirmar"

#### Scenario: Reconfirmação não duplica

- **WHEN** uma competência já confirmada é confirmada de novo e o backend responde `200` com
  a MESMA transação (sem duplicar)
- **THEN** a tela reflete "já confirmado" e usa a transação retornada, sem criar um segundo
  lançamento

#### Scenario: Ocorrência já confirmada não oferece confirmar

- **WHEN** uma ocorrência chega com `confirmed: true` e `transactionId` preenchido
- **THEN** a UI mostra o estado "confirmado" (com o vínculo da transação) em vez de um botão
  de confirmar

#### Scenario: Competência inválida (400)

- **WHEN** `POST /api/recurring-templates/:id/confirm` retorna `400` (competência inválida)
- **THEN** a tela exibe a `message` do erro sem travar a lista

### Requirement: Estados de UI explícitos na tela de previstos

A tela SHALL apresentar estados explícitos para carregando, vazio, erro e sem-sessão.

#### Scenario: Carregando

- **WHEN** as ocorrências estão sendo buscadas
- **THEN** a tela mostra um indicador de carregamento

#### Scenario: Erro inesperado de sistema

- **WHEN** uma chamada falha com erro não-`401` (ex.: `500` ou falha de rede)
- **THEN** a tela mostra um estado de erro com opção de tentar novamente

#### Scenario: Sem-sessão

- **WHEN** uma chamada retorna `401`
- **THEN** o tratamento central de `401` redireciona para o login; a tela não renderiza
  conteúdo protegido
