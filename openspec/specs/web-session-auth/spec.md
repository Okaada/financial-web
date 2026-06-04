# web-session-auth

## Purpose

Definir como o front estabelece e encerra a sessão sem endpoint de identidade
(`whoami`): uma **tela de login (somente Google)** com login por navegação top-level para
`GET /api/auth/login` iniciado pelo usuário, estado de autenticação **observável**
(`unknown | authenticated | unauthenticated`) inferido por sondagem de endpoint protegido
(`401` ⇒ sem sessão), e logout via `POST /api/auth/logout` que leva à tela de login (sem
reiniciar o OIDC).

## Requirements

### Requirement: Login por navegação top-level

O front SHALL iniciar o login redirecionando o browser (navegação de página inteira) para
`GET /api/auth/login`, e isso SHALL ser disparado **pela ação explícita do usuário** na tela
de login (botão "Entrar com Google") — NÃO automaticamente em resposta a um `401`. O login
NÃO SHALL ser feito via `fetch`/XHR, pois o backend conduz todo o fluxo OIDC e devolve um
redirect para `/`.

#### Scenario: Iniciar login a partir da tela de login

- **WHEN** o usuário aciona "Entrar com Google" na tela de login
- **THEN** o app navega o browser para `GET /api/auth/login` via navegação top-level (ex.:
  `window.location.assign('/api/auth/login')`)
- **AND** o app não tenta ler token, `id_token` ou qualquer segredo do fluxo OIDC

#### Scenario: Retorno do backend após login

- **WHEN** o backend conclui o OIDC e redireciona de volta para `/`
- **THEN** o cookie de sessão já foi setado pelo backend e o app carrega normalmente como
  autenticado

### Requirement: Estado de autenticação inferido sem whoami

Como o CONTRACT.md não expõe endpoint de identidade (`whoami`), o front SHALL inferir o
estado de autenticação a partir das chamadas a endpoints protegidos, mantendo um estado
observável (`unknown | authenticated | unauthenticated`): uma resposta de sucesso ⇒
autenticado; um `401` ⇒ sem sessão. Ao carregar, o app SHALL fazer uma sondagem a um
endpoint protegido e exibir um estado de carregamento (splash) até resolver. Um `401` NÃO
SHALL mais disparar navegação automática para o login — ele SHALL apenas marcar "sem sessão"
para que o app exiba a tela de login.

#### Scenario: Sondagem inicial sem sessão

- **WHEN** o app carrega e a sondagem a um endpoint protegido retorna `401`
- **THEN** o app marca "sem sessão" e **exibe a tela de login** (sem navegar automaticamente
  para `GET /api/auth/login`)

#### Scenario: Sondagem inicial com sessão válida

- **WHEN** o app carrega e a sondagem retorna sucesso (`2xx`)
- **THEN** o app marca "autenticado" e renderiza a tela protegida

#### Scenario: Splash durante a sondagem

- **WHEN** o estado ainda é `unknown` (sondagem em andamento)
- **THEN** o app exibe um splash neutro, sem piscar conteúdo protegido nem a tela de login

#### Scenario: Sessão expira durante o uso

- **WHEN** uma sessão expira e uma chamada subsequente retorna `401`
- **THEN** o cliente HTTP marca "sem sessão" e o app passa a exibir a tela de login, sem
  exigir tratamento próprio na tela

### Requirement: Logout

O front SHALL encerrar a sessão via `POST /api/auth/logout` (através do cliente HTTP) e, em
seguida, marcar "sem sessão" para exibir a **tela de login**. O front NÃO SHALL, após o
logout, navegar para `GET /api/auth/login` (isso reiniciaria o OIDC e, com a sessão do Google
ainda ativa, re-autenticaria o usuário em silêncio — anulando o logout).

#### Scenario: Logout bem-sucedido leva à tela de login

- **WHEN** o usuário aciona "sair"
- **THEN** o app envia `POST /api/auth/logout` (que responde `204` e limpa o cookie)
- **AND** após a resposta, o app marca "sem sessão" e exibe a tela de login, **sem** reiniciar
  o OIDC; entrar de novo exige o usuário acionar "Entrar com Google"

#### Scenario: Logout resiliente a falha de rede

- **WHEN** o `POST /api/auth/logout` falha (rede/erro)
- **THEN** o app ainda marca "sem sessão" e exibe a tela de login (a intenção do usuário é
  sair), sem travar

### Requirement: Tela de login (somente Google)

O front SHALL apresentar uma tela de login quando o estado for "sem sessão", contendo a
marca e um único meio de autenticação: um botão **"Entrar com Google"**. O logo do Google
SHALL ser um SVG inline (sem recurso externo/CDN, preservando a CSP). A tela NÃO SHALL expor
qualquer outro método de login (sem usuário/senha, sem outros provedores).

#### Scenario: Exibir a tela de login

- **WHEN** o app está "sem sessão" (sondagem `401`, logout, ou exclusão de conta)
- **THEN** exibe a tela de login centralizada, responsiva e com o tema atual (claro/escuro),
  com o botão "Entrar com Google" como única ação

#### Scenario: Somente Google

- **WHEN** a tela de login é exibida
- **THEN** o único meio de autenticação oferecido é o Google (OIDC via backend); não há
  campos de credencial nem outros provedores

#### Scenario: Sem recurso externo no logo

- **WHEN** o botão "Entrar com Google" é renderizado
- **THEN** o logo é um SVG inline (sem `<img>` de CDN, sem fonte externa), e a CSP permanece
  restritiva

### Requirement: Cadastro gated por convite (signup_denied)

O cadastro é restrito a uma allowlist/convite. Quando uma chamada protegida retorna `403`
com `code: "signup_denied"` (login OIDC ok, mas a identidade não está autorizada a
onboardar), o front SHALL entrar num estado dedicado e exibir uma tela **"acesso por
convite"** — distinta da tela de login e do conteúdo protegido. A tela SHALL oferecer sair
(logout) e NÃO SHALL expor conteúdo protegido.

#### Scenario: 403 signup_denied exibe a tela de convite

- **WHEN** uma chamada protegida retorna `403` com `error.code = "signup_denied"`
- **THEN** o app marca o estado "acesso por convite" e exibe a tela explicando que o acesso é
  por convite, sem renderizar conteúdo protegido

#### Scenario: Sair da tela de convite

- **WHEN** o usuário, na tela de convite, aciona "sair"
- **THEN** o app faz logout (`POST /api/auth/logout`) e passa a exibir a tela de login

#### Scenario: 403 sem signup_denied não vira tela de convite

- **WHEN** uma chamada retorna `403` com outro `code` (não `signup_denied`)
- **THEN** o app trata como erro comum (mensagem `error.message`), sem entrar no estado de
  convite

### Requirement: Aviso de uso pessoal na tela de login

A tela de login SHALL exibir um aviso curto e informativo de que o projeto é, no momento, de
**uso pessoal** (acesso por convite). O aviso é apenas informativo: NÃO SHALL alterar o fluxo
de autenticação nem substituir o botão "Entrar com Google".

#### Scenario: Aviso visível na tela de login

- **WHEN** a tela de login é exibida
- **THEN** ela mostra um aviso de que o projeto é atualmente de uso pessoal/por convite, além
  do botão "Entrar com Google"

#### Scenario: Aviso não bloqueia o login

- **WHEN** o usuário lê o aviso e aciona "Entrar com Google"
- **THEN** o fluxo de login segue normalmente (navegação top-level para `/api/auth/login`),
  sem que o aviso interfira
