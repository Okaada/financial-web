## 1. Mecânica de tema

- [x] 1.1 Criar `src/lib/theme.ts`: `type Theme = 'light'|'dark'|'system'`,
  `getStoredTheme()`, `applyTheme(theme)` (seta/remove `data-theme` na raiz),
  `setTheme(theme)` (persist em `localStorage` chave `fw-theme` + apply), `initTheme()`
  (aplica o persistido no boot). "system" segue o SO nativamente via `@media` (sem JS).
- [x] 1.2 Chamar `initTheme()` no topo de `src/main.tsx`, antes de `createRoot().render()`
  (sem script inline — preserva a CSP).

## 2. Tokens, temas e escala visual (index.css)

- [x] 2.1 Reestruturar o tema escuro: tokens claros em `:root`; tokens escuros aplicados em
  `:root[data-theme="dark"]` e, para "system", em
  `@media (prefers-color-scheme: dark) :root:not([data-theme="light"]):not([data-theme="dark"])`.
- [x] 2.2 Adicionar tokens de tipografia (`--text-xs`…`--text-xl`) e aplicar em
  `h1/h2/h3`, cards, metadados e estados, substituindo tamanhos avulsos; padronizar
  elevação via `--shadow-sm/md`.

## 3. App bar e controle de tema

- [x] 3.1 Criar `src/features/shell/ThemeToggle.tsx`: segmented control Claro/Sistema/
  Escuro com `aria-pressed`/`aria-label`, ícones SVG inline (sem recursos externos),
  estado inicial de `getStoredTheme()`, `onClick` → `setTheme`.
- [x] 3.2 Reestruturar a barra em `App.tsx` para app bar com 3 zonas (brand/título · abas
  roláveis · `ThemeToggle`), mantendo o botão "Sair".
- [x] 3.3 Estilos da app bar em `index.css`: fixa no topo, responsiva (abas com scroll
  horizontal no mobile, alvos ≥ 44px), foco visível.

## 4. Qualidade

- [x] 4.1 `npm run typecheck`, `npm run lint` e `npm run build` verdes; confirmar zero
  `fetch(` fora de `client.ts`, zero `dangerouslySetInnerHTML`, nenhum recurso externo
  novo, e que o JS não toca o cookie `fa_session`.
- [ ] 4.2 Verificação manual: alternar Claro/Sistema/Escuro reflete na hora e persiste após
  reload; "Sistema" acompanha o SO; responsivo de ~320px a desktop sem scroll horizontal;
  foco visível por teclado.
