## ADDED Requirements

### Requirement: Seletor de cartão na transação

O formulário de transação (criar e editar) SHALL oferecer um seletor de cartão opcional,
populado por `GET /api/cards` (não arquivados), permitindo associar o lançamento a um cartão
(`cardId`) ou deixá-lo ad-hoc ("sem cartão").

#### Scenario: Carregar cartões para o seletor

- **WHEN** o formulário de transação é aberto
- **THEN** o app busca `GET /api/cards?archived=false` e popula o seletor com os cartões
  retornados, além da opção "sem cartão"

#### Scenario: Associar a um cartão

- **WHEN** o usuário escolhe um cartão e cria/edita a transação
- **THEN** o app envia `cardId` no corpo (no `POST`/`PUT`), vinculando o lançamento à fatura
  do período no backend

#### Scenario: Sem cartão (ad-hoc)

- **WHEN** o usuário não seleciona cartão
- **THEN** no `POST` o `cardId` é omitido; no `PUT` (full replace) o `cardId` é enviado como
  `null`, mantendo o lançamento fora de qualquer fatura

#### Scenario: Cartão inválido ou arquivado (400 por id no corpo)

- **WHEN** o backend responde `400` porque o `cardId` é inválido, arquivado ou não pertence
  ao usuário
- **THEN** a tela trata como erro do campo de cartão, exibe a `message` e permite reescolher
