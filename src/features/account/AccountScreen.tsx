// Account & LGPD screen (web-account spec). Three sections: record consent, read-only audit
// trail, and self-only account deletion. Explicit UI states per operation. A 401 is handled
// centrally by the HTTP client (redirect to login); this screen never handles it locally.
//
// XSS hygiene: audit `metadata` is rendered as escaped key/value text via React — never
// dangerouslySetInnerHTML. Non-string values are JSON-serialized to a safe string.

import { useCallback, useEffect, useState } from 'react'
import { ApiError, UnauthenticatedError } from '../../api/client'
import { redirectToLogin } from '../../api/auth'
import type { AuditEvent, Consent } from '../../api/types'
import { deleteAccount, listAudit, recordConsent } from './api'

// Current consent term version. A single constant for now; real versioning is a backend/
// product concern (see design Open Questions).
const CONSENT_VERSION = '1.0'

// The word the user must type to arm the irreversible account deletion.
const DELETE_CONFIRM_WORD = 'EXCLUIR'

type AuditStatus = 'loading' | 'ready' | 'error'

/** Render a metadata value as safe, escaped text (objects/arrays via JSON.stringify). */
function formatMetaValue(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function AccountScreen() {
  // Consent section.
  const [consentSubmitting, setConsentSubmitting] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [consent, setConsent] = useState<Consent | null>(null)

  // Audit section.
  const [auditStatus, setAuditStatus] = useState<AuditStatus>('loading')
  const [audit, setAudit] = useState<AuditEvent[]>([])
  const [auditError, setAuditError] = useState<string | null>(null)

  // Delete section.
  const [confirmWord, setConfirmWord] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadAudit = useCallback(async () => {
    setAuditStatus('loading')
    setAuditError(null)
    try {
      const items = await listAudit()
      setAudit(items)
      setAuditStatus('ready')
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setAuditError(err instanceof ApiError ? err.message : 'Erro ao carregar a auditoria.')
      setAuditStatus('error')
    }
  }, [])

  useEffect(() => {
    void loadAudit()
  }, [loadAudit])

  async function handleConsent() {
    setConsentError(null)
    setConsentSubmitting(true)
    try {
      const result = await recordConsent(CONSENT_VERSION)
      setConsent(result)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setConsentError(err instanceof ApiError ? err.message : 'Falha ao registrar o consentimento.')
    } finally {
      setConsentSubmitting(false)
    }
  }

  async function handleDelete() {
    setDeleteError(null)
    setDeleting(true)
    try {
      await deleteAccount() // 204; backend clears the session cookie
      // Session is over — leave the authenticated state exactly like logout does.
      redirectToLogin()
    } catch (err) {
      if (err instanceof UnauthenticatedError) return
      setDeleteError(err instanceof ApiError ? err.message : 'Falha ao excluir a conta.')
      setDeleting(false)
    }
  }

  const canDelete = confirmWord.trim() === DELETE_CONFIRM_WORD && !deleting

  return (
    <main className="screen">
      <h1>Conta</h1>

      {/* ---- Consent ---- */}
      <section className="card-section">
        <h3>Consentimento</h3>
        <p className="account-hint">
          Registra o seu consentimento para a versão atual dos termos (v{CONSENT_VERSION}).
        </p>
        {consent && (
          <p className="state state-empty" role="status">
            Consentimento v{consent.version} registrado em {consent.grantedAt}.
          </p>
        )}
        {consentError && (
          <p className="form-error" role="alert">
            {consentError}
          </p>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void handleConsent()}
            disabled={consentSubmitting}
          >
            {consentSubmitting ? 'Registrando…' : `Registrar consentimento (v${CONSENT_VERSION})`}
          </button>
        </div>
      </section>

      {/* ---- Audit trail ---- */}
      <section className="card-section">
        <h3>Trilha de auditoria</h3>

        {auditStatus === 'loading' && <p className="state state-loading">Carregando…</p>}

        {auditStatus === 'error' && (
          <div className="state state-error" role="alert">
            <p>{auditError}</p>
            <button type="button" onClick={() => void loadAudit()}>
              Tentar novamente
            </button>
          </div>
        )}

        {auditStatus === 'ready' && audit.length === 0 && (
          <p className="state state-empty">Nenhum evento de auditoria.</p>
        )}

        {auditStatus === 'ready' && audit.length > 0 && (
          <ul className="audit-list">
            {audit.map((event) => {
              const entries = Object.entries(event.metadata ?? {})
              return (
                <li key={event.id} className="audit-event">
                  <div className="audit-head">
                    <span className="audit-type">{event.eventType}</span>
                    <span className="audit-date">{event.createdAt}</span>
                  </div>
                  {entries.length > 0 && (
                    <dl className="audit-meta">
                      {entries.map(([key, value]) => (
                        <div key={key} className="audit-meta-row">
                          <dt>{key}</dt>
                          <dd>{formatMetaValue(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ---- Account deletion (LGPD) ---- */}
      <section className="card-section account-danger">
        <h3>Excluir conta</h3>
        <p className="account-hint">
          Esta ação é <strong>irreversível</strong> e exclui permanentemente a sua conta e
          todos os seus dados. Aplica-se somente à sua própria conta. Para confirmar, digite{' '}
          <code>{DELETE_CONFIRM_WORD}</code> abaixo.
        </p>
        <label className="account-confirm">
          Confirmação
          <input
            type="text"
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            placeholder={DELETE_CONFIRM_WORD}
            autoComplete="off"
            disabled={deleting}
          />
        </label>
        {deleteError && (
          <p className="form-error" role="alert">
            {deleteError}
          </p>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => void handleDelete()}
            disabled={!canDelete}
          >
            {deleting ? 'Excluindo…' : 'Excluir minha conta'}
          </button>
        </div>
      </section>
    </main>
  )
}
