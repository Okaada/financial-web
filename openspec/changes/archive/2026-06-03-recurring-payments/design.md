## Context

O front já tem o cliente HTTP único (`apiGet/Post/Put/Delete`, 401/404/400 centrais), os
helpers de dinheiro (`parseToCents`/`centsToInput`/`formatCents`) e navegação por estado
local em `App.tsx`. A Finance API expõe recorrentes em CONTRACT.md §6: templates (CRUD),
ocorrências calculadas (`GET /recurring-occurrences`, `from`/`to` obrigatórios, não
persistidas) e confirmação idempotente (`POST /recurring-templates/:id/confirm`). Esta
change adiciona duas telas reusando tudo isso, sem mudança de backend.

Restrições herdadas: nada de `fetch` fora do client; valores em centavos (formatar na
exibição, enviar em centavos); 404 de recurso alheio é esperado (não revela existência);
render via React (sem `dangerouslySetInnerHTML`).

## Goals / Non-Goals

**Goals:**

- CRUD de templates recorrentes (criar/editar/listar com filtro `active`/excluir).
- Tela de Previstos: listar ocorrências de um período (`from`/`to`) e confirmar competência.
- Refletir corretamente a idempotência: ocorrência confirmada mostra o vínculo, não um
  segundo botão de confirmar.
- Reusar client, money helpers e o padrão de navegação local.

**Non-Goals:**

- Investimentos, cartões, dashboard, admin.
- Editar/excluir a **transação** materializada (já coberto na tela de Transações).
- Calcular ocorrências no front — elas vêm prontas do backend.

## Decisions

### D1 — Confirmar usa a `competence` da ocorrência; estado vem da resposta e do `confirmed`

O botão "Confirmar" envia `{ competence }` da própria ocorrência. A UI considera "confirmada"
quando a ocorrência chega com `confirmed: true` **ou** após uma confirmação bem-sucedida
(`201`/`200`) — em ambos os casos passa a exibir o `transactionId` retornado/recebido.

- **Por que:** a idempotência é do backend; a UI só precisa não oferecer confirmar duas
  vezes e mostrar o vínculo. Tratar `201` e `200` igual (ambos trazem a transação) evita
  lógica frágil de "primeira vez vs. repetida".
- **Trade-off:** ocorrências não têm id próprio (não são persistidas); a chave de UI é
  `recurringTemplateId + competence` (ver D2).

### D2 — Chave de lista das ocorrências: `templateId:competence`

Como ocorrências não têm `id`, a `key` do React e o controle de "qual está confirmando" usam
`${recurringTemplateId}:${competence}`.

- **Por que:** é o par único por ocorrência (o mesmo par que o backend usa para idempotência)
  e evita keys instáveis por índice.

### D3 — `from`/`to` obrigatórios validados no front antes de chamar

A tela de Previstos exige as duas datas antes de enviar; também trata o `400` do backend
(`from>to`/range grande) exibindo a `message`.

- **Por que:** evita uma chamada garantidamente inválida e dá feedback imediato; o `400`
  ainda é tratado como defesa em profundidade. Default sugerido: mês corrente
  (primeiro→último dia) para reduzir atrito — mas sem inventar dado, só pré-preencher.

### D4 — Reuso de um único formulário de template para criar e editar

Como em transações (change anterior, D2), um só `RecurringTemplateForm` cria (`POST`) e edita
(`PUT`, mesmo corpo). `amount` via `parseToCents`/`centsToInput`.

- **Por que:** consistência com o padrão já adotado e menos superfície de UI.

### D5 — Erro `400` de categoria mapeado ao campo de categoria

No template, `categoryId` inválido/arquivado/não-próprio retorna `400` (id no corpo, como em
transações). A UI mapeia esse `400` ao campo de categoria, deixando reescolher; demais `400`
são erro de formulário.

- **Por que:** mesma regra do CONTRACT.md §1 já tratada em transações; reusar o padrão.

### D6 — Navegação: adicionar entradas "Recorrentes" e "Previstos" ao nav local

`App.tsx` ganha duas views novas além de Transações/Categorias, mantendo o `view: string` em
estado local (sem router).

- **Por que:** coerente com D4 da change de deploy/navegação; o app é atrás de auth, sem
  deep-link.

## Risks / Trade-offs

- **Ocorrência sem id próprio** → mitigação: chave `templateId:competence` (D2).
- **Confirmar duas vezes (corrida de UI)** → mitigação: desabilitar o botão enquanto a
  confirmação está em voo e marcar confirmada na resposta; o backend é idempotente de
  qualquer forma (não duplica).
- **Intervalo inválido em Previstos** → mitigação: validação local de `from`/`to` + trato do
  `400` (D3).
- **Full replace no `PUT` de template apagando campos** → mitigação: montar o corpo do
  recurso carregado (como em transações), preservando o que o form não edita.
- **`active` no create/edit** → opcional no corpo; default do backend quando omitido. A UI
  expõe um toggle simples; se omitido, não força valor.

## Open Questions

- Há `GET /recurring-templates/:id` no CONTRACT, mas a edição parte do item já em lista —
  não é necessário um fetch extra por id (assumido: editar a partir do objeto da lista).
