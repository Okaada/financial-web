## 1. Estrutura da feature

- [x] 1.1 Criar `src/features/dashboard/` com `api.ts` fino que reusa os helpers das
  features existentes (`cards`, `recurring`, `investments`, `transactions`) — nenhum
  `fetch(` aqui; tudo via o cliente único.
- [x] 1.2 Adicionar util de janela do mês corrente (`from`/`to` em `YYYY-MM-DD` a partir
  dos componentes locais de `new Date()`, sem `toISOString()`), em `src/lib/` ou no
  `dashboard/api.ts`.

## 2. Blocos da Visão geral

- [x] 2.1 `OpenInvoicesBlock`: `listCards({ archived: false })` → `Promise.all` de
  `listInvoices(cardId)` → filtra `status === 'open'`, exibe cartão/competência/
  vencimento/`total` formatado; estado vazio; truncamento sinalizado; atalho "ver tudo"
  → cartões.
- [x] 2.2 `UpcomingBlock`: `listOccurrences({ from, to })` do mês corrente, destaca
  pendentes com valor formatado (centavos); estado vazio; atalho → ocorrências.
- [x] 2.3 `InvestmentsBlock`: `listInvestments({ archived: false })` (lista curta) com
  nome/tipo/`currentValue` formatado (placeholder quando `null`); estado vazio; atalho →
  investimentos.
- [x] 2.4 `RecentTransactionsBlock`: `listTransactions({})` fatiando as N mais recentes,
  valor formatado/data/tipo/descrição; estado vazio; atalho → transações.
- [x] 2.5 Cada bloco com estados próprios (carregando / vazio / erro com "tentar
  novamente"); `404` tratado como vazio; `401` deixado para o tratamento central do
  cliente.

## 3. Tela e navegação

- [x] 3.1 `DashboardScreen` compõe os blocos isoladamente (falha de um não derruba os
  outros).
- [x] 3.2 `App.tsx`: adicionar view `dashboard` em `VIEWS`/`SCREENS` e torná-la a tela
  inicial; "ver tudo" troca a view por estado local.
- [x] 3.3 Estilos reusando o design system existente (tokens/cards/badges/estados) em
  `index.css`, responsivo claro/escuro; sem novas dependências.

## 4. Qualidade

- [x] 4.1 `npm run typecheck`, `npm run lint` (confirmar zero `fetch(` fora de
  `client.ts`) e `npm run build` verdes.
- [ ] 4.2 Verificação manual contra o backend real: Visão geral é a inicial, cada bloco
  carrega/vazio/erro isolado, atalhos navegam, valores conferem com as telas de origem,
  `401` redireciona ao login.
