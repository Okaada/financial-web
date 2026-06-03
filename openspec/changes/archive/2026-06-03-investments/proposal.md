## Why

Falta ao front a área de investimentos, que o backend já modela (CONTRACT.md §7):
carteira com total aportado e valor atual, aportes e marcações de valor ao longo do tempo.
Sem isso o usuário não acompanha patrimônio investido pelo app. Esta change adiciona a tela
de Investimentos — listar, criar, renomear, arquivar, registrar aporte e registrar valor
atual — sem mudar backend e reusando o cliente HTTP e o design system já existentes.

## What Changes

- **Listar investimentos.** `GET /api/investments` (filtro `archived`), exibindo `name`,
  `type`, `totalContributed` e `currentValue` — **ambos em centavos e já agregados pelo
  backend**. O front NÃO soma nada: apenas formata e exibe (currentValue pode ser `null`).
- **Criar / renomear / arquivar.** Criar (`POST /api/investments` `{ type, currency,
  name? }`, `type` da taxonomia fixa `renda_fixa|acoes|fii|cripto|outro`); renomear (`PUT
  /api/investments/:id`, **só `name`**); arquivar (`POST /api/investments/:id/archive`, sem
  hard delete).
- **Registrar aporte.** `POST /api/investments/:id/contributions`
  `{ amount(inteiro > 0, centavos), occurredOn, note? }` → `201` Contribution. Após sucesso,
  o app **re-busca o investimento** para refletir o novo `totalContributed` (não soma no
  front).
- **Registrar valor atual.** `POST /api/investments/:id/valuations`
  `{ currentValue(centavos), recordedOn }` → `201` Valuation (append-only; o backend guarda
  o histórico e usa o `recordedOn` mais recente como valor atual). Após sucesso, o app
  re-busca o investimento para refletir o `currentValue` autoritativo.
- **Arquivado rejeita aporte/valuation.** Um investimento arquivado retorna `400` ao
  registrar aporte/valor — a UI trata como erro do formulário e não oferece essas ações em
  itens arquivados.

Fora de escopo (diferido): cartões, dashboard e admin.

## Capabilities

### New Capabilities
- `web-investments`: a tela de investimentos — listar (com agregados do backend), criar,
  renomear, arquivar, registrar aportes e marcações de valor (valuations), respeitando a
  taxonomia fixa de `type` e a regra de arquivado-rejeita-aporte/valuation.

### Modified Capabilities
<!-- Nenhuma: capacidades existentes não mudam de requisito. -->

## Impact

- **Front:** novos paths em `src/api/paths.ts` (`/api/investments`, `/api/investments/:id`,
  `/api/investments/:id/archive`, `/api/investments/:id/contributions`,
  `/api/investments/:id/valuations`); nova feature `src/features/investments/` (api + tela
  + formulários de aporte/valuation); tipos `Investment`, `InvestmentType`,
  `Contribution`, `Valuation` e os inputs de criação/aporte/valuation; nova entrada no nav
  de `App.tsx`.
- **Backend/API:** nenhuma — endpoints já existem no CONTRACT.md §7.
- **Reuso:** cliente HTTP único, tratamento central de 401/404/400 e os helpers de dinheiro
  (`parseToCents`/`centsToInput`/`formatCents`) e o design system (classes) — sem novas
  dependências.

## Limitação conhecida (do CONTRACT)

Não há endpoint de listagem de aportes/valuations: cada `POST` devolve apenas o objeto
criado, e o investimento carrega só os agregados (`totalContributed`, `currentValue`). Logo
a "evolução" exibida é o **valor atual** (último, autoritativo) mais, no máximo, as
valuations que o usuário registrou **nesta sessão** — não há histórico completo a buscar.
NUNCA inventar um endpoint de histórico; se for preciso histórico persistente, é gap de
backend.
