## ADDED Requirements

### Requirement: Login por navegação top-level

O front SHALL iniciar o login redirecionando o browser (navegação de página inteira) para
`GET /api/auth/login`. O login NÃO SHALL ser feito via `fetch`/XHR, pois o backend
conduz todo o fluxo OIDC e devolve um redirect para `/`.

#### Scenario: Iniciar login

- **WHEN** o app precisa autenticar o usuário (sem sessão) ou o usuário aciona "entrar"
- **THEN** o app navega o browser para `GET /api/auth/login` via navegação top-level (ex.:
  `window.location.assign('/api/auth/login')`)
- **AND** o app não tenta ler token, `id_token` ou qualquer segredo do fluxo OIDC

#### Scenario: Retorno do backend após login

- **WHEN** o backend conclui o OIDC e redireciona de volta para `/`
- **THEN** o cookie de sessão já foi setado pelo backend e o app carrega normalmente como
  autenticado

### Requirement: Estado de autenticação inferido sem whoami

Como o CONTRACT.md não expõe endpoint de identidade (`whoami`), o front SHALL inferir o
estado de autenticação fazendo, ao carregar o app, uma chamada a um endpoint protegido e
interpretando o resultado: `401` ⇒ sem sessão; sucesso ⇒ autenticado.

#### Scenario: Sondagem inicial sem sessão

- **WHEN** o app carrega e a chamada de sondagem a um endpoint protegido retorna `401`
- **THEN** o app considera o usuário "sem sessão" e dispara o login (navegação top-level
  para `GET /api/auth/login`)

#### Scenario: Sondagem inicial com sessão válida

- **WHEN** o app carrega e a chamada de sondagem retorna sucesso (`2xx`)
- **THEN** o app considera o usuário autenticado e renderiza a tela protegida

#### Scenario: Sessão expira durante o uso

- **WHEN** uma sessão expira e uma chamada subsequente retorna `401`
- **THEN** o tratamento central de `401` do cliente HTTP redireciona para o login, sem
  exigir tratamento próprio na tela

### Requirement: Logout

O front SHALL encerrar a sessão via `POST /api/auth/logout` (através do cliente HTTP) e,
em seguida, levar o usuário ao login.

#### Scenario: Logout bem-sucedido

- **WHEN** o usuário aciona "sair"
- **THEN** o app envia `POST /api/auth/logout` (que responde `204` e limpa o cookie)
- **AND** após a resposta, o app redireciona para o login (navegação top-level para
  `GET /api/auth/login`)
