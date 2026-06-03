## Why

O visual atual funciona, mas é "jovem": o tema escuro só segue o sistema operacional (sem
controle do usuário), a barra de navegação é só uma fileira de abas sem identidade, e a
escala tipográfica/elevação é ad-hoc. O usuário pediu um layout mais maduro mantendo três
não-negociáveis: **responsivo, padrões de UI, e modo claro/escuro**. Esta mudança eleva a
camada de apresentação sem tocar em comportamento, endpoints ou na CSP.

## What Changes

- **Tema claro/escuro selecionável pelo usuário** (não só automático):
  - Controle de tema com 3 opções — **Claro / Sistema / Escuro** — na barra superior.
  - Persistência da escolha em `localStorage` (NÃO é o cookie de sessão; o JS continua sem
    tocar no `fa_session`). Aplicado via atributo `data-theme` no `<html>`.
  - **Sem flash de tema**: o tema é aplicado no início do bundle (`main.tsx`), antes do
    render — **sem** adicionar script inline no HTML, preservando a CSP restritiva
    (`script-src 'self'`, sem `'unsafe-inline'`).
  - `data-theme="system"` (padrão) segue `prefers-color-scheme`; `light`/`dark` forçam.
- **Barra superior (app bar) mais madura e responsiva**: identidade/título à esquerda, abas
  de navegação ao centro, controle de tema à direita; fixa no topo; no mobile as abas
  rolam horizontalmente sem quebrar o layout; alvos de toque acessíveis.
- **Escala visual madura**: tokens de tipografia (xs→xl) e de elevação aplicados de forma
  consistente em títulos, cards e estados, substituindo tamanhos/sombsras avulsos.
- **Sem regressão de acessibilidade/segurança**: foco visível mantido, `prefers-reduced-
  motion` respeitado, dados livres continuam como texto via React (sem
  `dangerouslySetInnerHTML`), CSP permanece restritiva (sem recurso externo, sem fonte de
  CDN — segue stack de fontes do sistema).

## Capabilities

### New Capabilities
<!-- Nenhuma capability nova: é evolução da camada de apresentação existente. -->

### Modified Capabilities
- `web-design-system`: o requisito de tema passa de "escuro só via `prefers-color-scheme`"
  para **tema selecionável pelo usuário (claro/sistema/escuro)** com persistência e sem
  flash; adiciona requisitos de **app bar responsiva com controle de tema** e de **escala
  visual madura (tipografia + elevação)**.

## Impact

- **Código**: novo `src/lib/theme.ts` (tipo `Theme`, get/apply/persist), inicialização do
  tema no topo de `src/main.tsx`, novo componente `ThemeToggle` na barra de `App.tsx`,
  e reestruturação dos tokens/temas + app bar + escala tipográfica em `src/index.css`.
  `index.html` ganha apenas o ajuste do `<meta name="theme-color">` (sem script inline).
- **API**: nenhuma. Sem endpoints, sem rede.
- **Sem novas dependências, sem mudança de deploy, sem alteração de fluxo.** CSP e higiene
  de XSS preservadas.
