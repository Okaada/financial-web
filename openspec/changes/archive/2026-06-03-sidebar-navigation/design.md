## Context

A navegação é por estado local em `App.tsx` (sem router). Hoje é uma app bar superior com
abas roláveis — apertada para 8 seções e ruim no mobile. O app é mobile-first, atrás de
auth, com CSP restritiva (sem recurso externo) e tema selecionável (claro/sistema/escuro)
já existente (`ThemeToggle`).

## Goals / Non-Goals

**Goals:**
- Sidebar profissional: fixa no desktop, drawer no mobile, com ícones por seção.
- Acessível (foco, `aria-current`, `Esc`/backdrop para fechar, alvos ≥ 44px).
- Zero recurso externo: ícones SVG inline.

**Non-Goals:**
- NÃO adicionar router nem mudar a mecânica de navegação por estado (`view`/`setView`).
- NÃO adicionar biblioteca de ícones/UI nem fonte de CDN.
- NÃO mudar comportamento de telas, endpoints, ou a CSP.

## Decisions

### 1. Shell de layout: sidebar + main

`App.tsx` passa a renderizar um shell `.app-shell` com `<Sidebar>` e `<main>`. No desktop a
sidebar é `position: sticky/fixed` à esquerda e o main tem a margem/َárea restante; no
mobile a sidebar é `position: fixed` fora da tela (`translateX(-100%)`) e entra como drawer
quando aberta, com um `.scrim` (backdrop) clicável. Um botão hambúrguer numa top bar fina só
aparece no mobile.

Estado: `const [navOpen, setNavOpen] = useState(false)` para o drawer. Trocar de seção chama
`setView` e `setNavOpen(false)`. `Esc` e clique no scrim fecham. Em telas largas o drawer/
scrim não se aplicam (CSS via media query), então `navOpen` é irrelevante no desktop.

Alternativa: router + rotas reais. Rejeitada — fora de escopo; a navegação por estado já é a
decisão do projeto (design D4).

### 2. Ícones: SVG inline próprios

`NavIcons.tsx` exporta um componente por seção (dashboard, transações, categorias,
recorrentes, previstos, investimentos, cartões, conta), todos como SVG inline com
`stroke="currentColor"`, `width/height` controlados por CSS, `aria-hidden` (o rótulo dá o
nome acessível). Sem dependência, sem CDN — coerente com o `ThemeToggle` (que já usa SVG
inline).

Alternativa: `lucide-react` (bundla, não busca externo). Rejeitada por ora — evita nova
dependência e mantém o controle/consistência; pode ser reconsiderada se o conjunto crescer.

### 3. Reuso do `ThemeToggle` e do logout

O `ThemeToggle` existente vai para o rodapé da sidebar; o botão "Sair" idem. Sem mudança de
lógica de tema/sessão.

### 4. Acessibilidade do drawer

A `nav` recebe `aria-label`. O item ativo recebe `aria-current="page"`. O drawer é fechável
por `Esc` (listener enquanto aberto) e por clique no scrim. O botão hambúrguer tem
`aria-label` e `aria-expanded`. Foco visível preservado (regra global existente). Respeita
`prefers-reduced-motion` (transição do drawer reduzida).

## Risks / Trade-offs

- **Manter 8 SVGs à mão** → Aceitável; são ícones simples de traço. Centralizados em
  `NavIcons.tsx`.
- **Conteúdo "pulando" ao trocar sidebar↔drawer no breakpoint** → Mitigação: layout via CSS
  grid/flex com media query única (≈900px); o main não depende de JS para o desktop.
- **Foco preso no drawer (focus trap)** → Escopo mínimo: fechar por `Esc`/scrim e devolver o
  foco ao botão; um focus-trap completo fica como melhoria futura, não bloqueia.

## Migration Plan

Mudança visual/navegacional. Remove os estilos `.appbar*` e adiciona `.app-shell`,
`.sidebar*`, `.scrim`, `.topbar` (mobile). Sem migração de dados, sem mudança de API/deploy.
Rollback = restaurar a app bar superior.

## Open Questions

- Sidebar colapsável (só ícones) no desktop? Fora de escopo agora; pode vir depois.
