## Why

A tela de investimentos hoje é básica (listar/criar/renomear/arquivar + aporte/valuation),
mas o modelo do backend evoluiu (CONTRACT §7): investimentos agora têm **`initialValue`**,
**`totalInvested`** (= inicial + aportes), **`accountId`** (vínculo a uma conta
`kind=investment`), edição completa, criação em **lote** e filtro por conta. O usuário quer
cadastrar investimentos, **lançar aportes e ver o total investido atualizar na hora**, e
**enxergar quanto tem por conta e por tipo**.

## What Changes

- **Modelo enriquecido**: exibir `initialValue`, `totalInvested` (inicial + aportes) e
  `currentValue` (última valuation, **independente** do investido) de forma distinta; tudo em
  centavos formatado por `currency`.
- **Vínculo com conta de investimento**: seletor de conta que lista **apenas**
  `GET /api/accounts?archived=false` com `kind === "investment"`; `accountId` opcional. Conta
  inválida/arquivada/de outro usuário/kind errado → `400` (mensagem inline).
- **CRUD atualizado**:
  - **Criar** `POST /api/investments { name, type, currency, initialValue?, accountId? }`
    (`type` da taxonomia; `initialValue` centavos, pode ser negativo, default 0).
  - **Editar** `PUT /api/investments/:id { name, initialValue, accountId }` — `type`/`currency`
    **imutáveis** (não enviados); `accountId: null` limpa o vínculo. (Substitui o "renomear".)
  - **Arquivar** (soft-delete) — arquivado continua legível, mas não aceita novos
    aportes/valuations.
  - **Detalhe** `GET /api/investments/:id`; `404` → "não encontrado".
- **Aportes (o ponto principal)**: `POST /api/investments/:id/contributions
  { amount(>0), occurredOn, note? }`; logo após, **re-buscar** o investimento e exibir o
  `totalInvested` atualizado, deixando claro o impacto do aporte. `amount ≤ 0`/arquivado → 400.
- **Valuations** (append-only): `POST /api/investments/:id/valuations { currentValue, recordedOn }`;
  o `currentValue` exibido é o do `recordedOn` mais recente; opcionalmente listar as valuations
  registradas na sessão (não há endpoint de histórico).
- **Dashboard por conta e por tipo**: agrupar os investimentos no cliente por `accountId` e por
  `type`, somando `totalInvested` (e `currentValue` quando houver) por grupo, **agrupando por
  `currency` dentro de cada grupo** (sem converter moedas). Cards de resumo: total por conta,
  total por tipo, e total **sem conta** (`accountId null`). Nome da conta vem de
  `GET /api/accounts`.
- **Criação em lote** (`POST /api/investments/batch`): grade all-or-nothing (máx 100, vazio →
  400; item inválido falha o lote com `400 { error, index }` → destacar a linha).
- **Estados transversais**: `401`→login, `404`→"não encontrado", `400`→validação inline via
  `error.message`; loading/empty/error nas listas.

## Capabilities

### New Capabilities
- `web-investments-batch`: criação de investimentos em lote (grade), all-or-nothing com
  destaque do `index` no `400`, espelhando o padrão de lançamentos em lote.

### Modified Capabilities
- `web-investments`: modelo passa a incluir `initialValue`/`totalInvested`/`accountId`; criar
  ganha `initialValue`/`accountId`; "renomear" vira **editar** (`name`/`initialValue`/
  `accountId`, `type`/`currency` imutáveis); aporte re-busca e mostra `totalInvested`; novo
  **vínculo com conta de investimento** e **dashboard por conta e por tipo**.

## Impact

- **Documentação**: CONTRACT §7 atualizado (modelo + `accountId` + `initialValue`/
  `totalInvested` + `/investments/batch`) — pré-condição.
- **Código**: `src/api/types.ts` (Investment + inputs); `src/api/paths.ts`
  (`investmentsBatch`); `features/investments/api.ts` (filtro `accountId`, `updateInvestment`,
  `createBatch`); `AccountSelect` ganha filtro por `kind`; `InvestmentsScreen`/`InvestmentCard`
  reescritos para o novo modelo + dashboard; nova grade de lote. Reuso de `parseToCentsSigned`,
  `getAccount`, `listAccounts`. Tudo via o cliente único.
- **API**: só §7 (investments/batch/contributions/valuations) e §3.5 (accounts). Sem segredo
  no bundle; valores em centavos; JS não toca `fa_session`; CSP intacta.
