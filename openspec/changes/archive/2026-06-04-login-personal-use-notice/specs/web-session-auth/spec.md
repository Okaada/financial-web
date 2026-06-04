## ADDED Requirements

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
