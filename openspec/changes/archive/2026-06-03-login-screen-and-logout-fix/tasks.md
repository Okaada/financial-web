## 1. Store de estado de autenticação

- [x] 1.1 Criar `src/api/authState.ts`: tipo `AuthStatus = 'unknown'|'authenticated'|
  'unauthenticated'`, estado em módulo, `subscribeAuth(cb)`, `getAuthStatus()`, e
  `markAuthenticated()` / `markUnauthenticated()` (notificam só em mudança).

## 2. Cliente e sessão marcam estado (sem auto-navegar)

- [x] 2.1 `src/api/client.ts`: no `401`, chamar `markUnauthenticated()` (em vez de
  `redirectToLogin()`) e lançar `UnauthenticatedError`; numa resposta protegida ok, chamar
  `markAuthenticated()`. Manter `client.ts` como único arquivo com `fetch(`.
- [x] 2.2 `src/api/session.ts`: `logout()` faz `POST /api/auth/logout` e, no `finally`,
  `markUnauthenticated()` (nunca navegar para `/api/auth/login`). Adicionar
  `probeSession()` que faz um `GET` protegido leve (ex.: `GET /api/categories`) via o
  cliente (que seta o estado).
- [x] 2.3 `src/api/auth.ts`: remover `redirectToLogin()`; manter `login()` (navegação
  top-level para `GET /api/auth/login`).
- [x] 2.4 `src/features/account/AccountScreen.tsx`: após o `204` do `DELETE /account`, usar
  `markUnauthenticated()` em vez de `redirectToLogin()`.

## 3. Tela de login e splash

- [x] 3.1 Criar `src/features/auth/LoginScreen.tsx`: card centralizado com marca, subtítulo
  e botão "Entrar com Google" (logo **G** multicolor em SVG inline), `onClick` → `login()`.
  Único meio de autenticação.
- [x] 3.2 `src/App.tsx`: consumir `authState` via `useSyncExternalStore`; no mount, se
  `unknown`, chamar `probeSession()`; renderizar **splash** (`unknown`), **LoginScreen**
  (`unauthenticated`) ou o **shell** (`authenticated`).
- [x] 3.3 Estilos em `index.css`: `.login*` (card centralizado responsivo, botão Google) e
  `.splash` (centralizado, marca + carregando), usando os tokens de tema.

## 4. Qualidade

- [x] 4.1 `npm run typecheck`, `npm run lint`, `npm run build` verdes; confirmar zero
  `fetch(` fora de `client.ts`, zero `dangerouslySetInnerHTML`, nenhum recurso externo novo
  (logo Google SVG inline), e que o JS não toca `fa_session`. Confirmar que nada mais chama
  `redirectToLogin`.
- [ ] 4.2 Verificação manual contra o backend real: sem sessão → splash → tela de login;
  "Entrar com Google" → OIDC → volta autenticado; **logout → cai na tela de login e NÃO
  re-loga sozinho**; expiração de sessão durante uso → tela de login.
