## 1. Scaffold do projeto

- [x] 1.1 Inicializar projeto Vite + React + TypeScript (`package.json`, `tsconfig`, `index.html`, `src/main.tsx`, `src/App.tsx`)
- [x] 1.2 Configurar o dev-server para fazer proxy de `/api` → backend local (mesmo-origin em dev, sem mudar código do cliente)
- [x] 1.3 Adicionar lint/format básico e script de build; garantir que nenhum segredo/URL absoluta de API entra no bundle

## 2. Cliente HTTP único

- [x] 2.1 Criar `src/api/client.ts` como único módulo que chama `fetch` contra `/api/*`, com `credentials: 'same-origin'` e `Content-Type: application/json`
- [x] 2.2 Implementar parse do envelope `{ error: { code, message } }` retornando erro estruturado `{ status, code, message }` (com fallback genérico quando o corpo não é parseável)
- [x] 2.3 Tratar `204 No Content` como sucesso sem parse de corpo
- [x] 2.4 Tratar `401` de forma central: disparar login (navegação top-level) e não resolver a chamada com dados
- [x] 2.5 Classificar `404` como erro estruturado `not_found` (sem disparar login, sem ser "erro de sistema")
- [x] 2.6 Definir tipos compartilhados (`Transaction`, `Category`, `ApiError`) a partir dos shapes do CONTRACT.md

## 3. Sessão e autenticação

- [x] 3.1 Implementar `login()` via navegação top-level para `GET /api/auth/login` (`window.location.assign`), sem `fetch`
- [x] 3.2 Implementar `logout()` via `POST /api/auth/logout` (cliente HTTP) seguido de redirect ao login
- [x] 3.3 Criar o gate de autenticação no carregamento do app: sondar endpoint protegido (reusando a carga de `GET /api/transactions`); `401` ⇒ login, `2xx` ⇒ autenticado
- [x] 3.4 Renderizar estado `no-session` apenas via tratamento central de `401` (sem lógica de `401` por tela)

## 4. Helpers de dinheiro

- [x] 4.1 Implementar `formatCents(amount, currency)` para exibição (centavos inteiros → unidade monetária)
- [x] 4.2 Implementar `parseToCents(input)` para o formulário (entrada do usuário → centavos inteiros)

## 5. Tela de transações — listagem

- [x] 5.1 Buscar `GET /api/transactions` e ler itens de `{ items: [...] }`
- [x] 5.2 Renderizar cada transação com `type`, valor formatado (`formatCents`), `currency`, `occurredOn` e `description`
- [x] 5.3 Implementar estados explícitos: carregando, vazio (lista `[]`), erro não-`401` (com retry)
- [x] 5.4 Tratar texto livre (`description`/`externalRef`) como dado, nunca como HTML (sem `dangerouslySetInnerHTML`)

## 6. Tela de transações — seletor de categoria

- [x] 6.1 Buscar `GET /api/categories?type=expense` e ler itens de `{ items: [...] }` ao abrir o formulário
- [x] 6.2 Popular o seletor com categorias (não arquivadas); permitir opção "sem categoria"

## 7. Tela de transações — criação

- [x] 7.1 Construir o formulário (`type`, valor, `currency`, `occurredOn`, categoria opcional, `description?`)
- [x] 7.2 Submeter `POST /api/transactions` com `amount` em centavos (via `parseToCents`); omitir `categoryId` quando não selecionado
- [x] 7.3 Em `201`, atualizar a lista incluindo a nova transação
- [x] 7.4 Tratar `400 bad_request` de campo: exibir `message` junto ao formulário sem perder dados digitados
- [x] 7.5 Tratar `400` de `categoryId` inválido/arquivado/não-pertencente como erro de validação do campo de categoria (exibir `message`, permitir trocar)

## 8. Verificação

- [x] 8.1 Verificar que nenhum componente chama `fetch` diretamente (somente via `src/api/client.ts`)
- [ ] 8.2 Verificar manualmente os fluxos: login redirect, logout, sessão expirada (`401`→login), listar (com itens/vazio), criar (sucesso/`400`)
- [x] 8.3 Conferir aderência ao CONTRACT.md (endpoints, shapes, status) e ausência de endpoints inventados
