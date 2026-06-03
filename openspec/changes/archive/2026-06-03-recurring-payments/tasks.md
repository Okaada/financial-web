## 1. Paths e tipos

- [x] 1.1 Adicionar paths em `src/api/paths.ts`: `RECURRING_TEMPLATES_PATH`, `RECURRING_OCCURRENCES_PATH`, helpers `recurringTemplatePath(id)` e `recurringConfirmPath(id)`
- [x] 1.2 Em `src/api/types.ts`: `RecurringTemplate`, `CreateRecurringTemplateInput` (`type, amount, currency, dayOfMonth, intervalMonths, startDate, endDate?, description?, categoryId?, active?`), `RecurringOccurrence` (`recurringTemplateId, competence, date, amount, currency, type, categoryId|null, confirmed, transactionId|null`) e `ConfirmInput` (`{ competence }`)

## 2. API de recorrentes

- [x] 2.1 Novo `src/features/recurring/api.ts`: `listTemplates({active?})`, `createTemplate(input)`, `updateTemplate(id, input)`, `deleteTemplate(id)`
- [x] 2.2 No mesmo arquivo: `listOccurrences({from, to})` (`GET /api/recurring-occurrences`) e `confirmOccurrence(templateId, { competence })` (`POST /:id/confirm`)

## 3. Templates: formulário e tela

- [x] 3.1 `RecurringTemplateForm` (criar + editar): campos `type/amount/currency/dayOfMonth/intervalMonths/startDate/endDate?/description?/categoryId?/active?`; `amount` via `parseToCents`/`centsToInput`; full replace no edit; tratar `400` (campo e categoria) e `404`
- [x] 3.2 `RecurringTemplatesScreen`: listar com filtro `active`; ações editar/excluir (excluir com confirmação, remover no 204); estados carregando/vazio/erro/sem-sessão

## 4. Previstos: tela e confirmação

- [x] 4.1 `RecurringOccurrencesScreen`: inputs `from`/`to` obrigatórios (validar antes de chamar; pré-preencher mês corrente); listar ocorrências; estados carregando/vazio/erro/sem-sessão; tratar `400` de intervalo
- [x] 4.2 Ação "Confirmar" por ocorrência: `POST /:id/confirm { competence }`; key `templateId:competence`; desabilitar enquanto em voo; refletir confirmada (transactionId) em `201` e `200`; ocorrência que já chega `confirmed: true` mostra vínculo, não botão; tratar `400` de competência

## 5. Navegação e integração

- [x] 5.1 Adicionar views "Recorrentes" e "Previstos" ao nav de `App.tsx` (estado local, sem router)
- [x] 5.2 Reusar `CategorySelect` no formulário de template (não arquivadas), mapeando `400` de categoria ao campo

## 6. Verificação

- [x] 6.1 `npm run typecheck`, `npm run lint` e `npm run build` verdes; confirmar que `fetch(` só existe em `src/api/client.ts`
- [ ] 6.2 Verificação manual (criar/editar/excluir template; listar previstos por período; confirmar e reconfirmar a mesma competência sem duplicar; 400 de intervalo/competência) contra backend real
