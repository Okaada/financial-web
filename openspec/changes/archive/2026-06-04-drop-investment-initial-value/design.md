## Context

O backend remove `initial_value` da tabela `investments` e para de aceitar
`initialValue` nos inputs. O front tem referências ao campo em quatro lugares:
`types.ts`, `InvestmentForm`, `InvestmentBatchScreen` e `InvestmentCard`. A mudança
é puramente subtrativa — nenhum novo endpoint, nenhuma lógica nova.

## Goals / Non-Goals

**Goals:**
- Apagar todas as referências a `initialValue` no front.
- Garantir que `typecheck` / `lint` / `build` passem sem erros.

**Non-Goals:**
- Qualquer ajuste em aportes, valuations, dashboard ou vínculo com conta.

## Decisions

**1. Remover `initialValue` de `Investment`, `CreateInvestmentInput` e
`UpdateInvestmentInput`.** `totalInvested` continua (vem do backend = soma de
aportes). *Alternativa: manter o campo como opcional* — rejeitada; campo morto
no tipo causa confusão e o backend não o retorna mais.

**2. `InvestmentCard` remove apenas a figura "Inicial"; `totalInvested` e
`currentValue` continuam distintos.** Sem reordenação de layout.

**3. `InvestmentBatchScreen`: a dica sobre "valor inicial em centavos" é removida;
a validação local (`parseToCentsSigned` sobre `initialValue`) some junto com o
campo.** A lógica de "linha preenchida" (`filledRows`) passa a considerar apenas
`name` e `currency` para detectar linhas em uso (sem `initialValue`).

## Open Questions

- Nenhuma. A mudança segue o backend ponto a ponto.
