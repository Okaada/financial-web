## Why

O campo "Saldo inicial" no formulário de conta não faz sentido para `kind=investment`:
o saldo de uma conta de investimento é a soma dos investimentos vinculados, não um
valor inicial. Exibir o campo confunde o usuário.

## What Changes

- `AccountForm`: quando `kind=investment`, o campo "Saldo inicial" é ocultado; o form
  envia `openingBalance: 0` automaticamente para esse tipo de conta.

## Capabilities

### Modified Capabilities
- `web-account`: campo `openingBalance` ocultado para `kind=investment`.
