## Why

Dois problemas de sessão: (1) o app não tem **tela de login** — ao não ter sessão, o
tratamento central de `401` navega o browser direto para `/api/auth/login`, então o usuário
nunca vê uma tela e cai imediatamente no Google; (2) o **logout não "funciona"**: após
`POST /api/auth/logout` (que limpa o cookie), o app chama `redirectToLogin()` → navega para
`/api/auth/login`, que **reinicia o OIDC**; como a sessão do Google ainda está ativa, o
backend re-autentica em silêncio (SSO) e devolve o usuário **logado** — como se o logout não
tivesse acontecido.

Os dois têm a mesma raiz: o app **auto-navega** para `/api/auth/login` em vez de mostrar uma
tela onde o usuário decide entrar.

## What Changes

- **Nova tela de login (somente Google)**: card centralizado com a marca e um botão
  **"Entrar com Google"** (logo SVG inline, sem recurso externo). Só esse botão dispara a
  navegação top-level para `GET /api/auth/login`. É a única forma de autenticar (OIDC
  conduzido inteiramente pelo backend; o front nunca vê token/segredo).
- **Estado de autenticação observável**: um pequeno store (`unknown | authenticated |
  unauthenticated`). O cliente HTTP passa a **marcar** o estado em vez de auto-navegar:
  - `401` em qualquer chamada → `markUnauthenticated()` (mostra a tela de login), **não**
    navega mais sozinho para o Google.
  - resposta protegida bem-sucedida → `markAuthenticated()`.
- **Correção do logout**: após o `204`, o app marca **não autenticado** e mostra a tela de
  login — não reinicia o OIDC. Logout passa a, de fato, deslogar (exige clique para entrar
  de novo).
- **Sondagem inicial + splash**: ao carregar, o app faz uma sondagem a um endpoint protegido
  (leve) e mostra um splash neutro até saber se está autenticado, evitando "piscar" a tela
  protegida para quem não tem sessão.
- **Exclusão de conta (§9)**: após o `204` do `DELETE /account`, passa a marcar não
  autenticado (tela de login) em vez de re-disparar o OIDC (que re-onboardaria uma conta
  nova). Ajuste de consistência com o novo modelo.

## Capabilities

### New Capabilities
<!-- Nenhuma capability nova: é evolução do estabelecimento/encerramento de sessão. -->

### Modified Capabilities
- `web-session-auth`: o login deixa de ser auto-navegação no `401` e passa a ser **iniciado
  pelo usuário** numa **tela de login (somente Google)**; o estado de autenticação é um
  store observável (sondagem inicial → splash); o **logout** passa a levar à tela de login
  (sem reiniciar o OIDC), corrigindo o re-login silencioso.

## Impact

- **Código**: novo `src/api/authState.ts` (store observável) e
  `src/features/auth/LoginScreen.tsx` (+ logo Google SVG inline). `client.ts` passa a chamar
  `markAuthenticated()`/`markUnauthenticated()` no lugar de `redirectToLogin()`; `session.ts`
  (`logout`) idem; `auth.ts` mantém `login()` (navegação top-level) e remove
  `redirectToLogin()`; `AccountScreen` usa `markUnauthenticated()` após excluir conta;
  `App.tsx` assina o store e renderiza splash/login/shell. Estilos da tela de login em
  `index.css`.
- **API**: nenhuma rota nova — só `GET /api/auth/login` e `POST /api/auth/logout` já
  existentes (CONTRACT §2/§11). O front continua sem ver token/segredo e sem ler/gravar
  `fa_session`.
- **Sem novas dependências, sem recurso externo** (logo Google SVG inline), CSP intacta.
