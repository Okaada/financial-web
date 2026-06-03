## ADDED Requirements

### Requirement: Camada única de acesso HTTP

O front SHALL rotear toda chamada à Finance API por uma única camada de cliente HTTP
(wrapper de `fetch`). Nenhum componente, hook ou tela SHALL chamar `fetch` (ou
equivalente) diretamente contra `/api/*`.

#### Scenario: Toda requisição usa credentials same-origin

- **WHEN** o cliente HTTP emite qualquer requisição para `/api/*`
- **THEN** a requisição é feita com `credentials: 'same-origin'`, de modo que o browser
  anexa automaticamente o cookie de sessão `fa_session`
- **AND** o JS não lê nem grava o cookie de sessão em nenhum momento

#### Scenario: Caminho relativo mesmo-origin

- **WHEN** uma chamada é feita a um endpoint da API
- **THEN** a URL é montada como caminho relativo sob `/api` (mesmo origin do app)
- **AND** nenhuma origem absoluta/cross-origin é usada, dispensando CORS

### Requirement: Tratamento central do envelope de erro

O cliente HTTP SHALL interpretar o envelope de erro padrão da API
`{ error: { code, message } }` e expor `code` e `message` de forma estruturada para o
chamador, em vez de devolver a `Response` crua.

#### Scenario: Resposta de erro com envelope

- **WHEN** a API responde com status de erro (ex.: `400`) e corpo
  `{ "error": { "code": "bad_request", "message": "..." } }`
- **THEN** o cliente HTTP rejeita/retorna um erro estruturado contendo `status`, `code` e
  `message`
- **AND** o chamador pode distinguir o erro pelo `code` sem reparsear o corpo

#### Scenario: Resposta de erro sem corpo parseável

- **WHEN** a API responde com status de erro mas sem um corpo JSON válido no formato do
  envelope (ex.: `500` sem corpo, ou corpo malformado)
- **THEN** o cliente HTTP produz um erro estruturado com o `status` HTTP e um `code`
  genérico de fallback, sem lançar exceção não tratada de parsing

#### Scenario: Sucesso sem conteúdo

- **WHEN** a API responde `204 No Content` (ex.: logout)
- **THEN** o cliente HTTP resolve com sucesso e sem tentar parsear corpo

### Requirement: Tratamento central de 401

O cliente HTTP SHALL tratar qualquer resposta `401` de forma central, sinalizando "sem
sessão" e disparando o redirecionamento para o login, sem que cada chamador precise tratar
`401` individualmente.

#### Scenario: 401 em qualquer chamada redireciona para login

- **WHEN** qualquer requisição via cliente HTTP recebe `401`
- **THEN** o cliente HTTP aciona o fluxo de login (navegação top-level do browser para
  `GET /api/auth/login`)
- **AND** a `Promise` daquela chamada não resolve com dados de sucesso

#### Scenario: 404 não é tratado como 401 nem como falha de sistema

- **WHEN** uma requisição recebe `404` (recurso inexistente ou de outro tenant — o backend
  não revela existência)
- **THEN** o cliente HTTP retorna um erro estruturado `not_found` para o chamador tratar
  como "não encontrado"
- **AND** o `404` não dispara o fluxo de login nem é classificado como erro inesperado de
  sistema
