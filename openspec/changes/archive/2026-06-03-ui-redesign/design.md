## Context

O front (SPA Vite/React) tem 4 telas (Transações, Categorias, Recorrentes, Previstos) +
nav + logout, estilizadas por um único `src/index.css` cru: cores duras, sem tokens, layout
de coluna única. A CSP do `index.html` é restritiva (`style-src 'self' 'unsafe-inline'`,
`default-src 'self'`) — **sem recurso externo** (nem fontes). Esta change é puramente
visual: reescreve o CSS sobre tokens e ajusta markup/classe, sem tocar em lógica, props de
dados, endpoints ou na CSP.

## Goals / Non-Goals

**Goals:**

- Tema claro e suave por tokens CSS; modo escuro suave opcional via `prefers-color-scheme`.
- Layout responsivo mobile-first com largura máxima legível e formulários multi-coluna em
  telas largas.
- Componentes consistentes (botões, campos, cards, abas, badges, banners) e estados
  visuais claros (loading/empty/error).
- Acessibilidade: foco visível, alvos ≥ 44px, contraste AA, `prefers-reduced-motion`.
- Zero dependências novas; CSP inalterada; fontes do sistema.

**Non-Goals:**

- Mudar comportamento, fluxo, endpoints ou regras das capacidades de dados.
- Biblioteca de UI/CSS (Tailwind, MUI, etc.) ou fontes externas.
- Reescrever a arquitetura de componentes (continua a mesma estrutura de telas/forms).
- Theming configurável pelo usuário (toggle manual de tema) — fica para depois.

## Decisions

### D1 — Design tokens em CSS custom properties (sem framework)

Um bloco `:root` define a paleta e as escalas: `--bg`, `--surface`, `--surface-2`,
`--border`, `--text`, `--text-muted`, `--primary`, `--primary-contrast`, `--success`,
`--danger`, escalas de espaçamento (`--space-1..6`), raio (`--radius`, `--radius-lg`),
sombra (`--shadow-sm/md`) e tipografia (`--font`, tamanhos). Todo o resto referencia tokens.

- **Por que:** consistência e ajuste num só lugar, sem peso de framework. Combina com a CSP
  (`unsafe-inline` cobre as variáveis) e com o objetivo de zero-deps.
- **Alternativa rejeitada:** Tailwind/lib de componentes — adiciona build/deps e contraria o
  ethos enxuto do projeto.

### D2 — Paleta clara e suave (e dark suave opcional)

Claro: fundo off-white (ex.: `#f6f7f9`), superfícies brancas, bordas suaves, texto
grafite (`#1f2430`), primário calmo (índigo/teal dessaturado), `success`/`danger` suaves
para receita/despesa. Dark (via `@media (prefers-color-scheme: dark)`) redefine os MESMOS
tokens para tons escuros suaves (fundo ~`#15171c`, superfícies ~`#1d2026`), preservando
contraste.

- **Por que:** atende o pedido ("light-soft"), e o dark sai quase de graça porque só os
  tokens mudam. Mantém `color-scheme` coerente.
- **Trade-off:** validar contraste AA nas duas variantes (cor de despesa/receita e muted são
  os pontos de atenção).

### D3 — Layout: container central + nav fixa + grid de formulário

`.app` centraliza com `max-width` (~720–820px) e padding responsivo. A `.nav` vira sticky no
topo, com as abas em `overflow-x:auto` no mobile. Formulários usam `display:grid` com
`grid-template-columns` que vira 2 colunas via `@media (min-width: 720px)` (campos
auto-encaixam; o erro/ações ocupam a linha toda).

- **Por que:** legibilidade em telas largas sem esticar campos; mobile continua coluna única.
- **Alternativa considerada:** container fluido sem max-width — rejeitado (linhas longas
  demais em desktop prejudicam leitura).

### D4 — Restilizar classes existentes + adicionar utilitárias mínimas

A maior parte é reaproveitar as classes que já existem (`.screen`, `.transaction-form`,
`.filters`, `.transaction-list`, `.category-list`, `.state`, `.badge`, `.nav`, etc.) e
adicionar poucas novas (`.app`, `.card`, variantes `.btn`/`.btn-primary`/`.btn-danger`,
`.banner`, `.spinner`). O markup muda o mínimo: envolver telas num container, aplicar
`.card`/variantes de botão e classes de estado.

- **Por que:** menor risco de regressão de comportamento; o diff fica concentrado no CSS.
- **Trade-off:** alguns componentes recebem 1–2 classes novas; nenhuma mudança de lógica.

### D5 — Botões: variantes por classe, não por elemento

Introduz `.btn` base + `.btn-primary` (ações de salvar/adicionar/confirmar), `.btn-ghost`
(secundárias/cancelar/limpar) e `.btn-danger` (excluir). Os atuais `.link` (texto) viram
`.btn-ghost`/`.btn-link` conforme o caso, mantendo `type="button"`.

- **Por que:** hierarquia visual clara das ações; consistência entre telas.

### D6 — Acessibilidade como parte do CSS base

`:focus-visible` com anel consistente; `min-height`/`min-width` 44px em controles
interativos no mobile; `@media (prefers-reduced-motion: reduce)` zera transições; cores de
texto validadas para AA. Sem remover outline sem substituto.

- **Por que:** usabilidade real (o pedido inclui "be usable"), barato de fazer no CSS base.

## Risks / Trade-offs

- **Regressão visual de estados** (loading/empty/error podem ficar inconsistentes) →
  mitigação: padronizar `.state`/`.banner`/`.spinner` e revisar as 4 telas.
- **Contraste AA no dark e nas cores de valor** → mitigação: escolher tons testados;
  despesa/receita com matiz, não só cor saturada; revisar muted.
- **Mudança de markup introduzir bug de comportamento** → mitigação: só adicionar
  classes/containers e trocar `className`; não mexer em handlers, props ou estados; rodar
  typecheck/lint/build e revisar diffs.
- **CSP/fontes** → manter fontes do sistema; nenhum `@import`/URL externa no CSS.

## Open Questions

- Modo escuro: entregar já o dark via `prefers-color-scheme` (sugerido) ou só o tema claro
  nesta change? Assumido: incluir o dark suave, pois sai de graça com os tokens — se o
  usuário preferir claro-apenas, é só não definir o bloco `@media dark`.
