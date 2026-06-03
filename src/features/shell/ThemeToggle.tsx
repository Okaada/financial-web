// Theme control for the app bar: a 3-way segmented control (light / system / dark). Icons
// are inline SVG (no external resources — CSP-friendly). The selected option is reflected
// with aria-pressed and each has an aria-label for screen readers.

import { useState } from 'react'
import { getStoredTheme, setTheme, type Theme } from '../../lib/theme'

const OPTIONS: { value: Theme; label: string; icon: React.JSX.Element }[] = [
  {
    value: 'light',
    label: 'Tema claro',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="12" y1="2.5" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="21.5" />
          <line x1="2.5" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="21.5" y2="12" />
          <line x1="5.2" y1="5.2" x2="6.9" y2="6.9" />
          <line x1="17.1" y1="17.1" x2="18.8" y2="18.8" />
          <line x1="18.8" y1="5.2" x2="17.1" y2="6.9" />
          <line x1="6.9" y1="17.1" x2="5.2" y2="18.8" />
        </g>
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'Tema do sistema',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <rect
          x="3"
          y="4.5"
          width="18"
          height="12"
          rx="1.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <line x1="8.5" y1="20" x2="15.5" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Tema escuro',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path
          d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"
          fill="currentColor"
        />
      </svg>
    ),
  },
]

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  function choose(next: Theme) {
    setTheme(next)
    setThemeState(next)
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Tema">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={theme === opt.value ? 'theme-option active' : 'theme-option'}
          aria-label={opt.label}
          aria-pressed={theme === opt.value}
          onClick={() => choose(opt.value)}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}
