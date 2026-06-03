## Context

Última área grande do CONTRACT.md (§8). O front já tem cliente HTTP único
(`apiGet/Post/Put/Delete`, 401/404/400 centrais), helpers de dinheiro
(`parseToCents`/`centsToInput`/`formatCents`), navegação por estado local, design system em
CSS e o padrão de feature por pasta. §8 traz quatro sub-domínios: cartões (CRUD), taxas de
milhas (append-only), milhas acumuladas, e faturas com máquina de estados `open → closed →
paid` e total/milhas derivados. Há também o elo com transações: associar um lançamento a um
cartão via `cardId`.

Restrições herdadas: nada de `fetch` fora do client; 404 de recurso alheio é esperado; render
via React (sem `dangerouslySetInnerHTML`); `name` do cartão chega decifrado. **Atenção
crítica de unidade:** `total` e `amount` são centavos; `milesPerUnit` é **multiplicador
decimal** (não centavos); `miles`/`totalMiles` são **contagens inteiras** (não centavos).

## Goals / Non-Goals

**Goals:**

- Cartões: listar/criar/editar (`closingDay` imutável)/arquivar; taxas de milhas
  (append-only); milhas acumuladas.
- Faturas: listar por cartão, detalhar (com transações), fechar/pagar com transições
  condicionais ao `status`.
- Elo nas transações: seletor de cartão opcional no formulário.
- Formatação correta por unidade (centavos vs. decimal vs. inteiro).

**Non-Goals:**

- Dashboard e admin.
- Criar/reabrir faturas pela UI (são lazy/automáticas no backend — a UI só reflete).
- Editar/excluir taxas (append-only).
- Cálculo de milhas no front (vem derivado do backend).

## Decisions

### D1 — Unidades: helpers separados para milhas/taxa (NÃO usar formatCents)

`formatCents` continua só para centavos (`total`, `amount`). Para milhas/taxa, novos helpers
em `src/lib/number.ts`: `formatMiles(n)` (inteiro com separador pt-BR + "milhas"),
`formatRate(n)` (decimal), `parseRate(input)` (decimal ≥ 0, aceita vírgula/ponto).

- **Por que:** é o erro mais provável aqui — tratar milha/taxa como centavos divide por 100.
  Helpers dedicados tornam a unidade explícita no call site.
- **Trade-off:** mais um arquivo de lib; barato e evita bug de unidade.

### D2 — `closingDay` imutável: somente-leitura na edição

No criar, `closingDay` e `dueDay` são editáveis (1–31). No editar, `closingDay` é exibido
como somente-leitura e o `PUT` envia apenas `{ name?, dueDay? }`.

- **Por que:** evita o `400` de closing_day imutável por construção; o usuário ainda vê o
  valor.

### D3 — Faturas: a UI reflete estado, nunca cria/reabre

A UI não tem ação de criar fatura. Fechar/pagar são as únicas transições, oferecidas conforme
o `status` (`open`→Fechar; `closed`→Pagar; `paid`→nada). Em `400` de transição inválida
(corrida com reabertura automática), exibe a mensagem e **re-busca** a fatura para
re-sincronizar.

- **Por que:** a criação/reabertura é responsabilidade do backend (lazy + auto-reopen);
  espelhar evita estado divergente. O re-fetch no 400 cobre a corrida (a fatura pode ter
  reaberto entre carregar e agir).

### D4 — Navegação cartões → faturas → detalhe por estado local (sem rota)

Uma tela `CardsScreen` lista cartões; selecionar um cartão (estado `selectedCardId`) mostra
suas faturas, rates e milhas; selecionar uma fatura (`selectedInvoiceId`) carrega o detalhe
(`GET /invoices/:id`) com as transações. Tudo por estado local, sem router (coerente com as
outras telas).

- **Por que:** app atrás de auth, sem deep-link; drill-down inline evita biblioteca de rota.
- **Trade-off:** estado de navegação some no refresh — aceitável (recarrega do backend).

### D5 — Detalhe da fatura: re-busca dedicada (não confiar no item da lista)

O detalhe usa `GET /api/invoices/:id` (que inclui `transactions`), não o objeto da lista de
faturas (que não traz transações). Após fechar/pagar, atualiza a fatura a partir da resposta
da ação.

- **Por que:** a lista e o detalhe têm shapes diferentes (só o detalhe traz `transactions`);
  buscar por id garante dados completos e atuais.

### D6 — Seletor de cartão na transação (capacidade web-transactions, ADDED)

O `TransactionForm` ganha um `CardSelect` (reusa o padrão do `CategorySelect`): carrega
`GET /api/cards?archived=false`, opção "sem cartão" (valor `''`). No `POST`, omite `cardId`
quando vazio; no `PUT` (full replace), envia `cardId: null` quando vazio. `400` de cartão no
corpo → erro no campo de cartão.

- **Por que:** é o elo que faz faturas terem conteúdo. Espelha o tratamento já existente de
  `categoryId` (D6 da change de transações), incluindo o `400`-por-id-no-corpo.
- **Trade-off:** modifica a capacidade `web-transactions` (delta ADDED) e acopla o form a um
  segundo seletor — aceitável e consistente.

## Risks / Trade-offs

- **Confundir unidades (milha/taxa como centavos)** → mitigação: D1, helpers dedicados; nunca
  passar `miles`/`milesPerUnit` por `formatCents`.
- **Transição inválida por reabertura automática** → mitigação: D3, tratar `400` + re-buscar
  a fatura.
- **Detalhe sem transações se usar o item da lista** → mitigação: D5, sempre `GET
  /invoices/:id`.
- **Escopo grande** → mitigação: dividir em `web-cards` e `web-invoices` (+ delta de
  transações); implementar por sub-domínio.
- **`cardId` arquivado entre carregar e submeter** → mitigação: D6 trata o `400` de cartão.

## Open Questions

- Mostrar "milhas previstas" de faturas ainda não pagas (a fatura traz `miles` derivado)?
  Assumido: exibir o `miles` que o backend já manda por fatura, e o `totalMiles` (pagas) à
  parte — sem somar/derivar no front.
