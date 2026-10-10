export type CalendarDay = string

export type CalendarDayParts = { year: number; month: number; day: number }

export type Step = 1 | -1

export const EARLIEST_YEAR = 2000

export const LATEST_YEAR = 2099

export const MONTHS_PER_YEAR = 12

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const CALENDAR_DAY_FORM = /^(\d{4})-(\d{2})-(\d{2})$/

const GERMAN_MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

function wrapped(value: number, count: number): number {
  return ((((value - 1) % count) + count) % count) + 1
}

function clamped(value: number, least: number, most: number): number {
  return Math.min(Math.max(value, least), most)
}

export function calendarDayOf(moment: Date): CalendarDay {
  const year = moment.getFullYear()
  const month = twoDigits(moment.getMonth() + 1)
  const day = twoDigits(moment.getDate())
  return `${year}-${month}-${day}`
}

export function partsOf(day: CalendarDay): CalendarDayParts {
  const [year, month, dayOfMonth] = day.split('-').map(Number)
  return { year, month, day: dayOfMonth }
}

export function calendarDayFrom({
  year,
  month,
  day,
}: CalendarDayParts): CalendarDay {
  return `${year}-${twoDigits(month)}-${twoDigits(day)}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function withDayCutToMonth(year: number, month: number, day: number) {
  return calendarDayFrom({
    year,
    month,
    day: Math.min(day, daysInMonth(year, month)),
  })
}

export function stepDayOfMonth(day: CalendarDay, step: Step): CalendarDay {
  const parts = partsOf(day)
  return calendarDayFrom({
    ...parts,
    day: wrapped(parts.day + step, daysInMonth(parts.year, parts.month)),
  })
}

export function stepMonth(day: CalendarDay, step: Step): CalendarDay {
  const parts = partsOf(day)
  const month = wrapped(parts.month + step, MONTHS_PER_YEAR)
  return withDayCutToMonth(parts.year, month, parts.day)
}

export function stepYear(day: CalendarDay, step: Step): CalendarDay {
  const parts = partsOf(day)
  const year = clamped(parts.year + step, EARLIEST_YEAR, LATEST_YEAR)
  return withDayCutToMonth(year, parts.month, parts.day)
}

export function addDays(day: CalendarDay, count: number): CalendarDay {
  const { year, month, day: dayOfMonth } = partsOf(day)
  const moment = new Date(
    Date.UTC(year, month - 1, dayOfMonth) + count * MILLISECONDS_PER_DAY,
  )
  return calendarDayFrom({
    year: moment.getUTCFullYear(),
    month: moment.getUTCMonth() + 1,
    day: moment.getUTCDate(),
  })
}

export function subtractMonths(day: CalendarDay, count: number): CalendarDay {
  const { year, month, day: dayOfMonth } = partsOf(day)
  const target = new Date(Date.UTC(year, month - 1 - count, 1))
  return withDayCutToMonth(
    target.getUTCFullYear(),
    target.getUTCMonth() + 1,
    dayOfMonth,
  )
}

export function isCalendarDay(value: unknown): value is CalendarDay {
  if (typeof value !== 'string') return false
  const form = CALENDAR_DAY_FORM.exec(value)
  if (form === null) return false
  const [year, month, day] = form.slice(1).map(Number)
  return (
    year >= EARLIEST_YEAR &&
    year <= LATEST_YEAR &&
    month >= 1 &&
    month <= MONTHS_PER_YEAR &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  )
}

export function monthNameOf(month: number): string {
  return GERMAN_MONTHS[month - 1]
}

function isInYearOf(day: CalendarDay, today: CalendarDay): boolean {
  return partsOf(day).year === partsOf(today).year
}

export function shortDayOf(day: CalendarDay, today: CalendarDay): string {
  const parts = partsOf(day)
  const dayAndMonth = `${twoDigits(parts.day)}.${twoDigits(parts.month)}.`
  return isInYearOf(day, today) ? dayAndMonth : `${dayAndMonth}${parts.year}`
}

function spokenDayAndMonthOf(day: CalendarDay): string {
  const parts = partsOf(day)
  return `${parts.day}. ${monthNameOf(parts.month)}`
}

export function spokenDayOf(day: CalendarDay, today: CalendarDay): string {
  return isInYearOf(day, today) ? spokenDayAndMonthOf(day) : fullDayOf(day)
}

export function fullDayOf(day: CalendarDay): string {
  return `${spokenDayAndMonthOf(day)} ${partsOf(day).year}`
}

export function shortDateOf(at: number): string {
  const moment = new Date(at)
  return `${twoDigits(moment.getDate())}.${twoDigits(moment.getMonth() + 1)}.`
}

export function spokenDateOf(at: number): string {
  const moment = new Date(at)
  return `${moment.getDate()}. ${GERMAN_MONTHS[moment.getMonth()]}`
}
