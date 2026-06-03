# web-design-system

## Purpose

Definir a camada de apresentação do front: tokens de tema (claro e suave por padrão, com
tema escuro **selecionável pelo usuário** — claro/sistema/escuro), navegação lateral
(sidebar) responsiva com controle de tema, escala visual madura (tipografia + elevação),
layout responsivo
mobile-first, componentes visuais consistentes e requisitos de usabilidade/acessibilidade
que todas as telas seguem. É puramente visual — não altera comportamento, fluxo, endpoints
nem a CSP.

## Requirements

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

### Requirement: Layout responsivo

O layout SHALL ser responsivo e mobile-first: utilizável de telas estreitas (≈320px) a
largas, sem rolagem horizontal e sem sobreposição de conteúdo.

#### Scenario: Mobile (coluna única)

- **WHEN** a viewport é estreita (ex.: 360px)
- **THEN** o conteúdo se organiza em uma coluna confortável, sem rolagem horizontal, com
  alvos de toque ≥ 44px

#### Scenario: Telas largas (multi-coluna)

- **WHEN** a viewport é larga (ex.: ≥ 720px)
- **THEN** o conteúdo respeita uma largura máxima legível e os formulários longos passam a
  usar mais de uma coluna, sem esticar campos por toda a largura

#### Scenario: Navegação acessível no topo

- **WHEN** o usuário alterna entre telas (Transações, Categorias, Recorrentes, Previstos)
- **THEN** a navegação fica fixa/visível no topo; no mobile as abas rolam horizontalmente em
  vez de quebrar o layout

### Requirement: Componentes visuais consistentes

Botões, campos (input/select), cards, linhas de lista, abas, badges e banners SHALL ter
estilo consistente em todas as telas.

#### Scenario: Botões com variantes

- **WHEN** uma ação primária, secundária ou destrutiva é apresentada
- **THEN** ela usa a variante de botão correspondente (primário / fantasma / perigo) com
  estilo consistente, estados de hover/disabled e foco visível

#### Scenario: Listas como cards legíveis

- **WHEN** transações, categorias, recorrentes ou previstos são listados
- **THEN** cada item é um card/linha com hierarquia clara (valor em destaque, metadados
  secundários) e ações alinhadas de forma previsível

#### Scenario: Formulários ritmados

- **WHEN** um formulário é exibido
- **THEN** rótulos, campos e mensagens de erro seguem espaçamento e alinhamento consistentes,
  com o erro associado ao campo correspondente

### Requirement: Estados de UI com apresentação clara

Os estados explícitos já existentes (carregando, vazio, erro, sem-sessão) SHALL ter
apresentação visual clara e consistente, sem telas ambíguas ou em branco.

#### Scenario: Carregando

- **WHEN** uma tela está buscando dados
- **THEN** mostra um indicador de carregamento perceptível (spinner/skeleton), não apenas
  texto solto sem estilo

#### Scenario: Vazio

- **WHEN** uma lista não tem itens
- **THEN** mostra um estado vazio explícito (mensagem amigável), visualmente distinto de um
  erro

#### Scenario: Erro

- **WHEN** ocorre um erro não-`401`
- **THEN** mostra um banner de erro claro com ação de "tentar novamente", sem travar o app

### Requirement: Usabilidade e acessibilidade

O front SHALL respeitar requisitos básicos de usabilidade e acessibilidade.

#### Scenario: Foco visível por teclado

- **WHEN** o usuário navega por teclado
- **THEN** o elemento focado tem um anel de foco visível (não removido sem substituto)

#### Scenario: Movimento reduzido

- **WHEN** o sistema indica `prefers-reduced-motion: reduce`
- **THEN** transições/animações não essenciais são reduzidas ou desativadas

#### Scenario: Sem regressão de segurança

- **WHEN** dados livres do usuário (ex.: `description`, `name`) são exibidos
- **THEN** continuam renderizados como texto via React (sem `dangerouslySetInnerHTML`) e a
  CSP do `index.html` permanece restritiva (sem recurso externo)

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

### Requirement: Efeitos visuais sutis e ambientais

O front SHALL aplicar efeitos visuais **sutis** — fundo ambiente, micro-interações
(hover/foco/press) e transições de entrada curtas — derivados dos tokens de tema e feitos
**apenas com CSS** (sem recurso externo, sem `<img>`/CDN, sem biblioteca). Os efeitos SHALL
preservar o contraste WCAG AA, SHALL usar propriedades performáticas (`transform`/`opacity`,
sem causar reflow contínuo) e SHALL respeitar `prefers-reduced-motion`.

#### Scenario: Fundo ambiente

- **WHEN** qualquer tela é renderizada
- **THEN** há um fundo ambiente sutil (ex.: gradientes radiais suaves) atrás do conteúdo,
  derivado dos tokens, legível tanto no tema claro quanto no escuro, sem prejudicar o
  contraste do texto

#### Scenario: Micro-interações em hover e foco

- **WHEN** o usuário passa o mouse/foca em um card, item de lista ou botão
- **THEN** o elemento responde com um efeito sutil (ex.: leve elevação/realce) via transição
  suave, sem deslocar o layout ao redor

#### Scenario: Transição de entrada sutil

- **WHEN** uma tela ou card é montado
- **THEN** ele aparece com uma transição curta (ex.: fade/slide leve), sem atrasar
  perceptivelmente o uso

#### Scenario: Movimento reduzido desativa os efeitos animados

- **WHEN** o sistema indica `prefers-reduced-motion: reduce`
- **THEN** as animações/transições não-essenciais (incl. entrada e quaisquer efeitos de
  movimento do fundo) são reduzidas ou desativadas

#### Scenario: Sem recurso externo nem regressão de contraste

- **WHEN** os efeitos são renderizados
- **THEN** são puramente CSS (sem origem externa), a CSP permanece restritiva, e o contraste
  de texto continua atendendo WCAG AA
