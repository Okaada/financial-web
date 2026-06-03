## Why

§9 do CONTRACT (Conta & LGPD) é a última área sem cobertura no front. O usuário não tem
como registrar consentimento, consultar a própria trilha de auditoria, nem exercer o
direito de exclusão da conta (LGPD) — tudo isso já existe no backend (`/account/*`) e só
falta a interface. Sem isso o app fica incompleto do ponto de vista de privacidade/LGPD.

## What Changes

- Nova tela **Conta** reunindo as três operações de `/account` (§9):
  - **Registrar consentimento** via `POST /api/account/consent` `{ version }` → `201`
    `{ id, version, grantedAt }`. A UI envia a versão corrente do termo e confirma o
    registro (exibindo `grantedAt`).
  - **Trilha de auditoria** via `GET /api/account/audit` → `{ items: [{ id, eventType,
    metadata, createdAt }] }`. Lista somente-leitura dos eventos da própria conta;
    `metadata` é um objeto de chaves allowlisted (sem texto livre/segredos) — renderizado
    como dados estruturados, **nunca** via `dangerouslySetInnerHTML`.
  - **Excluir conta (LGPD)** via `DELETE /api/account` → `204` + backend limpa o
    `fa_session`. É **self-only** (sem id), **hard delete** irreversível. A UI exige
    confirmação forte (ex.: digitar uma palavra) e, após o `204`, trata a sessão como
    encerrada → redireciona para o login (mesma mecânica do logout).
- `App.tsx` ganha a view `account` no menu.
- Estados de UI explícitos por operação (carregando, vazio, erro com "tentar novamente",
  sem-sessão via 401 central). Como cada chamada é protegida, `401` cai no tratamento
  central existente.

## Capabilities

### New Capabilities
- `web-account`: tela de Conta/LGPD que registra consentimento, exibe a trilha de
  auditoria (somente-leitura, render estruturado) e executa a exclusão de conta self-only
  com confirmação forte e encerramento de sessão, sempre via o cliente HTTP único e sem
  inventar endpoints.

### Modified Capabilities
<!-- Nenhuma capability existente muda de requisito. Adicionar a view 'account' ao menu é
     detalhe de navegação do App, não mudança de requisito das telas existentes. -->

## Impact

- **Código**: nova feature `src/features/account/` (screen + `api.ts` + tipos da §9 em
  `src/api/types.ts`); novas constantes em `src/api/paths.ts`
  (`ACCOUNT_PATH`, `ACCOUNT_CONSENT_PATH`, `ACCOUNT_AUDIT_PATH`); `App.tsx` ganha a view
  `account`. Reuso de `redirectToLogin()` após a exclusão.
- **API**: apenas rotas já existentes no CONTRACT (§9). Reuso do cliente único
  `src/api/client.ts` (único arquivo com `fetch(`); `apiPost`/`apiGet`/`apiDelete`.
- **Sem segredos, sem novas dependências, sem mudança de deploy.** Mantém CSP restritiva
  e higiene de XSS (auditoria renderizada como dados, não HTML).
