## MODIFIED Requirements

### Requirement: Tokens de tema claro e suave

O front SHALL definir um conjunto de tokens de design em `:root` (cores, espaçamento, raio,
sombras, tipografia) e estilizar todas as telas a partir deles, com um tema **claro e
suave** por padrão. As cores SHALL ter contraste de texto adequado (WCAG AA, ≥ 4.5:1 para
texto normal). O tema SHALL ser **selecionável pelo usuário** entre **claro**, **escuro** e
**sistema** (que segue `prefers-color-scheme`), com a escolha **persistida** e aplicada via
um atributo `data-theme` no elemento raiz. A escolha NÃO SHALL usar o cookie de sessão (é
armazenada em `localStorage`); o JS continua sem ler/gravar `fa_session`.

#### Scenario: Tema aplicado via tokens

- **WHEN** qualquer tela é renderizada
- **THEN** suas cores, espaçamentos e raios vêm das variáveis CSS de `:root` (não de valores
  hard-coded espalhados), de modo que ajustar um token reflete em todo o app

#### Scenario: Paleta suave com contraste AA

- **WHEN** texto é exibido sobre fundos do tema (superfícies, cards, botões)
- **THEN** o contraste atende WCAG AA para texto normal, tanto no claro quanto no escuro

#### Scenario: Modo escuro suave

- **WHEN** o tema efetivo é escuro (porque o usuário escolheu "escuro", ou escolheu
  "sistema" e o SO indica `prefers-color-scheme: dark`)
- **THEN** o app aplica uma variante escura suave dos mesmos tokens, permanecendo legível
  (sem quebrar o contraste)

#### Scenario: Usuário escolhe o tema

- **WHEN** o usuário seleciona claro, escuro ou sistema no controle de tema
- **THEN** o app aplica imediatamente o tema escolhido (via `data-theme` na raiz) e persiste
  a escolha, de modo que ela é restaurada no próximo carregamento

#### Scenario: Sistema acompanha o SO

- **WHEN** a escolha persistida é "sistema" (ou não há escolha)
- **THEN** o tema efetivo segue `prefers-color-scheme` do SO em tempo real, sem precisar de
  recarregar

#### Scenario: Sem flash de tema no carregamento

- **WHEN** o app carrega com um tema forçado (claro/escuro) diferente do SO
- **THEN** o tema é aplicado no início do bundle (antes do render), sem introduzir script
  inline no HTML — preservando a CSP restritiva (`script-src 'self'`, sem `'unsafe-inline'`)

## ADDED Requirements

### Requirement: Barra superior responsiva com controle de tema

O app SHALL apresentar uma barra superior (app bar) fixa contendo uma identidade/título, a
navegação entre telas e um **controle de tema** (claro/sistema/escuro). A barra SHALL ser
responsiva: no mobile as abas rolam horizontalmente sem quebrar o layout e os alvos de toque
permanecem acessíveis (≥ 44px).

#### Scenario: App bar no desktop

- **WHEN** a viewport é larga
- **THEN** a barra mostra identidade/título, as abas de navegação e o controle de tema
  alinhados, fixos no topo

#### Scenario: App bar no mobile

- **WHEN** a viewport é estreita (ex.: 360px)
- **THEN** as abas rolam horizontalmente, o controle de tema continua acessível, e não há
  rolagem horizontal da página nem sobreposição

#### Scenario: Controle de tema acessível

- **WHEN** o usuário navega pelo controle de tema por teclado ou leitor de tela
- **THEN** cada opção tem rótulo acessível e estado selecionado perceptível (ex.:
  `aria-pressed`/`aria-label`), com foco visível

### Requirement: Escala visual madura (tipografia e elevação)

O front SHALL usar uma escala tipográfica e de elevação consistente, derivada de tokens, em
títulos, cards, listas e estados — em vez de tamanhos de fonte e sombras avulsos.

#### Scenario: Hierarquia tipográfica consistente

- **WHEN** títulos, subtítulos, corpo e metadados são exibidos
- **THEN** eles usam degraus de uma escala tipográfica definida por tokens, com hierarquia
  clara e ritmo vertical consistente entre as telas

#### Scenario: Elevação consistente

- **WHEN** cards e camadas sobrepostas (ex.: barra fixa, cards de lista) são exibidos
- **THEN** sua elevação (sombra/realce) vem de tokens consistentes, sem sombras avulsas
  espalhadas pelo CSS
