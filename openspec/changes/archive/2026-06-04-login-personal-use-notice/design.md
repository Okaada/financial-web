## Context

A `LoginScreen` (web-session-auth) é um card centralizado com marca, subtítulo e o botão
"Entrar com Google". O cadastro é gated por convite (`signup_denied` já tem a `InviteOnlyScreen`).
Falta comunicar o "uso pessoal" antes da tentativa de login.

## Goals / Non-Goals

**Goals:**
- Um aviso curto e claro de uso pessoal na tela de login.

**Non-Goals:**
- NÃO mudar o fluxo de auth, o botão, ou a `InviteOnlyScreen`.
- NÃO adicionar dependência/recurso externo.

## Decisions

### Aviso como elemento informativo no card de login

Adiciona-se um parágrafo curto (ex.: "Projeto de uso pessoal — acesso por convite.") dentro do
`.login-card`, abaixo do subtítulo ou do botão. Estilo discreto (texto secundário), reusando
tokens. Renderizado como texto via React (sem HTML injetado). Opcionalmente um estilo
`.login-note` se o `.login-sub` não couber.

Alternativa: um banner global. Rejeitada — o pedido é específico da tela de login; manter
local e simples.

## Risks / Trade-offs

- Nenhum relevante (mudança de copy). Mantém contraste/AA e CSP intacta.

## Migration Plan

Mudança só de UI em `LoginScreen.tsx` (+ estilo opcional). Rollback = remover o parágrafo.

## Open Questions

- Texto exato do aviso: decidido na implementação, curto e neutro.
