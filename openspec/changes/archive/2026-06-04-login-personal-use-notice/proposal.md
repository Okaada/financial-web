## Why

O cadastro é restrito por convite (allowlist), mas a tela de login não comunica isso a quem
chega. Um aviso curto de que o projeto é, no momento, de **uso pessoal** ajusta a expectativa
antes mesmo da pessoa tentar entrar e descobrir pelo `signup_denied`.

## What Changes

- Adicionar um **aviso na tela de login** informando que o projeto é atualmente de uso
  pessoal (acesso por convite). Texto curto, dentro do card de login, sem alterar o fluxo de
  autenticação nem o botão "Entrar com Google".

## Capabilities

### New Capabilities
<!-- Nenhuma. -->

### Modified Capabilities
- `web-session-auth`: a tela de login passa a exibir um aviso de uso pessoal (informativo).

## Impact

- **Código**: apenas `src/features/auth/LoginScreen.tsx` (um parágrafo/aviso) e, se preciso,
  um estilo em `src/index.css`. Sem mudança de lógica, API ou auth.
- **Sem novas dependências, sem recurso externo.** Mudança de copy/visual.
