## ADDED Requirements

### Requirement: Registrar consentimento

A tela de Conta SHALL permitir registrar um consentimento via
`POST /api/account/consent` com o corpo `{ version }`, onde `version` é a string da versão
corrente do termo. Ao receber `201` `{ id, version, grantedAt }`, a tela SHALL refletir o
registro (exibindo `version` e `grantedAt`).

#### Scenario: Consentimento registrado

- **WHEN** o usuário aciona "registrar consentimento" para a versão corrente do termo
- **THEN** o app envia `POST /api/account/consent { version }` e, ao receber `201`, exibe
  a confirmação com `version` e `grantedAt`

#### Scenario: Versão ausente (400)

- **WHEN** `POST /api/account/consent` retorna `400` (version ausente/ inválida)
- **THEN** a tela exibe a `message` do erro sem travar, permitindo tentar novamente

### Requirement: Trilha de auditoria (somente-leitura)

A tela de Conta SHALL exibir a trilha de auditoria da própria conta via
`GET /api/account/audit`, lendo `{ items: [{ id, eventType, metadata, createdAt }] }`. A
lista é somente-leitura. `metadata` é um objeto de chaves allowlisted e SHALL ser
renderizado como **dados estruturados** (pares chave/valor), NUNCA via
`dangerouslySetInnerHTML` nem como HTML interpretado.

#### Scenario: Lista de eventos

- **WHEN** `GET /api/account/audit` retorna `200` com `{ "items": [evento, ...] }`
- **THEN** a tela exibe cada evento com `eventType`, `createdAt` e os pares de `metadata`
  renderizados como texto/dados estruturados

#### Scenario: Sem eventos

- **WHEN** o retorno é `{ "items": [] }`
- **THEN** a tela mostra um estado vazio explícito (ex.: "nenhum evento de auditoria")

#### Scenario: Auditoria nunca é renderizada como HTML

- **WHEN** um valor de `metadata` contém caracteres que pareçam marcação (ex.: `<...>`)
- **THEN** ele é exibido como texto literal (escapado pelo React), sem
  `dangerouslySetInnerHTML` e sem execução de qualquer conteúdo

### Requirement: Excluir conta (LGPD, self-only, irreversível)

A tela de Conta SHALL permitir excluir a conta do próprio usuário via
`DELETE /api/account`, que responde `204` e faz o backend limpar o cookie `fa_session`. É
**self-only** (sem id) e **hard delete irreversível**. A ação SHALL exigir uma confirmação
forte do usuário antes de enviar o `DELETE`.

#### Scenario: Confirmação forte antes de excluir

- **WHEN** o usuário aciona "excluir minha conta"
- **THEN** a tela exige uma confirmação explícita e deliberada (ex.: digitar uma palavra
  de confirmação) antes de habilitar/enviar o `DELETE` — um clique simples não basta

#### Scenario: Exclusão bem-sucedida encerra a sessão

- **WHEN** o usuário confirma e o backend responde `204` (cookie de sessão limpo)
- **THEN** a tela trata a sessão como encerrada e redireciona para o login (mesma mecânica
  do logout), sem renderizar mais conteúdo protegido

#### Scenario: Sem forma de excluir por id

- **WHEN** a tela oferece a exclusão
- **THEN** ela usa apenas `DELETE /api/account` (self-only); NÃO existe nem é oferecida
  exclusão de outra conta por id

### Requirement: Estados de UI explícitos na tela de Conta

A tela de Conta SHALL apresentar estados explícitos para carregando, vazio, erro e
sem-sessão, por operação, sem telas ambíguas.

#### Scenario: Carregando

- **WHEN** a auditoria está sendo buscada (ou uma ação está em andamento)
- **THEN** a tela mostra um indicador de carregamento para aquela operação

#### Scenario: Erro inesperado de sistema

- **WHEN** uma chamada falha com erro não-`401` (ex.: `500` ou falha de rede)
- **THEN** a tela mostra um estado de erro com opção de tentar novamente, sem travar o app

#### Scenario: Sem-sessão

- **WHEN** uma chamada retorna `401`
- **THEN** o tratamento central de `401` redireciona para o login; a tela não renderiza
  conteúdo protegido
