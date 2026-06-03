## 1. Paths, tipos e helpers de número

- [x] 1.1 Paths em `src/api/paths.ts`: `CARDS_PATH`, `INVOICES_PATH`, helpers `cardPath(id)`, `cardArchivePath(id)`, `cardRatesPath(id)`, `cardMilesPath(id)`, `cardInvoicesPath(id)`, `invoicePath(id)`, `invoiceClosePath(id)`, `invoicePayPath(id)`
- [x] 1.2 Tipos em `src/api/types.ts`: `Card`, `MileageRate` (`milesPerUnit` decimal), `CardMiles` (`{ cardId, totalMiles }`), `Invoice` (status `open|closed|paid`, `total` cents, `miles` int), `InvoiceDetail` (`Invoice & { transactions: Transaction[] }`), inputs `CreateCardInput`, `UpdateCardInput` (`{ name?, dueDay? }`), `CreateRateInput`, e filtro `CardFilters`
- [x] 1.3 `src/lib/number.ts`: `formatMiles(n)` (inteiro pt-BR + "milhas"), `formatRate(n)` (decimal), `parseRate(input)` (decimal ≥ 0, vírgula/ponto) — NÃO usar `formatCents` para milhas/taxa

## 2. API de cartões e faturas

- [x] 2.1 Novo `src/features/cards/api.ts`: `listCards({archived?})`, `getCard(id)`, `createCard(input)`, `updateCard(id, {name?,dueDay?})`, `archiveCard(id)`
- [x] 2.2 No mesmo arquivo: `listRates(id)`, `addRate(id, input)`, `getMiles(id)`
- [x] 2.3 No mesmo arquivo: `listInvoices(cardId)`, `getInvoice(invoiceId)` (detalhe + transactions), `closeInvoice(invoiceId)`, `payInvoice(invoiceId)`

## 3. Tela de cartões

- [x] 3.1 `CardsScreen`: listar com filtro `archived`; criar (`closingDay`/`dueDay` 1–31, `currency`, `name?`); estados carregando/vazio/erro/sem-sessão; tratar `400`
- [x] 3.2 Editar cartão (`PUT { name?, dueDay? }`, `closingDay` somente-leitura) e arquivar; tratar `400`/`404`
- [x] 3.3 Taxas de milhas: listar + registrar nova (`milesPerUnit` via `parseRate`, `effectiveFrom`); append-only (não editar/excluir); milhas acumuladas (`getMiles` → `formatMiles`)

## 4. Faturas

- [x] 4.1 Ao selecionar um cartão (estado `selectedCardId`): listar faturas (`listInvoices`) com período/status/total formatado/`miles`; estados de UI
- [x] 4.2 Detalhe da fatura (`selectedInvoiceId` → `getInvoice`): exibir dados + transações; tratar `404`
- [x] 4.3 Máquina de estados: botão Fechar (apenas `open`) e Pagar (apenas `closed`); atualizar a partir da resposta; tratar `400` de transição inválida + re-buscar a fatura para re-sincronizar; UI nunca cria/reabre fatura

## 5. Elo nas transações (web-transactions)

- [x] 5.1 `CardSelect` (reusa padrão do `CategorySelect`): `GET /api/cards?archived=false`, opção "sem cartão" (valor `''`)
- [x] 5.2 `TransactionForm`: incluir `CardSelect`; `POST` omite `cardId` vazio; `PUT` envia `cardId: null` quando vazio; mapear `400` de cartão ao campo. Ajustar `CreateTransactionInput` (já tem `cardId?` no `UpdateTransactionInput`; adicionar opcional ao create)

## 6. Navegação e integração

- [x] 6.1 Adicionar a view "Cartões" ao nav de `App.tsx` (estado local, sem router); drill-down cartão → faturas → detalhe por estado local; classes do design system; CSS extra mínimo se necessário

## 7. Verificação

- [x] 7.1 `npm run typecheck`, `npm run lint` e `npm run build` verdes; confirmar `fetch(` só em `src/api/client.ts`; conferir que milhas/taxa NÃO passam por `formatCents`
- [ ] 7.2 Verificação manual (criar/editar/arquivar cartão; registrar taxa; ver milhas; vincular transação a cartão e ver fatura ganhar conteúdo; fechar/pagar; `400` de transição inválida; `closingDay` imutável) contra backend real
