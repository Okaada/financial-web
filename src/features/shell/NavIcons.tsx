// Inline SVG icons for navigation — no icon font, no CDN, no dependency (CSP-friendly).
// Stroke-based, sized via CSS (width/height here are defaults). Decorative: aria-hidden,
// the adjacent label provides the accessible name.

const ICON_PROPS: React.SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

export function DashboardIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

export function TransactionsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M7 4v16" />
      <path d="M4 7l3-3 3 3" />
      <path d="M17 20V4" />
      <path d="M20 17l-3 3-3-3" />
    </svg>
  )
}

export function CategoriesIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z" />
      <circle cx="8" cy="8" r="1.4" />
    </svg>
  )
}

export function RecurringIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

export function UpcomingIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 2.5v4M16 2.5v4" />
      <path d="M12 12.5v3l2 1.5" />
    </svg>
  )
}

export function InvestmentsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </svg>
  )
}

export function CardsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
      <path d="M2.5 9.5h19" />
      <path d="M6.5 15h4" />
    </svg>
  )
}

export function AccountIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}

export function MenuIcon() {
  return (
    <svg {...ICON_PROPS} width={24} height={24}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg {...ICON_PROPS} width={24} height={24}>
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  )
}
