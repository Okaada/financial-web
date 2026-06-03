## REMOVED Requirements

### Requirement: Barra superior responsiva com controle de tema

**Reason**: A navegação por barra superior não escala com o número de seções do app (8+),
ficando apertada e com abas rolando horizontalmente no mobile. É substituída por uma
navegação lateral (sidebar).
**Migration**: Ver a nova requirement "Navegação lateral (sidebar) responsiva com controle
de tema" — a marca, a lista de seções, o controle de tema e o logout passam para a sidebar
(fixa no desktop, drawer no mobile).

## ADDED Requirements

### Requirement: Navegação lateral (sidebar) responsiva com controle de tema

O app SHALL apresentar a navegação principal como uma **sidebar** contendo a marca, a lista
de seções (cada uma com ícone + rótulo) e, no rodapé, o controle de tema (claro/sistema/
escuro) e o logout. A sidebar SHALL ser **fixa** no desktop e um **drawer** sobreposto no
mobile, acionado por um botão na barra superior fina. Os alvos de toque SHALL permanecer
acessíveis (≥ 44px) e o item ativo SHALL ser indicado com `aria-current="page"`.

#### Scenario: Sidebar fixa no desktop

- **WHEN** a viewport é larga (ex.: ≥ 900px)
- **THEN** a sidebar fica fixa à esquerda (marca no topo, seções no meio, tema + logout no
  rodapé) e o conteúdo principal ocupa a área à direita, sem rolagem horizontal

#### Scenario: Drawer no mobile

- **WHEN** a viewport é estreita (ex.: 360px) e o usuário toca no botão de menu (hambúrguer)
- **THEN** a sidebar desliza como um drawer sobre um backdrop; escolher uma seção, clicar no
  backdrop ou pressionar `Esc` fecha o drawer

#### Scenario: Seção ativa destacada

- **WHEN** o usuário está em uma seção
- **THEN** o item correspondente na sidebar é destacado visualmente e marcado com
  `aria-current="page"`

#### Scenario: Controle de tema e logout na sidebar

- **WHEN** a sidebar é exibida
- **THEN** o controle de tema (claro/sistema/escuro) e a ação de "Sair" ficam acessíveis no
  rodapé da sidebar, com foco visível por teclado

### Requirement: Ícones de navegação sem recurso externo

Cada item de navegação SHALL ter um ícone, fornecido como **SVG inline** no bundle — SEM
fonte de ícones, CDN ou qualquer recurso externo — preservando a CSP restritiva.

#### Scenario: Ícone por seção

- **WHEN** a sidebar lista as seções
- **THEN** cada seção exibe um ícone consistente ao lado do rótulo

#### Scenario: Sem recurso externo

- **WHEN** os ícones são renderizados
- **THEN** são SVG inline (sem `@font-face` externo, sem CDN), e a CSP/headers do app
  permanecem restritivos (sem origem externa)
