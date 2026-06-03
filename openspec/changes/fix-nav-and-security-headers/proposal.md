## Why

Dois problemas em produção: (1) sair da tela inicial (Visão geral) travava o app com tela
em branco — um crash de hooks do React (`#310`); (2) a CSP era entregue só via `<meta>`,
onde `frame-ancestors` é **ignorado**, e os headers de segurança dependiam de `public/
_headers` (mecanismo de Cloudflare **Pages**) que NÃO é garantido sob Workers + Static
Assets. Resultado: proteção de clickjacking podia não estar ativa e o console acusava
diretivas ignoradas.

## What Changes

- **Correção do crash de navegação (regressão)**: em `App.tsx`, a tela ativa era renderizada
  **chamando** `SCREENS[view]()` (função), o que fazia os hooks da tela rodarem dentro do
  render do `App`. Ao trocar de `view`, a sequência de hooks do `App` mudava → React
  `#310`. Agora a tela é renderizada como **componente** (`<CurrentScreen … />` →
  `<Screen />`), com hooks isolados no próprio componente.
- **CSP e headers de segurança via header HTTP no Worker**: `worker/index.ts` passa a
  anexar, **apenas nas respostas de asset** (nunca nas de `/api/*`), a CSP completa
  (incluindo `frame-ancestors 'none'`, que `<meta>` não cobre) mais
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  no-referrer` e `X-Frame-Options: DENY`. O Worker vira a **fonte autoritativa** dos
  headers (o `_headers` de Pages não é garantido aqui).
- **`index.html`**: remove `frame-ancestors` do `<meta>` (era ignorado e gerava warning) e
  explicita `script-src 'self'`. O `<meta>` continua como fallback para servir estático sem
  o Worker.

> Observação (não é mudança de código): a mensagem de "inline script blocked" vista em
> produção vem de uma **otimização de zona da Cloudflare** (ex.: Rocket Loader / Browser
> Insights) injetando um `<script>` inline, **corretamente bloqueado** pela CSP. Resolve-se
> desativando essas otimizações para o host no painel da Cloudflare — não há nada a mudar no
> app.

## Capabilities

### New Capabilities
<!-- Nenhuma. -->

### Modified Capabilities
- `web-deploy`: o requisito "Headers de segurança nos assets" passa a ser cumprido pelo
  **Worker** (`worker/index.ts`) entregando os headers (incl. a CSP completa com
  `frame-ancestors`) como header HTTP, em vez de depender de `public/_headers` (mecanismo de
  Pages, não garantido sob Workers + Static Assets).

## Impact

- **Código**: `src/App.tsx` (render da tela como componente), `worker/index.ts` (headers de
  segurança nas respostas de asset), `index.html` (CSP `<meta>` ajustada).
- **API**: nenhuma. As respostas de `/api/*` continuam intocadas (Set-Cookie, Location e
  headers do backend passam direto).
- **Sem novas dependências.** Build/typecheck/lint verdes; CSP permanece restritiva e mais
  correta (agora aplicada como header).
