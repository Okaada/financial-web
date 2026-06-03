## Why

A UI está limpa e funcional, mas "chapada" — sem profundidade nem micro-interações que dão
sensação de produto polido. Dá para elevar isso com **efeitos CSS sutis** (fundo ambiente,
micro-interações em hover/foco, transições de entrada) sem mudar comportamento, sem recurso
externo e sem comprometer acessibilidade/performance.

## What Changes

- **Fundo ambiente sutil**: gradientes radiais suaves (1–2 "blobs") fixos atrás do conteúdo,
  com cores derivadas dos tokens e baixíssima opacidade — diferente no claro e no escuro,
  legível em ambos. Puro CSS (sem `<img>`, sem canvas, sem lib).
- **Micro-interações**:
  - Cards/itens de lista com leve **elevação no hover** (transform + sombra) e transição
    suave.
  - Botões com um leve "press" (scale no `:active`) e hover já existente refinado.
  - Itens da sidebar e foco com transição mais fluida.
- **Transições de entrada sutis**: telas/cards entram com um fade/slide curtíssimo ao montar.
- **Refinos de profundidade**: sombras e bordas mais coerentes (usando os tokens de
  elevação), realce no item ativo da sidebar.
- **Respeito a `prefers-reduced-motion`**: todas as animações/transições não-essenciais são
  reduzidas/desativadas (já há a regra global; os efeitos novos a respeitam).
- **Sem regressão**: contraste mantém WCAG AA; efeitos usam propriedades GPU-friendly
  (`transform`/`opacity`), sem layout thrash; CSP permanece restritiva (nada externo).

## Capabilities

### New Capabilities
<!-- Nenhuma capability nova: é evolução da camada de apresentação. -->

### Modified Capabilities
- `web-design-system`: adiciona um requisito de **efeitos visuais sutis e ambientais**
  (fundo ambiente, micro-interações, transições de entrada) com as salvaguardas de
  `prefers-reduced-motion`, contraste AA, performance e zero recurso externo.

## Impact

- **Código**: apenas `src/index.css` (novos efeitos/utilitários e um elemento de fundo via
  pseudo-elemento em `body`/`.app-shell` — sem markup novo, ou no máximo um `<div
  className="bg-ambient" aria-hidden>` decorativo). Sem mudança de lógica/JS.
- **API**: nenhuma. Sem rede, sem endpoints.
- **Sem novas dependências, sem recurso externo.** Mudança puramente estética.
