## ADDED Requirements

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
