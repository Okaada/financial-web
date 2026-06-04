## Why

Revert da change `2026-06-04-drop-investment-initial-value` que removeu `initialValue`
dos investimentos por engano. O campo é necessário e deve ser mantido.

## What Changes

Restaura `initialValue` em tipos, `InvestmentForm`, `InvestmentBatchScreen` e `InvestmentCard`.

## Capabilities

### Modified Capabilities
- `web-investments`: restaura `initialValue` no formulário e no cartão.
- `web-investments-batch`: restaura coluna de valor inicial na grade.
