## Context

Dois defeitos surgiram em produção após a introdução da dashboard e do tema selecionável:
um crash de navegação e ruído/lacuna de CSP. O app usa navegação por estado local em
`App.tsx` (sem router) e é servido por um único Worker (Workers + Static Assets) que também
faz o proxy de `/api/*`.

## Goals / Non-Goals

**Goals:**
- Eliminar o crash ao trocar de tela (React `#310`).
- Entregar a CSP (com `frame-ancestors`) e os headers de segurança de forma que realmente
  funcionem, sem depender de mecanismo de Pages.

**Non-Goals:**
- NÃO adicionar router nem mudar a arquitetura de navegação.
- NÃO mexer nas respostas de `/api/*`.
- NÃO tentar "consertar" no app a injeção de script da Cloudflare (Rocket Loader/Insights) —
  isso é configuração de zona; a CSP corretamente a bloqueia.

## Decisions

### 1. Renderizar a tela ativa como componente, não como chamada

`App.tsx` renderizava `SCREENS[view]()` — uma **chamada de função**, que executa os hooks da
tela dentro do render do `App`. Como telas diferentes têm contagens/ordens de hooks
diferentes, trocar `view` alterava a sequência de hooks do `App` → React `#310`. A correção
extrai `CurrentScreen`, que retorna `<Screen />` (elemento), isolando os hooks de cada tela
no seu próprio componente. Trocar de tela passa a montar/desmontar componentes normalmente.

Alternativa: memoizar/forçar keys. Rejeitada — o problema não é reconciliação, é hooks
rodando no escopo errado; renderizar como componente é a forma idiomática e correta.

### 2. Headers de segurança no Worker (fonte autoritativa)

`frame-ancestors` é ignorado em `<meta>` (só vale como header). E `public/_headers` é um
mecanismo de Cloudflare **Pages**, não garantido sob **Workers + Static Assets**. Então o
Worker passa a setar, só nas respostas de asset, a CSP completa + HSTS + nosniff +
Referrer-Policy + X-Frame-Options. Faz isso clonando a resposta de `env.ASSETS` e aplicando
`Headers.set`, sem tocar nas respostas de `/api/*` (para não sobrepor Set-Cookie/Location do
backend). O `<meta>` CSP fica como fallback para servir estático sem o Worker.

Alternativa: manter só `_headers`. Rejeitada — não cobre `frame-ancestors` e pode nem ser
aplicado sob Workers Assets.

## Risks / Trade-offs

- **Headers duplicados se `_headers` também for honrado** → Sem impacto: valores idênticos;
  o `Headers.set` do Worker é autoritativo. O `_headers` permanece como defesa em
  profundidade.
- **Injeção de script da Cloudflare bloqueada pela CSP** → Esperado e desejado; some ao
  desativar Rocket Loader/Browser Insights para o host (config de zona, fora do código).

## Migration Plan

Mudança de código pura (front + worker), sem migração de dados. Deploy via `wrangler deploy`.
Rollback = reverter os três arquivos. Após o deploy, um hard-refresh/purge garante que o
`index.html` novo substitua qualquer HTML em cache.

## Open Questions

- Nenhuma. (A desativação das otimizações de zona da Cloudflare é ação operacional no painel,
  não de código.)
