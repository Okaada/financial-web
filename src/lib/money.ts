// Money helpers (design.md D5; web-transactions "Formatação de valores em centavos").
// Amounts travel as integer cents. Formatting is the front's job; sending is always
// in cents. No implicit float<->money conversion outside these helpers.

/**
 * Format integer cents for display using the transaction's currency.
 * e.g. formatCents(1000, 'BRL') -> "R$ 10,00".
 */
export function formatCents(amount: number, currency: string): string {
  const value = amount / 100
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value)
  } catch {
    // Unknown/invalid currency code — fall back to a plain decimal + raw code.
    return `${value.toFixed(2)} ${currency}`
  }
}

/**
 * Parse a user-entered monetary string into integer cents for sending.
 * Accepts pt-BR style ("1.234,56"), plain ("1234.56"), or "10".
 * Returns null when the input is not a valid non-negative amount.
 */
export function parseToCents(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed === '') return null

  // Normalize to a dot-decimal number: drop thousands separators, treat comma as the
  // decimal separator when present.
  let normalized: string
  if (trimmed.includes(',')) {
    normalized = trimmed.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = trimmed
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null

  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return null

  // Round to avoid float artifacts (e.g. 10.10 * 100 === 1009.9999...).
  return Math.round(value * 100)
}

/**
 * Render integer cents as an editable input string for the form (pt-BR decimal comma),
 * e.g. centsToInput(1000) -> "10,00". Round-trips through parseToCents.
 */
export function centsToInput(amount: number): string {
  return (amount / 100).toFixed(2).replace('.', ',')
}
