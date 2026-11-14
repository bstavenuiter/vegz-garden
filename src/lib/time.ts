export const WEEKS_PER_YEAR = 52

export const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
export const MONTHS_FULL = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

/** ISO week number (capped to 52 to keep the year grid simple). */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return Math.min(week, WEEKS_PER_YEAR)
}

/** Month (1-12) a week (1-52) mostly falls in. */
export function weekToMonth(week: number): number {
  const w = ((week - 1) % WEEKS_PER_YEAR + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
  return Math.min(12, Math.floor((w * 12) / WEEKS_PER_YEAR) + 1)
}

/** First week (1-52) of a month (1-12). */
export function monthStartWeek(month: number): number {
  return Math.round(((month - 1) * WEEKS_PER_YEAR) / 12) + 1
}

/** Absolute week index, so periods can cross the new year. */
export function absWeek(year: number, week: number): number {
  return year * WEEKS_PER_YEAR + week
}

export function fromAbs(abs: number): { year: number; week: number } {
  const year = Math.floor((abs - 1) / WEEKS_PER_YEAR)
  return { year, week: abs - year * WEEKS_PER_YEAR }
}

export function weekLabel(abs: number, currentYear?: number): string {
  const { year, week } = fromAbs(abs)
  const month = MONTHS[weekToMonth(week) - 1]
  const suffix = currentYear !== undefined && year !== currentYear ? ` ${year}` : ''
  return `wk ${week} · ${month}${suffix}`
}
