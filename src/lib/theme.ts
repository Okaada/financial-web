// Theme selection (web-design-system). The user picks light / dark / system; the choice is
// persisted in localStorage and applied via a `data-theme` attribute on <html>. This is NOT
// the session cookie — the JS still never reads/writes `fa_session`.
//
// "system" (or no choice) follows prefers-color-scheme natively via CSS @media, so the
// first paint needs no JS for the default. initTheme() runs at the top of the bundle (no
// inline <script>) to apply a forced theme before render, keeping the CSP restrictive.

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'fw-theme'

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

/** The persisted choice, or 'system' when absent/invalid/unavailable. */
export function getStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return isTheme(raw) ? raw : 'system'
  } catch {
    // localStorage can throw (private mode / disabled) — fall back to system.
    return 'system'
  }
}

/** Reflect the theme on the root element. 'system' removes the attribute so CSS @media wins. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

/** Persist the choice and apply it immediately. */
export function setTheme(theme: Theme): void {
  try {
    if (theme === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Ignore storage failures — applying the theme still works for this session.
  }
  applyTheme(theme)
}

/** Apply the persisted theme at boot (called before render — no flash, no inline script). */
export function initTheme(): void {
  applyTheme(getStoredTheme())
}
