## 1. Paths e tipos

- [x] 1.1 Adicionar paths em `src/api/paths.ts`: `INVESTMENTS_PATH`, helpers `investmentPath(id)`, `investmentArchivePath(id)`, `investmentContributionsPath(id)`, `investmentValuationsPath(id)`
- [x] 1.2 Em `src/api/types.ts`: `InvestmentType` (`renda_fixa|acoes|fii|cripto|outro`), `Investment` (`id, name|null, type, currency, archived, totalContributed, currentValue|null, createdAt, updatedAt`), `Contribution` (`id, amount, occurredOn, note|null, createdAt`), `Valuation` (`id, currentValue, recordedOn, createdAt`), e inputs `CreateInvestmentInput` (`{ type, currency, name? }`), `RenameInvestmentInput` (`{ name }`), `CreateContributionInput` (`{ amount, occurredOn, note? }`), `CreateValuationInput` (`{ currentValue, recordedOn }`), filtro `InvestmentFilters` (`{ archived? }`)

## 2. API de investimentos

- [x] 2.1 Novo `src/features/investments/api.ts`: `listInvestments({archived?})`, `getInvestment(id)`, `createInvestment(input)`, `renameInvestment(id, {name})`, `archiveInvestment(id)`
- [x] 2.2 No mesmo arquivo: `addContribution(id, input)` (`POST /:id/contributions`) e `addValuation(id, input)` (`POST /:id/valuations`)

## 3. Tela e criação

- [x] 3.1 `InvestmentsScreen`: listar com filtro `archived`; exibir `name`/`type` legível/`totalContributed`/`currentValue` (placeholder "sem marcação" quando `null`); estados carregando/vazio/erro/sem-sessão
- [x] 3.2 Form de criação (`select` de `type` da taxonomia fixa com rótulos legíveis, `currency` default BRL, `name?`); tratar `400`; incluir no 201
- [x] 3.3 Renomear (PUT só `name`, tratar `400`/`404`) e arquivar (`POST /:id/archive`, refletir `archived: true`); itens arquivados não oferecem aporte/valuation

## 4. Aportes e valuations

- [x] 4.1 Form de aporte (`amount` via `parseToCents` > 0, `occurredOn`, `note?`) → `addContribution`; tratar `400` (valor/arquivado); após `201` **re-buscar o investimento** (`getInvestment`) e atualizar `totalContributed` na lista (front não soma)
- [x] 4.2 Form de valuation (`currentValue` via `parseToCents`, `recordedOn`) → `addValuation`; tratar `400` (valor/arquivado); após `201` **re-buscar o investimento** e atualizar `currentValue`
- [x] 4.3 Mini-evolução da sessão: acumular em estado local as valuations registradas nesta sessão e listá-las, deixando claro que não é histórico persistente (sem endpoint de listagem)

## 5. Navegação e integração

- [x] 5.1 Adicionar a view "Investimentos" ao nav de `App.tsx` (estado local, sem router)
- [x] 5.2 Detalhe/ações por investimento expandido inline (estado `expandedId`), reusando classes do design system (cards, botões, banners)

## 6. Verificação

- [x] 6.1 `npm run typecheck`, `npm run lint` e `npm run build` verdes; confirmar que `fetch(` só existe em `src/api/client.ts`
- [ ] 6.2 Verificação manual (criar/renomear/arquivar; registrar aporte e ver `totalContributed` atualizar; registrar valuation e ver `currentValue` atualizar; `400` de arquivado; `currentValue: null`) contra backend real
