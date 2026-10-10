import {
  addDays,
  addMonthsOnAnchor,
  dayOfMonthOf,
  type CalendarDay,
} from './calendarDay'

export const REPEAT_RHYTHMS = [
  'weekly',
  'monthly',
  'quarterly',
  'halfYearly',
  'yearly',
] as const

export type RepeatRhythm = (typeof REPEAT_RHYTHMS)[number]

export const DEFAULT_REPEAT_RHYTHM: RepeatRhythm = 'monthly'

export type Repetition = { rhythm: RepeatRhythm; anchorDay: number }

const FIRST_ANCHOR_DAY = 1

const LAST_ANCHOR_DAY = 31

const DAYS_PER_WEEK = 7

export function isRepeatRhythm(value: unknown): value is RepeatRhythm {
  return REPEAT_RHYTHMS.some((rhythm) => rhythm === value)
}

export function isAnchorDay(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= FIRST_ANCHOR_DAY &&
    value <= LAST_ANCHOR_DAY
  )
}

export function repetitionStartingOn(
  deadline: CalendarDay,
  rhythm: RepeatRhythm,
): Repetition {
  return { rhythm, anchorDay: dayOfMonthOf(deadline) }
}

export function isAnchoredOn(
  deadline: CalendarDay,
  anchorDay: number,
): boolean {
  return addMonthsOnAnchor(deadline, 0, anchorDay) === deadline
}

function steppedOnce(
  deadline: CalendarDay,
  { rhythm, anchorDay }: Repetition,
): CalendarDay {
  switch (rhythm) {
    case 'weekly':
      return addDays(deadline, DAYS_PER_WEEK)
    case 'monthly':
      return addMonthsOnAnchor(deadline, 1, anchorDay)
    case 'quarterly':
      return addMonthsOnAnchor(deadline, 3, anchorDay)
    case 'halfYearly':
      return addMonthsOnAnchor(deadline, 6, anchorDay)
    case 'yearly':
      return addMonthsOnAnchor(deadline, 12, anchorDay)
  }
}

export function nextDeadlineAfter(
  deadline: CalendarDay,
  repetition: Repetition,
  today: CalendarDay,
): CalendarDay {
  let next = steppedOnce(deadline, repetition)
  while (next <= today) next = steppedOnce(next, repetition)
  return next
}
