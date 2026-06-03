## Why

As telas funcionam, mas são visualmente cruas: sem hierarquia, cores duras, formulários e
listas sem ritmo, e a responsividade se resume a uma coluna centrada. Para um app de
finanças que o usuário abre com frequência (e 100% no celular), a aparência e a usabilidade
importam. Esta change dá ao front uma cara coesa — paleta clara e suave, layout responsivo
e componentes consistentes — sem mudar nenhum comportamento nem adicionar dependências.

## What Changes

- **Design system em CSS (tokens).** Introduz variáveis de tema em `:root` (cores suaves,
  espaçamento, raio, sombras, tipografia) e reescreve `src/index.css` em cima delas. Tema
  **claro e suave** por padrão; um modo escuro suave opcional via `prefers-color-scheme`.
- **Layout responsivo de verdade.** Container central com largura máxima, cabeçalho/nav
  fixo no topo (abas roláveis no mobile), e formulários que passam de 1 coluna (mobile) para
  2 colunas (telas largas). Continua mobile-first.
- **Componentes consistentes.** Estilo unificado para botões (primário / fantasma /
  perigo), inputs/selects, **cards**, linhas de lista, abas de navegação, **badges** e
  banners (aviso/erro/sucesso). Os estados explícitos já existentes (carregando, vazio,
  erro, sem-sessão) ganham apresentação clara (skeleton/spinner, ícone+texto no vazio).
- **Usabilidade e acessibilidade.** Foco visível, alvos de toque ≥ 44px, contraste AA,
  `prefers-reduced-motion`, e confirmação de exclusão mantida. Sem `dangerouslySetInnerHTML`
  (mantém a higiene de XSS).
- **Sem novas dependências e sem afrouxar a CSP.** Apenas CSS e ajustes de markup/classe;
  fontes do sistema (a CSP não permite recurso externo). Pequenos ajustes em `index.html`
  (`theme-color`, `lang`, suavização de fonte) sem abrir a política.

Fora de escopo: nenhuma mudança de fluxo/endpoint; nenhuma biblioteca de UI/CSS; nenhuma
alteração de regras das capacidades de dados (transações, categorias, recorrentes, auth).

## Capabilities

### New Capabilities
- `web-design-system`: a camada de apresentação do front — tokens de tema (claro/suave),
  layout responsivo, componentes consistentes e requisitos de usabilidade/acessibilidade
  que todas as telas seguem.

### Modified Capabilities
<!-- Nenhuma: esta change é puramente visual. As capacidades de comportamento
     (web-transactions, web-categories, web-recurring-*, web-session-auth) não mudam de
     requisito — só a apresentação. -->

## Impact

- **Front:** reescrita de `src/index.css` (com tokens); ajustes de markup/classe nas telas
  e formulários (`App.tsx`, `features/**/*.tsx`) para aplicar cards/containers/estados —
  **sem mudar lógica nem props de dados**; pequenos ajustes em `index.html`.
- **Backend/API:** nenhuma.
- **Bundle/segurança:** sem novas dependências; CSP inalterada; fontes do sistema (zero
  recurso externo).
- **Capacidades existentes:** comportamento idêntico — apenas a aparência muda.
