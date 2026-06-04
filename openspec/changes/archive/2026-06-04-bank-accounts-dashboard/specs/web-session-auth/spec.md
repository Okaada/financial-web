## ADDED Requirements

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
