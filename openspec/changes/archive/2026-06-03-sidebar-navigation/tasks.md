## 1. Ícones

- [x] 1.1 Criar `src/features/shell/NavIcons.tsx`: um componente de ícone SVG inline por
  seção (dashboard, transações, categorias, recorrentes, previstos, investimentos, cartões,
  conta) + um ícone de menu (hambúrguer) e de fechar, todos `stroke="currentColor"` e
  `aria-hidden`. Sem dependência/CDN.

## 2. Sidebar e shell de layout

- [x] 2.1 Criar `src/features/shell/Sidebar.tsx`: marca no topo, lista de seções (ícone +
  rótulo, `aria-current="page"` no ativo) recebendo `view`/`onNavigate`, e rodapé com
  `ThemeToggle` + botão "Sair". Props para fechar o drawer ao escolher uma seção.
- [x] 2.2 Reestruturar `App.tsx` para o shell `app-shell` (sidebar + main): estado
  `navOpen` para o drawer no mobile, top bar fina com hambúrguer (`aria-expanded`),
  `scrim` clicável, fechar por `Esc`/scrim/seleção; manter `CurrentScreen`.

## 3. Estilos (index.css)

- [x] 3.1 Remover os estilos da app bar superior (`.appbar*`) e adicionar `.app-shell`,
  `.sidebar*`, `.topbar` (mobile), `.scrim`, e os estilos dos itens de nav (ícone+rótulo,
  ativo, hover, foco). Usar os tokens existentes (cores/espaço/elevação/tipografia).
- [x] 3.2 Responsivo: sidebar fixa ≥ 900px (main à direita); drawer + scrim < 900px;
  alvos de toque ≥ 44px; transição do drawer respeitando `prefers-reduced-motion`.

## 4. Qualidade

- [x] 4.1 `npm run typecheck`, `npm run lint`, `npm run build` verdes; confirmar zero
  `fetch(` fora de `client.ts`, zero `dangerouslySetInnerHTML`, nenhum recurso externo novo
  (ícones SVG inline), e que o JS não toca o cookie `fa_session`.
- [ ] 4.2 Verificação manual: navegar por todas as seções (desktop e mobile); drawer abre/
  fecha por hambúrguer, scrim, `Esc` e ao escolher seção; item ativo destacado; foco visível
  por teclado; sem rolagem horizontal de ~320px a desktop; tema claro/escuro ok na sidebar.
