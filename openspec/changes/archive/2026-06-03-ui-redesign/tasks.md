## 1. Tokens e base (CSS)

- [x] 1.1 Definir tokens em `:root` no `src/index.css`: cores (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--primary`, `--primary-contrast`, `--success`, `--danger`), espaçamento (`--space-1..6`), raio, sombras e tipografia
- [x] 1.2 Estilos base: `body`/`.app` (fundo, fonte do sistema, antialias), `:focus-visible` com anel consistente, `@media (prefers-reduced-motion: reduce)`
- [x] 1.3 Variante escura suave via `@media (prefers-color-scheme: dark)` redefinindo os mesmos tokens (contraste AA preservado)

## 2. Layout e navegação

- [x] 2.1 Container central `.app` (max-width legível, padding responsivo) envolvendo a nav e a tela em `App.tsx`
- [x] 2.2 `.nav` sticky no topo; abas com `overflow-x:auto` no mobile; item ativo destacado; botão "Sair" como ação secundária
- [x] 2.3 Grid de formulário responsivo: 1 coluna no mobile → 2 colunas em `@media (min-width: 720px)`; erro/ações ocupam a linha inteira

## 3. Componentes

- [x] 3.1 Botões: `.btn` base + `.btn-primary` / `.btn-ghost` / `.btn-danger`; estados hover/disabled/focus; alvos ≥ 44px no mobile. Aplicar nas telas (salvar/adicionar/confirmar = primary; cancelar/limpar/sair = ghost; excluir = danger)
- [x] 3.2 Campos: input/select consistentes (padding, borda, foco), rótulos e mensagens de erro alinhados
- [x] 3.3 Cards/linhas de lista: estilizar `.transaction-list`/`.category-list` como cards legíveis (valor em destaque, metadados muted, ações alinhadas); receita/despesa com matiz suave
- [x] 3.4 Badges e banners: `.badge` (arquivada/inativo/confirmado) e `.banner` (aviso/erro/sucesso) consistentes; `.notice`/`.state-error` usando `.banner`

## 4. Estados e telas

- [x] 4.1 Estados visuais: `.spinner`/skeleton para carregando; vazio amigável (ícone+texto); erro com banner + "tentar novamente" — aplicado nas 4 telas
- [x] 4.2 Revisar markup das telas (`TransactionsScreen`, `CategoriesScreen`, `RecurringTemplatesScreen`, `RecurringOccurrencesScreen`) e formulários: aplicar classes de card/botão/estado SEM mudar lógica, props ou handlers

## 5. index.html

- [x] 5.1 Ajustes leves no `index.html`: `theme-color`, suavização de fonte; **sem** alterar a CSP nem adicionar recurso externo

## 6. Verificação

- [x] 6.1 `npm run typecheck`, `npm run lint` e `npm run build` verdes; confirmar que nenhuma lógica/endpoint mudou (só classes/markup/CSS) e que `fetch(` segue só em `src/api/client.ts`
- [ ] 6.2 Verificação manual: responsivo (≈360px e ≥720px), foco por teclado, estados loading/empty/error nas 4 telas, contraste claro/escuro
