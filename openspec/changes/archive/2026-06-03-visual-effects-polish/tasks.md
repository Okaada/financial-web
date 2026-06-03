## 1. Fundo ambiente

- [x] 1.1 Em `src/index.css`, adicionar um fundo ambiente via pseudo-elemento fixo
  (`body::before` ou `.app-shell::before`): `position: fixed; inset: 0; z-index: -1;
  pointer-events: none;` com 1–2 `radial-gradient` suaves derivados dos tokens
  (`color-mix` de `--primary`/`--success`) em baixíssima opacidade; legível no claro e no
  escuro. Sem markup novo, sem recurso externo.

## 2. Micro-interações

- [x] 2.1 Hover de elevação em cards/itens de lista (`.transaction`, `.category`,
  `.dash-block`, `.dash-row`, `.invest-detail`/cards, `.card-detail`, `.audit-event`):
  `transition` de `transform`/`box-shadow` + `:hover` com `translateY(-1px)` e
  `--shadow-md`. Usar só `transform`/`box-shadow` (sem reflow).
- [x] 2.2 Botões: refinar hover e adicionar leve `:active` (`translateY(1px)`/`scale`),
  mantendo foco visível.

## 3. Transições de entrada

- [x] 3.1 `@keyframes fade-rise` (opacity + `translateY` curto) aplicada a `.screen` e aos
  cards/blocos (ex.: `.dash-block`), duração curta; stagger leve opcional por `nth-child`.

## 4. Acessibilidade e qualidade

- [x] 4.1 Garantir que `prefers-reduced-motion: reduce` desativa/reduz entrada e qualquer
  movimento do fundo (a regra global cobre transição/animação; adicionar guard explícito se
  necessário). Manter contraste WCAG AA.
- [x] 4.2 `npm run typecheck`, `npm run lint`, `npm run build` verdes; confirmar nenhum
  recurso externo novo (sem `<img>`/CDN/`@import`), CSP intacta.
- [ ] 4.3 Verificação manual: efeitos sutis e fluidos no claro e escuro; sem layout
  "pulando"; com reduced-motion ligado, entrada/movimento desativados; texto legível.
