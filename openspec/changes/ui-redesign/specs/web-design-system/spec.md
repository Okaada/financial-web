## ADDED Requirements

### Requirement: Tokens de tema claro e suave

O front SHALL definir um conjunto de tokens de design em `:root` (cores, espaçamento, raio,
sombras, tipografia) e estilizar todas as telas a partir deles, com um tema **claro e
suave** por padrão. As cores SHALL ter contraste de texto adequado (WCAG AA, ≥ 4.5:1 para
texto normal).

#### Scenario: Tema aplicado via tokens

- **WHEN** qualquer tela é renderizada
- **THEN** suas cores, espaçamentos e raios vêm das variáveis CSS de `:root` (não de valores
  hard-coded espalhados), de modo que ajustar um token reflete em todo o app

#### Scenario: Paleta suave com contraste AA

- **WHEN** texto é exibido sobre fundos do tema (superfícies, cards, botões)
- **THEN** o contraste atende WCAG AA para texto normal

#### Scenario: Modo escuro suave opcional

- **WHEN** o sistema do usuário indica `prefers-color-scheme: dark`
- **THEN** o app aplica uma variante escura suave dos mesmos tokens, permanecendo legível
  (sem quebrar o contraste)

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
