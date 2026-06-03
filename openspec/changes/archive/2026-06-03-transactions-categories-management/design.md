## Context

O front já tem o cliente HTTP único (`src/api/client.ts`) com `apiGet`/`apiPost`,
tratamento central de 401 (→login), 404 (`not_found`) e o envelope de erro
`{ error: { code, message } }`. A tela de transações lista e cria; o seletor de categoria
lê `GET /api/categories?type=expense&archived=false`. Esta change completa o CRUD de
transações (editar/excluir/filtrar) e adiciona a gestão de categorias — tudo contra
endpoints que já existem no CONTRACT.md (§4, §5), sem mudança de backend.

Restrições herdadas: nada de `fetch` fora do client (regra eslint `no-restricted-globals`);
valores em centavos (formatar na exibição, enviar em centavos); 404 de recurso alheio é
esperado (não revela existência); higiene de XSS (render via React, sem
`dangerouslySetInnerHTML`).

## Goals / Non-Goals

**Goals:**

- Editar (`PUT`) e excluir (`DELETE`) transações; filtros de listagem por
  `type`/`categoryId`/`cardId`/`from`/`to`.
- Tela de categorias: listar (filtro `type`/`archived`), criar, renomear (só `name`),
  arquivar (sem hard delete).
- Manter o client como **único ponto de `fetch`**, adicionando `apiPut`/`apiDelete` no
  mesmo padrão (credentials same-origin, 401/404/400 centrais).
- Reusar o formulário de transação para criar e editar.

**Non-Goals:**

- Recorrentes, investimentos, cartões, dashboard, admin.
- Tela de cartões: `cardId` é preservado nos corpos e exposto como filtro, mas não há
  seleção de cartão por UI nesta change (campo opcional, omitido se vazio).
- Roteamento client-side com biblioteca (router): navegação entre Transações e Categorias
  é resolvida com estado local simples (ver D4).

## Decisions

### D1 — Estender o client com `apiPut`/`apiDelete` (não abrir exceção à regra do fetch)

Adicionar `apiPut`/`apiDelete` a `src/api/client.ts`, reusando o mesmo `request<T>` (que já
trata 401/404/204/envelope). `DELETE` retorna `204` → `request` já resolve `undefined`.

- **Por que:** mantém o client como o único lugar com `fetch` (a regra eslint não muda) e o
  tratamento central de erros vale de graça para os novos métodos.
- **Alternativa rejeitada:** chamadas `fetch` direto nas features — quebra a regra e
  duplica o tratamento de 401/erro.

### D2 — `PUT` é full replace: enviar o corpo completo a partir do recurso atual

A edição parte do recurso existente e envia o corpo inteiro (`type, amount, currency,
occurredOn, categoryId|null, cardId|null, description?`). Campos não preenchidos viram
`null` explicitamente quando aplicável (categoria/cartão), não omitidos.

- **Por que:** o endpoint é full replace (CONTRACT §4) — omitir um campo o apaga. Montar o
  corpo a partir do recurso carregado evita perda acidental de `cardId`/`categoryId`.
- **Trade-off:** o formulário precisa carregar/forwardar campos que ele não edita
  diretamente (ex.: `cardId`), preservando-os no submit de edição.

### D3 — Renomear categoria envia só `name`; `type` nunca vai no corpo

O `PUT /api/categories/:id` recebe apenas `{ name }`. A UI de renome não expõe `type` (é
imutável; enviá-lo → `400`).

- **Por que:** alinhar a UI à regra do backend evita o 400 por construção, em vez de só
  tratá-lo depois.

### D4 — Navegação entre telas por estado local (sem router)

Uma navegação mínima (ex.: `view: 'transactions' | 'categories'` em `App.tsx`) alterna as
duas telas. Edição/criação dentro de cada tela usa estado local (modo `list` vs `form`).

- **Por que:** são duas telas e o app é 100% atrás de auth, sem deep-link/SEO. Um router
  seria peso sem ganho agora.
- **Alternativa considerada:** `react-router`. Adiada — reintroduzir se surgirem
  deep-links/mais telas.

### D5 — Atualização otimista mínima da lista, com recarregamento como verdade

Após criar/editar/excluir/arquivar, refletir a mudança na lista local a partir da resposta
(o recurso retornado, ou remoção no `204`). Filtros aplicados disparam um relist real.

- **Por que:** resposta imediata sem complexidade de cache; o backend continua sendo a
  fonte da verdade quando há relist (filtros, refresh).

### D6 — Seletor de categoria continua oferecendo só não arquivadas; 400 ainda é tratado

O seletor lista `archived=false`. Mesmo assim, criar/editar transação trata `400` de
categoria (id arquivado/inválido no corpo) como erro do campo — defesa em profundidade
(ex.: categoria arquivada por outra aba entre o load e o submit).

- **Por que:** a UI evita o caso comum, mas não confia só nisso; o backend é a autoridade.

## Risks / Trade-offs

- **Full replace apagando campos não editados (ex.: `cardId`)** → mitigação: D2 monta o
  corpo do `PUT` a partir do recurso carregado, preservando o que o form não edita.
- **Categoria arquivada entre load e submit** → mitigação: D6 trata o `400` de categoria no
  create e no update, deixando reescolher.
- **Exclusão acidental** → mitigação: confirmação explícita antes do `DELETE` (spec).
- **Sem router: estado de tela perdido no refresh** → aceitável (app atrás de auth, sem
  deep-link); o refresh recarrega a lista do backend.
- **404 mal interpretado como erro de sistema** → mitigação: já coberto pelo client
  (`not_found` estruturado, não dispara login); as telas renderizam "não encontrado".

## Open Questions

- Filtro por `cardId` aparece na UI sem tela de cartões para escolher o id — nesta change
  fica como campo de texto/oculto até existir gestão de cartões? (Assumido: expor `from`/
  `to`/`type`/`categoryId` na UI; `cardId` suportado na query mas sem seletor dedicado.)
