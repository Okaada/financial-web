## Context

A Finance Web é um SPA (Vite/React) servido na Cloudflare, 100% atrás de auth. O cliente
HTTP do front (change `auth-transactions-skeleton`, design D1/D2) assume **mesmo-origin**:
chama caminhos relativos `/api/*`, conta com o browser anexando o cookie `fa_session` e não
trata CORS. Em dev isso é satisfeito pelo proxy do `vite.config.ts`, que faz `rewrite`
removendo `/api`. Em produção não há proxy — é preciso uma montagem real na Cloudflare que
entregue o mesmo contrato de origem.

Concretudes fornecidas:
- Hostname: `financial.gatolandios.com.br` (zone `gatolandios.com.br`).
- Worker da API já existente na conta: `finance-api`.
- Backend espera rotas sem prefixo `/api` (CONTRACT.md: `/auth/login`, `/transactions`, …).
- É um front simples, **sem segredos** no bundle. O repositório está conectado à Cloudflare
  (Workers → Builds), que roda `wrangler deploy`.

## Goals / Non-Goals

**Goals:**

- Servir o SPA em `financial.gatolandios.com.br`, publicado por `wrangler deploy`.
- Rotear `/<host>/api/*` para `finance-api` no mesmo origin, sem CORS, removendo `/api`.
- Preservar o cookie de sessão por todo o fluxo de login (start → callback → `302 /`).
- Fallback de SPA e headers de segurança.
- **Um único Worker, um `node_modules`, um deploy.**

**Non-Goals:**

- Mudar qualquer código do front (origem relativa `/api` já está pronta).
- Configurar o Worker `finance-api` (vive no repo do backend).
- Ambientes de preview/staging elaborados; foco em produção.
- Observabilidade/alertas do deploy.
- IaC (Terraform): para um front simples sem segredos, não compensa — ver D5.

## Decisions

### D1 — Um único Worker com Static Assets (não Pages, não Worker router separado)

O `worker/index.ts` serve o SPA via binding `ASSETS` e atende `/api/*` no mesmo Worker. O
Worker roda para requisições que não casam um asset estático; nele, `/api/*` é encaminhado à
Finance API e todo o resto cai em `env.ASSETS.fetch()` (que faz o fallback de SPA).

- **Por que:** é o modelo unificado atual da Cloudflare e casa com `wrangler deploy` (o que
  o repo conectado já roda). Fica tudo num projeto só — sem segundo Worker, sem `functions/`,
  sem `node_modules` extra, sem rota de precedência para gerenciar.
- **Histórico/alternativas rejeitadas:**
  - *Pages + Pages Function* (`functions/api/[[path]].ts`): funciona, mas o repo foi
    conectado via Workers Builds (roda `wrangler deploy`, não `wrangler pages deploy`),
    causando "missing entry-point". Trocado por Worker + Assets para casar com o deploy.
  - *Worker router standalone* sobrepondo o Pages: adiciona um projeto inteiro (npm,
    lockfile, wrangler, tsconfig) e um 2º deploy — custo sem ganho.

### D2 — Service binding (não fetch público) para a Finance API

O Worker encaminha via **service binding** (`env.FINANCE_API.fetch(...)`) para `finance-api`,
declarado no `wrangler.toml`, não via `fetch` a uma URL pública.

- **Por que:** chamada interna (Worker→Worker) sem sair para a internet — menor latência,
  sem expor a API num segundo hostname público, e o cookie/redirect fluem como se fosse o
  mesmo servidor. Mantém o backend sem necessidade de CORS.
- **Alternativa considerada:** `fetch('https://finance-api.<conta>.workers.dev/...')`.
  Rejeitada: hop público desnecessário e superfície extra.

### D3 — Remoção do prefixo `/api` no Worker (espelha o dev)

O Worker reescreve `pathname` removendo o prefixo `/api` antes de encaminhar, exatamente
como o `rewrite` do `vite.config.ts`. Assim o backend recebe `/auth/login`, etc.

```ts
const url = new URL(request.url)
if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
  url.pathname = url.pathname.replace(/^\/api/, '') || '/'
  return env.FINANCE_API.fetch(new Request(url, request))
}
return env.ASSETS.fetch(request)
```

- **Por que:** o ponto de stripping fica no front-infra (que controlamos), sem pedir
  mudança no backend. Uma única regra, idêntica entre dev e prod, evita divergência.
- **Trade-off:** o Worker precisa repassar método/corpo/headers/redirects fielmente — daí
  reusar o `Request` original (`new Request(url, request)`), que preserva tudo.

### D4 — Cookie host-only no mesmo host

O backend seta `fa_session` com `Path=/; HttpOnly; Secure; SameSite=Lax` e **sem `Domain`**
⇒ host-only para o host da requisição. Como login e callback passam por
`financial.gatolandios.com.br/api/...`, o host é o mesmo do SPA; o `302 → /` (default
`POST_LOGIN_REDIRECT`) cai nos Static Assets já autenticado.

- **Por que funciona sem CORS/SameSite=None:** tudo é same-site/same-origin do ponto de
  vista do browser. `SameSite=Lax` basta para navegação top-level (o login é exatamente
  isso).
- **Pré-condição no backend (crítica):** como o Worker remove o prefixo `/api`, o backend
  não sabe que está atrás de `/api` — então o `redirect_uri` do OIDC tem que ser a URL
  pública explícita `https://financial.gatolandios.com.br/api/auth/callback` (host do front,
  com `/api`), registrada também no OAuth Client. Se o callback voltar por outro host (ex.:
  o domínio do backend), os cookies transientes `fa_oidc_*` (host-only do front) não são
  enviados e o login falha com `401 "invalid login state"`. Ver DEPLOY.md → Pré-condições.

### D5 — Provisionamento mínimo (sem Terraform); domínio no `wrangler.toml`

Não há IaC. O provisionamento é: conectar o repo à Cloudflare Builds (uma vez) e declarar o
domínio custom `financial.gatolandios.com.br` no `wrangler.toml` (`routes` com
`custom_domain = true`) — assim o próprio `wrangler deploy` provisiona o hostname (DNS +
SSL) e o mantém anexado ao Worker, sem clicar no painel. O custom domain manda **todo** o
tráfego do host ao Worker (SPA + `/api/*`), que separa internamente (D1). O deploy contínuo é
`wrangler deploy` a cada push em `main`.

- **Por que:** para um front simples sem segredos, Terraform adicionava cerimônia (provider,
  state, variáveis) sem payoff — e, do jeito que estava, provisionava sem ligar no deploy,
  deixando a pipeline incoerente. A conexão do repo + `wrangler deploy` é suficiente e
  mantém tudo num lugar só. Se um dia houver mais recursos de infra ou múltiplos ambientes,
  reintroduzir Terraform — mas então **com** a pipeline ligada, não solto.

### D6 — Deploy via Cloudflare Builds (repo conectado)

A Cloudflare Builds, a cada push em `main`, roda `npm run build` (gera `dist/`) e então
`npx wrangler deploy` (bundla o Worker e sobe os assets).

- **Por que:** mantém o build num só lugar, roda no contexto da conta (sem secrets no repo)
  e o gating (lint/typecheck) pode rodar no build command. Sem um 2º sistema de CI
  duplicando o deploy.
- **Pré-requisito:** Build command `npm run build` e Deploy command `npx wrangler deploy`
  configurados no Worker; o build precede o deploy para `dist/` existir.

## Risks / Trade-offs

- **Service binding exige `finance-api` na mesma conta** → mitigação: documentar a
  pré-condição; se o nome do Worker mudar, é só o `services.service` no `wrangler.toml`. Se
  ainda não existir, o deploy/binding falha cedo (erro claro), não em runtime silencioso.
- **Worker como ponto único no caminho de `/api`** → mitigação: mantê-lo trivial (sem
  estado, sem lógica de negócio) e repassar tudo fielmente; qualquer bug é de roteação, não
  de dados.
- **Ordem de roteação (`/api` vs. assets)** → mitigação: o Worker checa `/api` antes de
  cair em `env.ASSETS`; cenário de teste explícito (`/api/*` à API; resto serve
  `index.html`) e validação manual pós-deploy do fluxo de login completo.
- **Build/Deploy command mal configurados na Cloudflare Builds** → mitigação: documentar os
  dois comandos em DEPLOY.md; `wrangler deploy --dry-run` valida a config localmente.
- **`SameSite=Lax` e fluxo OIDC** → o login é navegação top-level (compatível com Lax); se o
  backend algum dia usar POST cross-site no callback, revisitar — fora do controle do front.

## Open Questions

- Nome final do Worker (assumido `finance-web`) — confirmar convenção da conta.
