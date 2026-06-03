// Number helpers for NON-cents quantities (CONTRACT.md §8). Miles are integer counts and
// the mileage rate is a decimal multiplier — NEVER format these with formatCents (which
// divides by 100). Kept separate from money.ts to make the unit explicit at the call site.

/** Format an integer mile count, e.g. formatMiles(22500) -> "22.500 milhas". */
export function formatMiles(miles: number): string {
  return `${new Intl.NumberFormat('pt-BR').format(miles)} milhas`
}

/** Format a decimal mileage rate (milesPerUnit), e.g. formatRate(1.5) -> "1,5". */
export function formatRate(rate: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(rate)
}

/**
 * Parse a user-entered decimal rate (>= 0). Accepts pt-BR ("1,5") or plain ("1.5").
 * Returns null when invalid/negative. NOT cents — returns the decimal value as-is.
 */
export function parseRate(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed === '') return null
  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return null
  return value
}
