## Why

A navegação atual é uma barra superior com 8 seções amontoadas em abas que rolam
horizontalmente — fica apertada, "bugada" no mobile e pouco profissional. Com o número de
áreas que o app já tem (Visão geral, Transações, Categorias, Recorrentes, Previstos,
Investimentos, Cartões, Conta), o padrão adequado é uma **sidebar** de navegação: cada
seção com **ícone + rótulo**, sempre visível no desktop e em drawer no mobile.

## What Changes

- **Substituir a app bar superior por uma navegação lateral (sidebar)**:
  - **Desktop (≥ 900px)**: sidebar fixa à esquerda com a marca no topo, a lista de seções
    (ícone + rótulo, item ativo destacado) e, no rodapé, o controle de tema + "Sair". O
    conteúdo principal ocupa a área à direita.
  - **Mobile (< 900px)**: uma barra fina no topo com a marca e um botão **hambúrguer**; a
    sidebar vira um **drawer** que desliza por cima com um backdrop. Escolher uma seção (ou
    clicar no backdrop / pressionar `Esc`) fecha o drawer.
- **Ícones por seção** — um conjunto de **SVG inline** (sem fonte/ícone de CDN, mantendo a
  CSP restritiva e zero recurso externo).
- **Acessibilidade**: `nav` rotulada, item ativo com `aria-current="page"`, drawer com
  `aria-label`, fechar por `Esc`/backdrop, foco visível, alvos de toque ≥ 44px.
- Mantém o controle de tema (claro/sistema/escuro) e o logout — apenas reposicionados para
  a sidebar/rodapé.

## Capabilities

### New Capabilities
<!-- Nenhuma capability nova: é evolução da camada de apresentação (navegação/layout). -->

### Modified Capabilities
- `web-design-system`: a navegação deixa de ser "barra superior responsiva" e passa a ser
  uma **sidebar responsiva** (fixa no desktop, drawer no mobile) com ícones por seção e o
  controle de tema no rodapé.

## Impact

- **Código**: nova `src/features/shell/` ganha `Sidebar.tsx` (lista de seções + ícones +
  tema/logout), `NavIcons.tsx` (SVGs inline por seção) e um shell de layout; `App.tsx`
  passa a renderizar `sidebar + main` (e controla o estado do drawer no mobile). Estilos de
  layout/sidebar/drawer em `src/index.css` (remove os estilos da app bar superior).
  `ThemeToggle` é reaproveitado.
- **API**: nenhuma. Sem endpoints, sem rede.
- **Sem novas dependências, sem recurso externo** (ícones SVG inline), CSP e higiene de XSS
  preservadas. Mudança puramente visual/navegacional.
