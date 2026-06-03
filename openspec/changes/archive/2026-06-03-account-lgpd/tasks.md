## 1. API e tipos

- [x] 1.1 Adicionar em `src/api/paths.ts`: `ACCOUNT_PATH`, `ACCOUNT_CONSENT_PATH`,
  `ACCOUNT_AUDIT_PATH` (sob `API_PREFIX`).
- [x] 1.2 Adicionar em `src/api/types.ts` os shapes da §9: `Consent`
  (`{ id, version, grantedAt }`) e `AuditEvent`
  (`{ id, eventType, metadata: Record<string, unknown>, createdAt }`), além do input de
  consentimento.
- [x] 1.3 Criar `src/features/account/api.ts` com `recordConsent(version)` (`apiPost`),
  `listAudit()` (`apiGet`, lê `{ items }`) e `deleteAccount()` (`apiDelete`, `204`) —
  nenhum `fetch(` aqui.

## 2. Tela de Conta

- [x] 2.1 `AccountScreen` com seção de **consentimento**: botão registrar a
  `CONSENT_VERSION` corrente, estado de submissão, erro `400` inline e confirmação de
  sucesso (exibe `version`/`grantedAt`).
- [x] 2.2 Seção de **auditoria**: busca `listAudit()` com estados loading/empty/error
  (retry); renderiza `eventType`, `createdAt` e `metadata` como pares chave/valor (texto
  via React, serialização segura de valores não-string) — sem `dangerouslySetInnerHTML`.
- [x] 2.3 Seção de **exclusão de conta**: confirmação forte (campo a digitar, ex.:
  `EXCLUIR`) habilitando o botão; ao `204`, reusa `redirectToLogin()` para encerrar a
  sessão; cópia clara de que é irreversível e self-only.
- [x] 2.4 `401` deixado para o tratamento central do cliente (não tratar localmente).

## 3. Navegação e estilo

- [x] 3.1 `App.tsx`: adicionar a view `account` em `VIEWS`/`SCREENS` (rótulo "Conta").
- [x] 3.2 Estilos reusando o design system existente (cards/seções/estados/botão danger)
  em `index.css`, responsivo claro/escuro; sem novas dependências.

## 4. Qualidade

- [x] 4.1 `npm run typecheck`, `npm run lint` (confirmar zero `fetch(` fora de
  `client.ts` e zero `dangerouslySetInnerHTML`) e `npm run build` verdes.
- [ ] 4.2 Verificação manual contra o backend real: registrar consentimento (201 +
  grantedAt), listar auditoria (estados), e excluir conta numa conta de teste (204 →
  redireciona ao login e a sessão não volta).
