## Context

O app já cobre §2 e §4–§8 do CONTRACT (transações, categorias, recorrentes,
investimentos, cartões/faturas), cada um na sua tela, com navegação por estado local em
`src/App.tsx` (`VIEWS` + `SCREENS`) — sem router. O cliente HTTP único é
`src/api/client.ts` (único arquivo com `fetch(`, enforced por ESLint). Cada feature tem
sua `api.ts`. Não existe endpoint de resumo/summary no CONTRACT: a única forma de montar
um panorama é compor leituras `GET` já existentes.

## Goals / Non-Goals

**Goals:**
- Uma tela inicial de Visão geral que reúna indicadores **já agregados pelo backend** e
  listas curtas, com atalhos para cada área.
- Reuso total das `api.ts` existentes; nenhuma rota nova; nenhum `fetch(` fora do
  cliente.
- Robustez: cada bloco carrega/erra de forma isolada (um bloco quebrado não derruba a
  tela).

**Non-Goals:**
- NÃO calcular totais cruzados ("patrimônio total", "gasto do mês") somando listas no
  cliente — não há endpoint de resumo e as listas podem ser parciais. Isso é gap de
  backend, registrado em Open Questions.
- NÃO adicionar router, gráficos pesados, ou novas dependências.
- NÃO persistir nada novo no cliente nem mexer no fluxo de auth/deploy.

## Decisions

### 1. Composição via `api.ts` existentes, numa `dashboard/api.ts` fina

Cada bloco busca pelo helper da feature dona do dado:
- Faturas: `cards/api.ts` → `listCards({ archived: false })`, depois `listInvoices(cardId)`
  por cartão; filtra `status === 'open'` no front.
- Previstos: `recurring/api.ts` → `listOccurrences({ from, to })` com a janela do mês.
- Investimentos: `investments/api.ts` → `listInvestments({ archived: false })`.
- Transações: `transactions/api.ts` → `listTransactions({})`, fatia as N mais recentes.

Alternativa considerada: um endpoint `/summary` no backend. Rejeitada **agora** porque
inventar endpoint é proibido; fica como gap proposto (Open Questions). A composição no
cliente é honesta desde que não fabrique agregados.

### 2. Faturas em aberto: fan-out por cartão, filtro de status no cliente

`GET /cards/:id/invoices` não aceita `?status=`. Então busca-se as faturas de cada
cartão não arquivado (em paralelo, `Promise.all`) e filtra-se `status === 'open'`. Isso
é **seleção de campo** sobre dados retornados, não recálculo de agregado: o `total`
exibido continua sendo o valor que o backend já agregou na fatura. Para evitar fan-out
excessivo, o bloco limita a exibição (ex.: top N por `dueDate`) e sinaliza quando há
mais — sem esconder silenciosamente que truncou.

Alternativa: pedir um filtro de status no backend — gap registrado, não bloqueia.

### 3. Janela do mês para previstos derivada de `new Date()`

`from` = `YYYY-MM-01`, `to` = último dia do mês corrente (`new Date(y, m+1, 0)`),
formatados como `YYYY-MM-DD` em horário local. Ambos obrigatórios pelo CONTRACT; a
ocorrência traz `competence`/`date`/`amount`/estado, exibidos direto.

### 4. Isolamento de falha por bloco

Cada bloco é um componente com seu próprio `{ status: 'loading'|'ready'|'error', data }`.
Um `404` é tratado como vazio/não-encontrado (recurso alheio é esperado), e só `401`
sobe — mas o `401` já é centralizado no `client.ts` (redireciona pro login), então os
blocos nunca tratam `401` localmente. Erros não-`401` mostram "tentar novamente" só
naquele bloco. Isso evita que, por exemplo, uma falha em cartões esconda as transações.

Alternativa: um único `Promise.all` para a tela toda. Rejeitada: um erro derrubaria tudo
e o `401` de um bloco competiria com os demais.

### 5. Visão geral como tela inicial

Adiciona-se a view `dashboard` em `VIEWS`/`SCREENS` de `App.tsx` e ela passa a ser o
estado inicial de navegação. Os atalhos "ver tudo" apenas trocam a view (mesma mecânica
de estado local já usada).

## Risks / Trade-offs

- **Fan-out de faturas (N cartões → N requisições)** → Mitigação: só cartões não
  arquivados, em paralelo; limitar exibição e sinalizar truncamento. Volume de cartões
  por usuário é pequeno na prática.
- **Tela "fraca" sem totais agregados** → Mitigação: exibir os agregados que o backend
  já dá (total por fatura, currentValue por investimento, totalMiles por cartão) e
  contagens; documentar o `/summary` como gap. Melhor uma tela honesta que uma com
  números potencialmente errados de listas parciais.
- **Derivação de datas em fuso local** → Mitigação: montar `from`/`to` a partir dos
  componentes locais de `new Date()` (ano/mês/dia), não de `toISOString()` (que é UTC e
  poderia trocar o mês perto da virada).

## Migration Plan

Mudança puramente aditiva no front: nova feature + nova view inicial. Sem migração de
dados, sem mudança de API/deploy. Rollback = remover a view `dashboard` e voltar a
inicial para `transactions`.

## Open Questions

- **Gap de backend**: um `GET /summary` (ou agregados como `GET /transactions/summary`,
  filtro `status` em `/cards/:id/invoices`) permitiria totais corretos sem fan-out nem
  risco de listas parciais. Proposto como evolução do CONTRACT; não implementado aqui.
- **N de itens por bloco**: definir os limites de exibição (ex.: 5 últimas transações,
  top faturas por vencimento) na implementação; mantê-los visíveis ("ver tudo") e
  sinalizar truncamento.
