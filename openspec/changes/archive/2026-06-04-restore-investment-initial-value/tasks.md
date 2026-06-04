## 1. Revert

- [x] 1.1 `src/api/types.ts` — restaurar `Investment.initialValue`, `CreateInvestmentInput.initialValue`, `UpdateInvestmentInput.initialValue`
- [x] 1.2 `InvestmentForm.tsx` — restaurar estado `initialValue`, campo "Valor inicial", import `centsToInput`/`parseToCentsSigned`, bodies de create/edit
- [x] 1.3 `InvestmentBatchScreen.tsx` — restaurar interface `Row.initialValue`, `emptyRow`, `toItem`, coluna da grade, `parseToCentsSigned`, hint e `filledRows`
- [x] 1.4 `InvestmentCard.tsx` — restaurar figura "Inicial"

## 2. Verificação

- [x] 2.1 `npm run typecheck && npm run lint && npm run build` — limpos
