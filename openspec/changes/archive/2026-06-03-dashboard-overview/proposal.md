## Why

Hoje o app abre direto numa tela de transações e não há uma visão de entrada que
responda "como estão minhas finanças agora?". O usuário precisa navegar tela a tela
(cartões → faturas, recorrentes → previstos, investimentos) para juntar o panorama na
cabeça. Uma tela inicial de visão geral reduz esse atrito reunindo os indicadores que o
backend **já agrega** e dando atalhos para cada área.

## What Changes

- Nova tela **Visão geral** (dashboard), que passa a ser a tela inicial do app.
- A tela compõe blocos a partir de endpoints existentes, exibindo **apenas valores já
  agregados pelo backend** ou contagens/listas curtas — sem somar/recalcular nada no
  front:
  - **Faturas em aberto**: varre `GET /api/cards?archived=false` e, para cada cartão,
    `GET /api/cards/:id/invoices`, filtrando `status === "open"` sobre os itens
    retornados (o endpoint não aceita filtro de status), listando cada fatura com seu
    `total` (centavos, já agregado) e `dueDate`. Não há total geral somado no front.
  - **Previstos do mês**: ocorrências recorrentes do mês corrente via
    `GET /api/recurring-occurrences?from=&to=` (janela do 1º ao último dia do mês),
    mostrando os pendentes/à confirmar.
  - **Investimentos**: lista curta de `GET /api/investments?archived=false` com o
    `currentValue` (agregado pelo backend) de cada um.
  - **Últimas transações**: as N mais recentes de `GET /api/transactions`.
  - **Cartões**: contagem e, opcionalmente, milhas acumuladas por cartão
    (`GET /api/cards/:id/miles`, `totalMiles` inteiro).
- Cada bloco tem **atalho** ("ver tudo") para a tela completa correspondente.
- Estados de UI explícitos por bloco (carregando, vazio, erro com "tentar novamente",
  sem-sessão via 401 central) — um bloco que falha não derruba os demais.
- **Sem totalização cruzada inventada**: como o CONTRACT não expõe endpoint de
  resumo/summary, o app NÃO fabrica "patrimônio total" ou "gasto do mês" somando listas
  (potencialmente paginadas) no cliente. Isso fica registrado como gap de backend.

## Capabilities

### New Capabilities
- `web-dashboard`: tela inicial de visão geral que compõe indicadores já agregados pelo
  backend (faturas em aberto, previstos do mês, investimentos, últimas transações,
  cartões) com atalhos para cada área e estados de UI explícitos por bloco, sem
  recalcular agregados nem inventar endpoints de resumo.

### Modified Capabilities
<!-- Nenhuma capability existente muda de requisito. A navegação/initial view é detalhe
     de implementação do App, não mudança de requisito das telas existentes. -->

## Impact

- **Código**: nova feature `src/features/dashboard/` (screen + blocos + api de
  composição reusando as `api.ts` de cada feature); `src/App.tsx` ganha a view
  `dashboard` como inicial no `VIEWS`/`SCREENS`.
- **API**: nenhuma rota nova; só leituras `GET` já existentes no CONTRACT. Reuso do
  cliente único `src/api/client.ts` (único arquivo com `fetch(`).
- **Sem segredos, sem novas dependências, sem mudança de deploy.** Continua tudo atrás
  de auth, mesmo-origin, CSP restritiva.
