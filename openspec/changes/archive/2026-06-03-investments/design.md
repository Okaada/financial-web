## Context

O front tem cliente HTTP único (`apiGet/Post/Put/Delete`, 401/404/400 centrais), helpers de
dinheiro (`parseToCents`/`centsToInput`/`formatCents`), navegação por estado local e um
design system em CSS. A Finance API expõe investimentos em CONTRACT.md §7: investimento com
agregados (`totalContributed`, `currentValue` em centavos), criar/renomear/arquivar, e dois
sub-recursos append-only — contribuições (aportes) e valuations (marcações de valor). Esta
change adiciona a tela de Investimentos reusando tudo isso, sem mudar backend.

Restrições herdadas: nada de `fetch` fora do client; valores em centavos (formatar na
exibição, enviar em centavos); 404 de recurso alheio é esperado; render via React (sem
`dangerouslySetInnerHTML`); `name`/`note` chegam decifrados (o front não cifra/decifra).

## Goals / Non-Goals

**Goals:**

- Tela de Investimentos: listar (com agregados do backend), criar, renomear, arquivar.
- Registrar aporte e registrar valor (valuation), refletindo agregados autoritativos.
- Respeitar a taxonomia fixa de `type` e a regra "arquivado rejeita aporte/valuation".
- Reusar client, money helpers, design system e o padrão de navegação local.

**Non-Goals:**

- Cartões, dashboard, admin.
- Histórico persistente de aportes/valuations (não há endpoint — ver D2).
- Cálculo de rentabilidade/ganho no front (poderia derivar de currentValue −
  totalContributed, mas fica fora desta change para não introduzir "conta no front").

## Decisions

### D1 — O front NÃO soma agregados: re-busca o investimento após aporte/valuation

`totalContributed` e `currentValue` vêm agregados do backend. O `POST` de aporte retorna a
Contribution (não o investimento) e o de valuation retorna a Valuation; nenhum traz o novo
agregado. Por isso, após um aporte/valuation bem-sucedido, o app faz `GET
/api/investments/:id` e substitui o item na lista pelo recurso atualizado.

- **Por que:** respeita "o front não soma, só exibe" e garante valores autoritativos
  (inclusive quando uma valuation antiga não altera o `currentValue`, que é o do `recordedOn`
  mais recente).
- **Alternativa rejeitada:** somar `totalContributed += amount` / assumir `currentValue =
  valuation.currentValue` — contraria a regra e erra quando a data não é a mais recente.

### D2 — Evolução é limitada à sessão (não há endpoint de histórico)

O CONTRACT não tem `GET` de contribuições/valuations: cada `POST` devolve só o objeto
criado. A UI pode acumular, **em estado local da sessão**, as valuations que o próprio
usuário registrou e mostrá-las como uma mini-lista de evolução, sempre deixando claro que
não é histórico persistente (some no reload). O número "oficial" é o `currentValue` do
investimento.

- **Por que:** ser fiel ao contrato sem inventar endpoint. Dá algum feedback de evolução sem
  prometer histórico que o backend não fornece.
- **Alternativa rejeitada:** inventar `GET .../valuations` — proibido (gap de backend).

### D3 — Detalhe/ações por investimento expandido na própria lista (sem rota)

Cada card de investimento pode expandir para revelar as ações (renomear, arquivar, novo
aporte, nova valuation) e a mini-evolução da sessão, controlado por estado local
(`expandedId`). Sem router, coerente com as outras telas.

- **Por que:** uma tela só, app atrás de auth; expandir inline evita navegação extra.

### D4 — Type por `select` da taxonomia fixa; sem texto livre

O campo `type` é um `select` com exatamente `renda_fixa|acoes|fii|cripto|outro` e rótulos
legíveis (ex.: "Renda fixa", "Ações", "FII", "Cripto", "Outro"). `currency` default `BRL`.

- **Por que:** a taxonomia é fechada no backend; o select evita 400 por construção.

### D5 — Arquivado esconde aporte/valuation na UI; 400 ainda tratado

Itens arquivados não exibem os botões de aporte/valuation. Mesmo assim, se um `400` de
arquivado voltar (corrida entre arquivar e submeter), a UI o trata como erro do formulário.

- **Por que:** evita o caso comum e ainda é defensivo (o backend é a autoridade).

### D6 — Formulários de aporte/valuation reusam money/date e o design system

Aporte: `amount` via `parseToCents` (inteiro > 0), `occurredOn` (date), `note?`. Valuation:
`currentValue` via `parseToCents`, `recordedOn` (date). Erros mapeados ao formulário; sem
perder input.

- **Por que:** consistência com transações/recorrentes; menos superfície nova.

## Risks / Trade-offs

- **Esquecer de re-buscar e exibir agregado desatualizado** → mitigação: D1 sempre re-busca
  o investimento após aporte/valuation.
- **Usuário esperar histórico completo** → mitigação: D2 deixa explícito que a evolução é só
  da sessão; o valor oficial é o `currentValue`.
- **`currentValue: null`** → mitigação: placeholder "sem marcação", nunca `R$ 0,00` fabricado.
- **Arquivado entre carregar e submeter** → mitigação: D5 trata o `400` de arquivado.
- **Conta no front** (rentabilidade) → fora de escopo; não derivar agregados.

## Open Questions

- Mostrar "ganho/perda" (currentValue − totalContributed) seria útil, mas é "conta no
  front". Assumido: **não** nesta change (só exibir os dois agregados); reavaliar se o
  usuário pedir, idealmente com o backend fornecendo o derivado.
