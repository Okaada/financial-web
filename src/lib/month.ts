// Current-month window for date-range queries (e.g. recurring occurrences need from/to).
// Built from the LOCAL components of `new Date()` — never from toISOString(), which is UTC
// and could roll into the wrong month near midnight at the edges of the month.

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function toYmd(year: number, month1: number, day: number): string {
  return `${year}-${pad2(month1)}-${pad2(day)}`
}

/** First and last calendar day of the current month as YYYY-MM-DD (local time). */
export function currentMonthRange(now: Date = new Date()): { from: string; to: string } {
  const year = now.getFullYear()
  const month0 = now.getMonth() // 0-based
  const lastDay = new Date(year, month0 + 1, 0).getDate() // day 0 of next month = last of this
  return {
    from: toYmd(year, month0 + 1, 1),
    to: toYmd(year, month0 + 1, lastDay),
  }
}
