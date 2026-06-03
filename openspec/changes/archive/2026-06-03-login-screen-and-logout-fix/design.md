## Context

Hoje o app não tem tela de login: o `401` central (`client.ts`) chama `redirectToLogin()`
(navegação top-level para `/api/auth/login`). O `logout()` faz o mesmo após o `204` — e aí
mora o bug: `/api/auth/login` reinicia o OIDC e o Google, com sessão ainda ativa, re-loga o
usuário em silêncio. Não há endpoint de identidade (`whoami`) no CONTRACT; o login é OIDC
conduzido 100% pelo backend; o JS nunca toca `fa_session`.

## Goals / Non-Goals

**Goals:**
- Uma tela de login explícita (só Google) como estado "sem sessão".
- Logout que de fato desloga (sem re-SSO automático).
- Estado de auth observável + sondagem inicial com splash.

**Non-Goals:**
- NÃO inventar endpoint (usa só `GET /api/auth/login` e `POST /api/auth/logout`).
- NÃO implementar revogação server-side do JWT (limitação conhecida do backend — o token
  vive até `exp`; fora do escopo do front).
- NÃO adicionar provedores além do Google, nem credencial local.

## Decisions

### 1. Store de auth observável (`src/api/authState.ts`)

Um módulo simples com `status: 'unknown' | 'authenticated' | 'unauthenticated'`,
`subscribeAuth(cb)`, `getAuthStatus()`, e setters `markAuthenticated()` /
`markUnauthenticated()` que notificam os listeners apenas em mudança. O `App` consome via
`useSyncExternalStore`. É um store mínimo (sem dependência) porque o `client.ts` (módulo
não-React) precisa empurrar mudanças para a UI.

### 2. O cliente HTTP marca estado em vez de navegar

`client.ts`: no `401`, chama `markUnauthenticated()` (em vez de `redirectToLogin()`) e lança
`UnauthenticatedError`; numa resposta protegida ok, chama `markAuthenticated()`. Assim o
único lugar que navega para `/api/auth/login` passa a ser o botão da tela de login. Isso
mantém o `client.ts` como o único arquivo com `fetch(`.

### 3. Logout e exclusão de conta levam à tela de login

`session.ts#logout`: `POST /api/auth/logout` e, no `finally`, `markUnauthenticated()` (nunca
`/api/auth/login`). `AccountScreen` (após `DELETE /account` `204`): `markUnauthenticated()`
em vez de `redirectToLogin()` — re-disparar o OIDC re-onboardaria uma conta nova (hard
delete), o que é errado. `redirectToLogin()` é removido de `auth.ts` (some o caminho de
auto-navegação); `login()` (navegação top-level) permanece, chamado só pela tela de login.

### 4. Sondagem inicial + splash

No mount, com `status === 'unknown'`, o `App` chama `probeSession()` (um `GET` a um endpoint
protegido leve via o cliente — ex.: `GET /api/categories`); o próprio cliente seta o estado
(sucesso → autenticado; `401` → sem sessão). Enquanto `unknown`, o `App` mostra um splash
neutro (marca + carregando), evitando piscar a tela protegida ou a de login. A escolha do
endpoint de sondagem é só "um protegido e leve"; categorias é uma lista pequena e estável.

Alternativa: sem sondagem, deixar a dashboard sondar. Rejeitada — pisca o esqueleto da
dashboard antes de cair na tela de login para quem está deslogado.

### 5. Tela de login (`src/features/auth/LoginScreen.tsx`)

Card centralizado: marca, subtítulo curto, e o botão "Entrar com Google" com o logo **G**
multicolor em **SVG inline** (sem `<img>`/CDN). `onClick` → `login()`. Responsiva, segue os
tokens de tema (claro/escuro). É o único meio de autenticação exibido.

## Risks / Trade-offs

- **Token JWT válido até `exp` após logout** → Limitação do backend (CONTRACT §2). Mitigação
  no front: o cookie é limpo pelo backend e o app vai para a tela de login; não reautentica
  sozinho. Resolver revogação server-side é gap de backend.
- **Re-SSO ao clicar "Entrar"** → Esperado: se a sessão do Google está ativa, entrar de novo
  é rápido — mas agora exige **ação do usuário**, que é o comportamento correto pós-logout.
- **Endpoint de sondagem acoplado a `/categories`** → Aceitável; é só um protegido leve.
  Trocar é trivial se necessário.

## Migration Plan

Mudança de comportamento de auth no front (sem migração de dados, sem mudança de API/deploy).
Remove o caminho de auto-navegação no `401`. Rollback = restaurar `redirectToLogin()` nos
três call sites e remover a tela/splash.

## Open Questions

- Mensagem específica de "você saiu" na tela de login? Por ora a tela é genérica; pode-se
  diferenciar logout vs. expiração depois (cosmético).
