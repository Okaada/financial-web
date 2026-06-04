## Why

O backend (change `2026-06-04-drop-investment-initial-value`) remove `initial_value`
da entidade `investment` e para de aceitar `initialValue` em criar/editar/batch. O
valor total de um investimento passa a vir exclusivamente dos **aportes**; não há mais
campo de "valor inicial". O front deve acompanhar essa simplificação:

1. Remover o campo "Valor inicial" do formulário de criação e edição.
2. Remover a coluna "Valor inicial" da grade de lote.
3. Remover o indicador "Inicial" do cartão de investimento (a figura separada de
   `initialValue` some; `totalInvested` continua exibido, agora == `totalContributed`).
4. Remover `initialValue` de todos os tipos TypeScript.

## What Changes

- `Investment` perde o campo `initialValue`; `totalInvested` continua (= soma de
  aportes).
- `CreateInvestmentInput` e `UpdateInvestmentInput` param de incluir `initialValue`.
- `InvestmentForm`: remove estado `initialValue`, o campo "Valor inicial" e a
  conversão `parseToCentsSigned` para ele.
- `InvestmentBatchScreen`: remove `initialValue` de `Row`, `emptyRow`, `toItem`, da
  grade e da dica de tela.
- `InvestmentCard`: remove a figura "Inicial" (`investment.initialValue`); `totalInvested`
  e `currentValue` continuam exibidos de forma distinta.

Fora de escopo: mudança no modelo de aportes, valuations, vínculo com conta, dashboard
ou qualquer outro aspecto da tela de investimentos.

## Capabilities

### New Capabilities
<!-- Nenhuma. -->

### Modified Capabilities
- `web-investments`: remove `initialValue` de criar/editar e do cartão de exibição.
- `web-investments-batch`: remove `initialValue` de cada linha da grade.

## Impact

- **Código**: `src/api/types.ts`; `InvestmentForm.tsx`; `InvestmentBatchScreen.tsx`;
  `InvestmentCard.tsx`.
- **API**: apenas deixa de enviar `initialValue` — compatível com o backend após o
  drop da coluna.
- **Segurança**: sem alteração (JS não toca cookie; sem segredo no bundle; CSP intacta).
