export type CalendarDay = string

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

export function calendarDayOf(moment: Date): CalendarDay {
  const year = moment.getFullYear()
  const month = twoDigits(moment.getMonth() + 1)
  const day = twoDigits(moment.getDate())
  return `${year}-${month}-${day}`
}

export function shortDateOf(at: number): string {
  const moment = new Date(at)
  return `${twoDigits(moment.getDate())}.${twoDigits(moment.getMonth() + 1)}.`
}

export function spokenDateOf(at: number): string {
  const moment = new Date(at)
  return `${moment.getDate()}. ${GERMAN_MONTHS[moment.getMonth()]}`
}
