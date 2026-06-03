## Why

Cartões de crédito e faturas são a última área grande do CONTRACT.md (§8) ainda ausente do
front. O backend já modela cartões, taxas de milhas, milhas acumuladas e faturas com uma
máquina de estados (`open → closed → paid`) e total/milhas derivados. Sem o front, o usuário
não cadastra cartões, não associa gastos a eles, nem acompanha faturas/milhas. Esta change
adiciona a área de Cartões e Faturas e o elo que falta nas transações (associar um gasto a um
cartão) — sem mudar backend.

## What Changes

- **CRUD de cartões.** `/api/cards`: listar (filtro `archived`), criar
  `{ name?, closingDay(1-31), dueDay(1-31), currency }`, editar `{ name?, dueDay? }`
  (**`closingDay` é imutável** — não enviar; mudar → `400`), arquivar
  (`POST /api/cards/:id/archive`, sem hard delete).
- **Taxas de milhas e milhas.** Listar/registrar taxas
  (`GET`/`POST /api/cards/:id/rates`, `{ milesPerUnit(decimal ≥ 0), effectiveFrom }` —
  **append-only/versionado**); ver milhas acumuladas (`GET /api/cards/:id/miles` →
  `{ cardId, totalMiles }`, soma das faturas **pagas**). `milesPerUnit` é **multiplicador
  decimal** (NÃO centavos); `miles`/`totalMiles` são **contagens inteiras** (NÃO centavos).
- **Faturas.** Listar por cartão (`GET /api/cards/:id/invoices`), detalhe
  (`GET /api/invoices/:id` → fatura **+ `transactions`**), fechar
  (`POST /api/invoices/:id/close`, `open → closed`) e pagar
  (`POST /api/invoices/:id/pay`, `closed → paid`). Transições inválidas → `400`. Faturas são
  criadas **preguiçosamente** pelo backend (não pela UI) e reabrem sozinhas ao editar um
  lançamento do período — a UI apenas reflete o estado, com botões condicionais ao `status`.
  `total` em centavos; `miles` é inteiro derivado.
- **Elo nas transações.** Adiciona um **seletor de cartão (opcional)** ao formulário de
  transação (criar/editar): escolher um cartão envia `cardId`; "sem cartão" envia ad-hoc. É o
  que faz uma fatura ganhar conteúdo. `cardId` arquivado/ inválido no corpo → `400` (tratado
  no campo).

Fora de escopo (diferido): dashboard e admin.

## Capabilities

### New Capabilities
- `web-cards`: gestão de cartões — listar/criar/editar (`closingDay` imutável)/arquivar,
  taxas de milhas (append-only) e milhas acumuladas; formatação correta de
  milhas/`milesPerUnit` (não-centavos).
- `web-invoices`: faturas por cartão — listar, detalhar (com transações), e a máquina de
  estados `open → closed → paid` (fechar/pagar com transições condicionais e `400` em
  transição inválida); faturas não são criadas pela UI.

### Modified Capabilities
- `web-transactions`: o formulário de transação ganha um seletor de cartão opcional
  (`cardId`), permitindo associar/desassociar um lançamento a um cartão.

## Impact

- **Front:** novos paths (`/api/cards`, `/api/cards/:id`, `.../archive`, `.../rates`,
  `.../miles`, `.../invoices`, `/api/invoices/:id`, `.../close`, `.../pay`); nova feature
  `src/features/cards/` (api + telas de cartões/faturas); tipos `Card`, `MileageRate`,
  `CardMiles`, `Invoice` (+ `transactions` no detalhe) e inputs; helpers de número para
  milhas/taxa (não-centavos) em `src/lib/`; nova entrada de nav; pequeno ajuste no
  `TransactionForm`/`api` de transações para o seletor de cartão.
- **Backend/API:** nenhuma — endpoints já existem no CONTRACT.md §8.
- **Reuso:** cliente HTTP único, 401/404/400 centrais, helpers de dinheiro e o design system.
  Atenção: `milesPerUnit`/`miles` **não** passam por `formatCents` (não são centavos).
