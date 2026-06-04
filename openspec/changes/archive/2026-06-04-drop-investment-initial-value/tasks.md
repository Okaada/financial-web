## 1. Tipos TypeScript

- [x] 1.1 `src/api/types.ts` — `Investment`: remover campo `initialValue: number`.
  Atualizar o comentário de `totalInvested` para "centavos = soma dos aportes
  (derivado pelo backend, somente leitura)".
- [x] 1.2 `src/api/types.ts` — `CreateInvestmentInput`: remover `initialValue?: number`.
- [x] 1.3 `src/api/types.ts` — `UpdateInvestmentInput`: remover `initialValue: number`.

## 2. Formulário criar/editar (InvestmentForm)

- [x] 2.1 `InvestmentForm.tsx`: remover o estado `initialValue` (`useState`) e a
  inicialização `centsToInput(initial.initialValue)`.
- [x] 2.2 Remover a validação `parseToCentsSigned(initialValue)` e o erro associado
  ("Valor inicial inválido...").
- [x] 2.3 Remover o `<label>` e o `<input>` de "Valor inicial (pode ser negativo)".
- [x] 2.4 No modo `create`, remover `initialValue: cents` do objeto `body`
  (`CreateInvestmentInput`).
- [x] 2.5 No modo `edit`, remover `initialValue: cents` do objeto passado a `onUpdate`.

## 3. Grade de lote (InvestmentBatchScreen)

- [x] 3.1 `InvestmentBatchScreen.tsx` — interface `Row`: remover campo `initialValue: string`.
- [x] 3.2 `emptyRow`: remover `initialValue: ''` do objeto retornado.
- [x] 3.3 Função `toItem`: remover o bloco `parseToCentsSigned(row.initialValue)` e a
  checagem `if (initial === null) return null`; remover `initialValue: initial` do
  objeto `CreateInvestmentInput` retornado.
- [x] 3.4 Remover a coluna "Valor inicial" (`<label className="batch-cell">Valor inicial
  ...`) da grade de linhas.
- [x] 3.5 Atualizar a dica de tela (parágrafo `account-hint`) para remover a menção
  "Valor inicial em centavos (pode ser negativo)."
- [x] 3.6 Rever a condição de "linha preenchida" (`filledRows`): garantir que ela não
  dependa mais de `initialValue` — checar se `r.initialValue.trim() !== ''` ainda
  aparece e removê-lo caso exista.

## 4. Cartão de investimento (InvestmentCard)

- [x] 4.1 `InvestmentCard.tsx`: remover a figura "Inicial" — bloco `<span className=
  "invest-figure"><small>Inicial</small>{formatCents(investment.initialValue, ...)}</span>`.
- [x] 4.2 Atualizar o comentário de cabeçalho do arquivo (primeira linha de JSDoc)
  para remover a menção a `initialValue`.

## 5. Qualidade

- [x] 5.1 Rodar `npm run typecheck` — zero erros TypeScript.
- [x] 5.2 Rodar `npm run lint` — zero warnings/erros.
- [x] 5.3 Rodar `npm run build` — bundle gerado sem erros.
- [x] 5.4 Verificar manualmente (`grep -r initialValue src/`) que não há referência
  residual ao campo removido.
