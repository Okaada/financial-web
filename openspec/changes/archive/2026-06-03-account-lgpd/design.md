## Context

§9 do CONTRACT expõe três rotas protegidas sob `/account`: `POST /account/consent`,
`GET /account/audit` e `DELETE /account` (self-only, hard delete, limpa `fa_session`). O
front já tem o cliente HTTP único (`src/api/client.ts`, 401 central → `redirectToLogin()`),
o fluxo de logout (`src/api/session.ts`) e a navegação por estado local em `App.tsx`. Falta
só a interface dessas três operações — a última área não coberta.

## Goals / Non-Goals

**Goals:**
- Uma tela **Conta** com as três operações §9, cada uma com estados de UI próprios.
- Reuso total do cliente único e do `redirectToLogin()` (nada de novo para auth/sessão).
- Exclusão de conta com **confirmação forte** (não basta um clique) e encerramento de
  sessão após o `204`.
- Auditoria renderizada como **dados estruturados**, preservando a higiene de XSS.

**Non-Goals:**
- NÃO gerenciar versões de termos de consentimento no front (a "versão corrente" é uma
  constante simples; versionamento real é do backend/produto).
- NÃO revogar sessão no servidor além do que o backend já faz (o JWT stateless vale até
  `exp`; isso é limitação conhecida do CONTRACT, não escopo deste front).
- NÃO inventar exclusão por id nem endpoints de export (não há no CONTRACT).

## Decisions

### 1. Uma feature `account/` com `api.ts` fino

`account/api.ts` expõe `recordConsent(version)`, `listAudit()` e `deleteAccount()`,
mapeando 1:1 para as rotas via `apiPost`/`apiGet`/`apiDelete`. Novas constantes em
`paths.ts`: `ACCOUNT_PATH = /api/account`, `ACCOUNT_CONSENT_PATH = /api/account/consent`,
`ACCOUNT_AUDIT_PATH = /api/account/audit`. Novos tipos em `types.ts`: `Consent`,
`AuditEvent` (com `metadata: Record<string, unknown>`).

Alternativa: embutir as chamadas na screen. Rejeitada — mantém o padrão das outras
features (api.ts isola endpoints/shapes).

### 2. Exclusão: confirmação forte + tratar `204` como fim de sessão

A exclusão é irreversível, então a UI pede uma confirmação deliberada: o botão de excluir
só habilita quando o usuário digita uma palavra de confirmação (ex.: `EXCLUIR`). Após o
`204`, o backend já limpou o cookie; o front reusa `redirectToLogin()` para sair do estado
autenticado — exatamente como o logout faz após limpar a sessão. Nada de "soft state" pós
exclusão.

Alternativa: `window.confirm()`. Rejeitada — fraco para uma ação destrutiva e irreversível;
um campo de confirmação explícito é mais deliberado e testável.

### 3. Auditoria como dados estruturados (XSS)

`metadata` vem do backend já restrito a chaves allowlisted, mas o front mantém a regra:
renderiza pares chave/valor com texto via React (auto-escapado). **Zero**
`dangerouslySetInnerHTML`. Valores não-string são serializados de forma segura
(`JSON.stringify` para objetos/arrays) e exibidos como texto.

### 4. Estados por operação

Auditoria tem seu próprio loading/empty/error (com retry). Consentimento e exclusão têm
estado de submissão + mensagem de erro/sucesso inline. `401` nunca é tratado localmente —
o cliente já redireciona central.

## Risks / Trade-offs

- **Exclusão acidental** → Mitigação: confirmação forte por digitação; cópia clara de que
  é irreversível e self-only.
- **Sessão "viva" após exclusão (JWT até exp)** → É limitação do backend (CONTRACT §2/§11),
  não deste front; mesmo assim limpamos o estado e redirecionamos. Documentado, fora de
  escopo resolver aqui.
- **`metadata` com formato inesperado** → Mitigação: serialização segura para texto; nunca
  interpretar como HTML.

## Migration Plan

Mudança aditiva no front: nova feature + nova view no menu. Sem migração de dados, sem
mudança de API/deploy. Rollback = remover a view `account` e a feature.

## Open Questions

- **Versão do termo de consentimento**: por ora uma constante no front (ex.:
  `CONSENT_VERSION`). Se o produto evoluir para múltiplas versões/locale, virá do backend —
  fora de escopo agora.
