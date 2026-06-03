## Context

A camada de apresentação (`web-design-system`) já tem tokens em `:root`, layout responsivo,
componentes e estados, mas o tema escuro só segue `prefers-color-scheme` (sem controle do
usuário) e a barra é uma fileira de abas. A CSP é restritiva: `default-src 'self'` (logo
`script-src` herda `'self'`, **sem** `'unsafe-inline'` para scripts; `style-src` permite
`'unsafe-inline'`). Não há fontes/recursos externos (CSP-friendly). Esta mudança é só
visual/UX.

## Goals / Non-Goals

**Goals:**
- Tema **selecionável** (claro/sistema/escuro), persistido, sem flash, sem enfraquecer a CSP.
- App bar madura e responsiva com controle de tema acessível.
- Escala tipográfica e de elevação consistentes via tokens.

**Non-Goals:**
- NÃO adicionar bibliotecas de UI, fontes de CDN, ou qualquer recurso externo.
- NÃO mudar comportamento, fluxos, endpoints, nem a estrutura de navegação por estado local.
- NÃO reescrever cada tela — o CSS é central, então a maior parte do polimento é em
  `index.css` + um toggle no `App`.

## Decisions

### 1. `data-theme` na raiz + tokens em 3 camadas

`documentElement` recebe `data-theme = "light" | "dark" | "system"` (ou ausente = system).
O CSS resolve o tema efetivo:

```
:root { /* tokens claros (default) */ }

/* "sistema" (sem forçar) segue o SO */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="dark"]) { /* tokens escuros */ }
}

/* forçado */
:root[data-theme="dark"] { /* tokens escuros */ }
```

Assim: `light` força claro (default), `dark` força escuro, `system`/ausente segue o SO. A
lista de tokens escuros é duplicada nos dois seletores (forçado vs system) — é o preço de
suportar "system" **sem JS** via `@media`; mantém-se num único trecho do arquivo para
clareza.

Alternativa: uma classe `.dark` togglada só por JS. Rejeitada — "system" exigiria JS para o
primeiro paint e quebraria o no-flash sem script; o `@media` resolve nativamente.

### 2. Sem flash, sem script inline (preserva a CSP)

O tema é aplicado no **topo de `main.tsx`** (`initTheme()`), que roda antes de
`createRoot().render()`. Como `main.tsx` é o bundle servido por `'self'`, não há script
inline no HTML — a CSP segue `script-src 'self'` **sem** `'unsafe-inline'`.

Trade-off: para um usuário que **forçou** um tema oposto ao do SO, pode haver uma reconci-
liação de ~1 frame no fundo antes do módulo executar (o `@media` pinta o tema do SO até o
`data-theme` ser setado). Para o padrão ("system") não há flash algum. Optou-se por isso em
vez de adicionar um hash de script inline à CSP — priorizando a CSP intacta, que é uma
restrição permanente do projeto.

Alternativa: script inline no `<head>` + hash `sha256` no `script-src`. Rejeitada — adiciona
manutenção frágil do hash e flexibiliza a CSP; o ganho (eliminar 1 frame em caso de tema
forçado) não compensa.

### 3. `theme.ts` isolado

`src/lib/theme.ts`: `type Theme = 'light'|'dark'|'system'`; `getStoredTheme()`,
`applyTheme(theme)` (seta/remoção do atributo na raiz), `setTheme(theme)` (persist + apply),
`initTheme()` (aplica o persistido no boot), e uma subscrição opcional a mudanças do SO para
o caso "system". Chave `localStorage` `fw-theme`. `localStorage` é permitido (não é o cookie
de sessão; o JS continua sem tocar `fa_session`).

### 4. `ThemeToggle` como segmented control acessível

Três botões (Claro/Sistema/Escuro) com `aria-pressed`, rótulos via `aria-label`, ícones
inline SVG (sem emojis/recursos externos). Vive na app bar. Estado vem de `useState`
inicializado por `getStoredTheme()`; `onClick` chama `setTheme` e atualiza o estado.

### 5. App bar e escala de tokens

Reestrutura `.nav` para uma app bar com 3 zonas (brand / abas roláveis / toggle). Novos
tokens de tipografia (`--text-xs … --text-xl`) e reuso dos de elevação (`--shadow-sm/md`)
aplicados a títulos, cards e à barra fixa. Mantém alvos de toque ≥ 44px e foco visível.

## Risks / Trade-offs

- **Duplicação dos tokens escuros (forçado vs system)** → Mitigação: manter os dois blocos
  adjacentes e comentados como "fonte única do tema escuro".
- **Reconciliação de 1 frame em tema forçado** → Aceito conscientemente para não enfraquecer
  a CSP (ver Decisão 2); imperceptível no caso padrão.
- **`prefers-reduced-motion`** → Transições novas (hover/realce) respeitam a regra global já
  existente.

## Migration Plan

Mudança aditiva/visual: novos arquivos `theme.ts`/`ThemeToggle`, init no `main.tsx`, e CSS.
Sem migração de dados, sem mudança de API/deploy. Rollback = remover o toggle/init e reverter
o CSS (o `@media prefers-color-scheme` volta a ser o único caminho do escuro).

## Open Questions

- Nenhuma bloqueante. Eventual evolução: lembrar a preferência por usuário no backend — fora
  de escopo (e não há endpoint no CONTRACT).
