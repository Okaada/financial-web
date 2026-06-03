## Context

A Finance Web é um SPA (Vite/React) servido na Cloudflare Pages, 100% atrás de auth. O
cliente HTTP do front (change `auth-transactions-skeleton`, design D1/D2) assume
**mesmo-origin**: chama caminhos relativos `/api/*`, conta com o browser anexando o cookie
`fa_session` e não trata CORS. Em dev isso é satisfeito pelo proxy do `vite.config.ts`, que
faz `rewrite` removendo `/api`. Em produção não há proxy — é preciso uma montagem real na
Cloudflare que entregue o mesmo contrato de origem.

Concretudes fornecidas:
- Hostname: `financial.gatolandios.com.br` (zone `gatolandios.com.br`).
- Worker da API já existente na conta: `finance-api`.
- Backend espera rotas sem prefixo `/api` (CONTRACT.md: `/auth/login`, `/transactions`, …).
- É um front simples, **sem segredos** no bundle. Deploy via Wrangler/CI.

## Goals / Non-Goals

**Goals:**

- Servir o SPA em `financial.gatolandios.com.br` via Pages, publicado por Wrangler/CI.
- Rotear `/<host>/api/*` para `finance-api` no mesmo origin, sem CORS, removendo `/api`.
- Preservar o cookie de sessão por todo o fluxo de login (start → callback → `302 /`).
- Fallback de SPA e headers de segurança.
- **Um único projeto, um `node_modules`, um deploy** — a infra mínima é criada uma vez.

**Non-Goals:**

- Mudar qualquer código do front (origem relativa `/api` já está pronta).
- Configurar o Worker `finance-api` (vive no repo do backend).
- Ambientes de preview/staging elaborados; foco em produção (previews do Pages podem
  existir, mas sem domínio próprio nesta change).
- Observabilidade/alertas do deploy.
- IaC (Terraform): para um front simples sem segredos, não compensa — ver D5.

## Decisions

### D1 — Proxy `/api/*` como Pages Function (não um Worker separado)

O Pages serve o SPA e uma **Pages Function** (`functions/api/[[path]].ts`) no MESMO projeto
atende `/api/*`. Pages Functions têm precedência sobre os assets estáticos para os paths
que casam, então `/api/*` nunca cai no fallback de SPA; todo o resto serve `index.html`.

- **Por que:** é a forma idiomática de mesmo-origin no Pages. Fica tudo num projeto só —
  sem segundo Worker, sem `node_modules` extra, sem rota de precedência para gerenciar, sem
  deploy separado. A Function sobe junto com `wrangler pages deploy`.
- **Alternativa considerada (rejeitada):** um Worker `finance-web-router` standalone com a
  route `…/api/*` sobrepondo o Pages. Funciona, mas adiciona um projeto inteiro (npm,
  lockfile, wrangler, tsconfig), uma route a gerenciar e um segundo passo de deploy — custo
  sem ganho para este caso. Foi a abordagem inicial e foi desfeita por inflar a estrutura.

### D2 — Service binding (não fetch público) para a Finance API

A Function encaminha via **service binding** (`env.FINANCE_API.fetch(...)`) para
`finance-api`, declarado no `wrangler.toml` do Pages, não via `fetch` a uma URL pública.

- **Por que:** chamada interna (Worker→Worker) sem sair para a internet — menor latência,
  sem expor a API num segundo hostname público, e o cookie/redirect fluem como se fosse o
  mesmo servidor. Mantém o backend sem necessidade de CORS.
- **Alternativa considerada:** `fetch('https://finance-api.<conta>.workers.dev/...')`.
  Rejeitada: hop público desnecessário e superfície extra.
- **Fallback operacional:** se a conta não aplicar o binding declarado no `wrangler.toml`,
  configurá-lo uma vez em Pages → Settings → Functions → Service bindings (documentado em
  DEPLOY.md).

### D3 — Remoção do prefixo `/api` na Function (espelha o dev)

A Function reescreve `pathname` removendo o prefixo `/api` antes de encaminhar, exatamente
como o `rewrite` do `vite.config.ts`. Assim o backend recebe `/auth/login`, etc.

```ts
const url = new URL(request.url)
url.pathname = url.pathname.replace(/^\/api/, '') || '/'
return env.FINANCE_API.fetch(new Request(url, request))
```

- **Por que:** o ponto de stripping fica no front-infra (que controlamos), sem pedir
  mudança no backend. Uma única regra, idêntica entre dev e prod, evita divergência.
- **Trade-off:** a Function precisa repassar método/corpo/headers/redirects fielmente — daí
  reusar o `Request` original (`new Request(url, request)`), que preserva tudo.

### D4 — Cookie host-only no mesmo host

O backend seta `fa_session` com `Path=/; HttpOnly; Secure; SameSite=Lax` e **sem `Domain`**
⇒ host-only para o host da requisição. Como login e callback passam por
`financial.gatolandios.com.br/api/...`, o host é o mesmo do SPA; o `302 → /` (default
`POST_LOGIN_REDIRECT`) cai no Pages já autenticado.

- **Por que funciona sem CORS/SameSite=None:** tudo é same-site/same-origin do ponto de
  vista do browser. `SameSite=Lax` basta para navegação top-level (o login é exatamente
  isso).

### D5 — Provisionamento mínimo (sem Terraform), deploy via Wrangler/CI

Não há IaC. O provisionamento é uma ação única e pequena: criar o projeto Pages
`finance-web` (`wrangler pages project create`, ou o primeiro deploy cria) e anexar o
domínio custom `financial.gatolandios.com.br`. O deploy contínuo é o próprio
`wrangler pages deploy dist` a cada push em `main`.

- **Por que:** para um front simples sem segredos, Terraform adicionava cerimônia (provider,
  state, variáveis) sem payoff — e, do jeito que estava, provisionava o projeto sem ligar no
  deploy, deixando a pipeline incoerente. A criação única + `wrangler pages deploy` é
  suficiente e mantém tudo num lugar só.
- **Alternativa considerada (rejeitada):** Terraform para projeto Pages + domínio + (antes)
  router/route/DNS. Rejeitada pelo custo/benefício neste contexto. Se um dia houver mais
  recursos de infra ou múltiplos ambientes, reintroduzir Terraform — mas então **com** a
  pipeline ligada, não solto.

### D6 — Pages publicado por Wrangler, não build-on-push do dashboard

O projeto Pages é "direct upload" (Wrangler), não conectado ao Git pelo dashboard.

- **Por que:** mantém o build num só lugar (o CI do repo), evita dois sistemas de build
  divergentes e deixa o gating (lint/typecheck) sob o CI versionado.

## Risks / Trade-offs

- **Service binding exige `finance-api` na mesma conta** → mitigação: documentar a
  pré-condição; se o nome do Worker mudar, é só o `services.service` no `wrangler.toml`. Se
  ainda não existir, o deploy/binding falha cedo (erro claro), não em runtime silencioso.
- **Function como ponto único no caminho de `/api`** → mitigação: mantê-la trivial (sem
  estado, sem lógica de negócio) e repassar tudo fielmente; qualquer bug é de roteação, não
  de dados.
- **Function vs. fallback de SPA mal ordenados** → mitigação: cenário de teste explícito
  (`/api/*` vai à Function; resto serve `index.html`) e validação manual pós-deploy do fluxo
  de login completo.
- **Binding não aplicado via `wrangler.toml` em algumas contas** → mitigação: fallback
  documentado de configurá-lo uma vez no dashboard (ver D2).
- **Secrets de CI** → `CLOUDFLARE_API_TOKEN` (escopo **Pages: Edit**) e
  `CLOUDFLARE_ACCOUNT_ID` só no cofre do CI. Nunca no repo/bundle.
- **`SameSite=Lax` e fluxo OIDC** → o login é navegação top-level (compatível com Lax); se o
  backend algum dia usar POST cross-site no callback, revisitar — fora do controle do front.

## Open Questions

- Nome final do projeto Pages (assumido `finance-web`) — confirmar convenção da conta.
- CI: assume-se GitHub Actions (repo Git). Confirmar se o runner/forja é outro.
