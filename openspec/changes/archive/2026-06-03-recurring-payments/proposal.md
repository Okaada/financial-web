## Why

Hoje o usuário lança cada despesa/receita à mão, mesmo as que se repetem todo mês
(aluguel, assinatura, salário). A Finance API já modela isso com templates recorrentes e
ocorrências previstas (CONTRACT.md §6), mas o front não expõe nada disso. Esta change
adiciona o CRUD de templates e a tela de "Previstos", onde o usuário confirma uma ocorrência
e ela vira uma transação real — sem redigitar.

## What Changes

- **CRUD de templates recorrentes.** `/api/recurring-templates`: criar/editar
  (`POST`/`PUT` com `{ type, amount(centavos), currency, dayOfMonth(1-31),
  intervalMonths(>=1), startDate, endDate?, description?, categoryId?, active? }`), listar
  (`GET`, filtro `active`), excluir (`DELETE` → `204`, hard delete real). `amount` em
  centavos; `categoryId` opcional.
- **Tela de Previstos (ocorrências).** Consome `GET /api/recurring-occurrences` com `from`
  e `to` **obrigatórios** (`YYYY-MM-DD`). As ocorrências são **calculadas no backend, não
  persistidas**; cada uma traz `competence`, `date`, `amount`, `confirmed` e
  `transactionId`. A UI valida `from`/`to` (e o `400` de `from>to`/range grande) e lista o
  previsto do período.
- **Confirmar ocorrência (idempotente).** `POST /api/recurring-templates/:id/confirm`
  `{ competence: "YYYY-MM" }` materializa uma transação real (`201` na primeira vez, `200`
  idempotente nas seguintes, sempre a mesma transação — não duplica). A UI reflete **"já
  confirmado"** (com link/id da transação) em vez de oferecer confirmar de novo.

Fora de escopo (diferido): investimentos, cartões, dashboard e admin. Editar/excluir a
**transação** materializada continua na tela de Transações (change anterior).

## Capabilities

### New Capabilities
- `web-recurring-templates`: gestão de templates recorrentes — criar, editar, listar
  (filtro `active`) e excluir; valores em centavos, `categoryId` opcional.
- `web-recurring-occurrences`: tela de previstos — listar ocorrências calculadas
  (`from`/`to` obrigatórios) e confirmar uma competência de forma idempotente, refletindo o
  estado `confirmed`/`transactionId`.

### Modified Capabilities
<!-- Nenhuma: web-transactions/web-categories não mudam de requisito. A transação
     materializada aparece na lista de transações no próximo carregamento, sem novo requisito. -->

## Impact

- **Front:** novos paths em `src/api/paths.ts` (`/api/recurring-templates`,
  `/api/recurring-templates/:id`, `/api/recurring-templates/:id/confirm`,
  `/api/recurring-occurrences`); nova feature `src/features/recurring/` (api + telas de
  templates e previstos); tipos `RecurringTemplate`, `RecurringOccurrence`,
  `CreateRecurringTemplateInput`, `ConfirmInput`; nova entrada de navegação em `App.tsx`
  (Recorrentes / Previstos).
- **Backend/API:** nenhuma mudança — endpoints já existem no CONTRACT.md §6.
- **Reuso:** cliente HTTP único (`apiGet/Post/Put/Delete`), tratamento central de
  401/404/400 e os helpers de dinheiro (`parseToCents`/`centsToInput`/`formatCents`)
  permanecem inalterados.
