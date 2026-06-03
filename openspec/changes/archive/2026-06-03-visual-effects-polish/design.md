## Context

A camada de apresentação (`web-design-system`) já tem tokens, sidebar, escala tipográfica e
uma regra global de `prefers-reduced-motion`. Falta profundidade/micro-interação. A CSP é
restritiva (sem recurso externo) e o app é mobile-first com tema claro/escuro selecionável.

## Goals / Non-Goals

**Goals:**
- Efeitos sutis (fundo ambiente, hover/foco/press, entrada) que dão polish sem distrair.
- Zero recurso externo; performance e acessibilidade preservadas.

**Non-Goals:**
- NÃO animações chamativas/longas, parallax pesado, canvas/JS de animação, ou libs.
- NÃO mudar comportamento, layout estrutural, endpoints ou a CSP.
- NÃO regressão de contraste nem de `prefers-reduced-motion`.

## Decisions

### 1. Fundo ambiente via pseudo-elemento fixo (sem markup)

Um `body::before` (ou `.app-shell::before`) `position: fixed; inset: 0; z-index: -1;
pointer-events: none;` com 1–2 `radial-gradient` suaves usando `color-mix` dos tokens
(`--primary`, `--success`) em opacidade muito baixa. Cores/intensidade ajustam no escuro via
os mesmos tokens (que já mudam por tema). Sem `<img>`, sem canvas. `pointer-events: none`
garante que não interfere em cliques.

Alternativa: um `<div className="bg-ambient" aria-hidden>`. Rejeitada — o pseudo-elemento
evita markup novo e é puramente estilo.

### 2. Micro-interações com transform/opacity

- Cards/itens (`.transaction`, `.category`, `.dash-block`, `.dash-row`, `.invest-*`,
  `.card-detail`, etc.): `transition: transform/box-shadow`; no `:hover` um
  `translateY(-1px)` + sombra um degrau acima (`--shadow-md`). Sem mudar tamanho que cause
  reflow nos vizinhos (transform não reflui).
- Botões: refino do hover existente + leve `:active { transform: translateY(1px) scale(.99) }`.
- Itens de sidebar/links: transição de cor/fundo já existe; manter fluida.

Tudo via `transform`/`opacity`/`box-shadow` (GPU-friendly), durações curtas (~150–220ms).

### 3. Transição de entrada sutil

Uma `@keyframes fade-rise` (opacity 0→1 + `translateY(6px)→0`) aplicada a `.screen` e/ou
`.dash-block`/cards, duração curta. Aplicada no mount (CSS, sem JS). Stagger leve opcional
via `animation-delay` por nth-child nos blocos do dashboard (sutil, poucos itens).

### 4. Respeito total a reduced-motion

A regra global já zera `transition/animation-duration` sob `prefers-reduced-motion`. Para o
fundo, garantir que ele é estático (sem animação de movimento) por padrão; se houver
qualquer drift animado, desativá-lo explicitamente nessa media query. Entrada vira no-op
(opacidade final imediata).

## Risks / Trade-offs

- **Hover lift em telas touch** → `:hover` em touch é efêmero; sem prejuízo. O efeito é
  decorativo.
- **Fundo ambiente reduzindo contraste** → Mitigação: opacidade muito baixa e atrás do
  conteúdo; superfícies de card são opacas (`--surface`), então o texto mantém contraste AA.
- **Animação de entrada irritar em navegação rápida** → Mitigação: duração curta e
  desativada sob reduced-motion.

## Migration Plan

Mudança só de `index.css` (pseudo-elemento de fundo + utilitários/efeitos). Sem migração,
sem API/deploy. Rollback = remover os blocos de efeito do CSS.

## Open Questions

- Stagger de entrada nos blocos do dashboard: incluir leve `animation-delay` ou manter
  uniforme? Decisão de implementação; manter sutil de qualquer forma.
