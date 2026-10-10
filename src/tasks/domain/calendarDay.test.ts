import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonthsOnAnchor,
  calendarDayFrom,
  calendarDayOf,
  dayOfMonthOf,
  daysInMonth,
  fullDayOf,
  isCalendarDay,
  monthNameOf,
  partsOf,
  shortDateOf,
  shortDayOf,
  spokenDateOf,
  spokenDayOf,
  stepDayOfMonth,
  stepMonth,
  stepYear,
  subtractMonths,
} from './calendarDay'

const fifthOfMarchMorning = new Date(2026, 2, 5, 9, 0)
const fifthOfMarchBeforeMidnight = new Date(2026, 2, 5, 23, 59)
const today = '2026-10-10'

describe('calendarDayOf', () => {
  it('writes the local calendar day with leading zeros', () => {
    expect(calendarDayOf(fifthOfMarchMorning)).toBe('2026-03-05')
  })

  it('stays on the local calendar day shortly before midnight', () => {
    expect(calendarDayOf(fifthOfMarchBeforeMidnight)).toBe('2026-03-05')
  })
})

describe('shortDateOf', () => {
  it('shows day and month with leading zeros', () => {
    expect(shortDateOf(fifthOfMarchBeforeMidnight.getTime())).toBe('05.03.')
  })
})

describe('spokenDateOf', () => {
  it('names the day and the German month', () => {
    expect(spokenDateOf(fifthOfMarchBeforeMidnight.getTime())).toBe('5. März')
  })

  it('names October', () => {
    expect(spokenDateOf(new Date(2026, 9, 10, 9, 0).getTime())).toBe(
      '10. Oktober',
    )
  })
})

describe('partsOf and calendarDayFrom', () => {
  it('splits a calendar day into its parts', () => {
    expect(partsOf('2026-03-05')).toEqual({ year: 2026, month: 3, day: 5 })
  })

  it('joins the parts with leading zeros', () => {
    expect(calendarDayFrom({ year: 2026, month: 3, day: 5 })).toBe('2026-03-05')
  })

  it('gets back the calendar day it split', () => {
    expect(calendarDayFrom(partsOf('2027-01-09'))).toBe('2027-01-09')
  })
})

describe('daysInMonth', () => {
  it.each([
    [2026, 2, 28],
    [2028, 2, 29],
    [2026, 4, 30],
    [2026, 12, 31],
  ])('counts %i-%i as %i days', (year, month, count) => {
    expect(daysInMonth(year, month)).toBe(count)
  })
})

describe('stepDayOfMonth', () => {
  it.each([
    ['2026-10-17', 1, '2026-10-18'],
    ['2026-11-30', 1, '2026-11-01'],
    ['2026-11-01', -1, '2026-11-30'],
    ['2026-02-28', 1, '2026-02-01'],
  ] as const)('steps %s by %i to %s', (day, step, stepped) => {
    expect(stepDayOfMonth(day, step)).toBe(stepped)
  })
})

describe('stepMonth', () => {
  it.each([
    ['2026-10-17', 1, '2026-11-17'],
    ['2026-12-17', 1, '2026-01-17'],
    ['2026-01-17', -1, '2026-12-17'],
    ['2026-01-31', 1, '2026-02-28'],
    ['2026-10-31', 1, '2026-11-30'],
  ] as const)('steps %s by %i to %s', (day, step, stepped) => {
    expect(stepMonth(day, step)).toBe(stepped)
  })
})

describe('stepYear', () => {
  it.each([
    ['2026-10-17', 1, '2027-10-17'],
    ['2028-02-29', 1, '2029-02-28'],
    ['2099-06-15', 1, '2099-06-15'],
    ['2000-06-15', -1, '2000-06-15'],
  ] as const)('steps %s by %i to %s', (day, step, stepped) => {
    expect(stepYear(day, step)).toBe(stepped)
  })
})

describe('addDays', () => {
  it.each([
    ['2026-10-10', 7, '2026-10-17'],
    ['2026-12-28', 7, '2027-01-04'],
    ['2026-10-24', 7, '2026-10-31'],
  ] as const)('adds to %s %i days giving %s', (day, count, added) => {
    expect(addDays(day, count)).toBe(added)
  })
})

describe('subtractMonths', () => {
  it.each([
    ['2026-10-17', 1, '2026-09-17'],
    ['2026-03-31', 1, '2026-02-28'],
    ['2027-02-15', 3, '2026-11-15'],
    ['2028-02-29', 12, '2027-02-28'],
  ] as const)('takes from %s %i months giving %s', (day, count, result) => {
    expect(subtractMonths(day, count)).toBe(result)
  })
})

describe('dayOfMonthOf', () => {
  it('finds the day within its month', () => {
    expect(dayOfMonthOf('2026-10-05')).toBe(5)
  })
})

describe('addMonthsOnAnchor', () => {
  it.each([
    ['2026-01-31', 1, 31, '2026-02-28'],
    ['2028-01-31', 1, 31, '2028-02-29'],
    ['2026-02-28', 1, 31, '2026-03-31'],
    ['2026-11-30', 3, 30, '2027-02-28'],
    ['2028-02-29', 12, 29, '2029-02-28'],
    ['2026-11-15', 3, 15, '2027-02-15'],
  ] as const)(
    'adds to %s %i months on day %i giving %s',
    (day, months, anchorDay, result) => {
      expect(addMonthsOnAnchor(day, months, anchorDay)).toBe(result)
    },
  )
})

describe('isCalendarDay', () => {
  it('accepts an existing day', () => {
    expect(isCalendarDay('2026-10-17')).toBe(true)
  })

  it.each(['2026-02-31', '2026-1-5', '1999-12-31', '2100-01-01', '', 17, null])(
    'rejects %o',
    (value) => {
      expect(isCalendarDay(value)).toBe(false)
    },
  )
})

describe('shortDayOf', () => {
  it('leaves out the year of the running year', () => {
    expect(shortDayOf('2026-10-17', today)).toBe('17.10.')
  })

  it('shows the year of a later year', () => {
    expect(shortDayOf('2027-01-17', today)).toBe('17.01.2027')
  })

  it('shows the year of an earlier year', () => {
    expect(shortDayOf('2025-10-08', today)).toBe('08.10.2025')
  })
})

describe('spokenDayOf', () => {
  it('names the day and month of the running year', () => {
    expect(spokenDayOf('2026-10-17', today)).toBe('17. Oktober')
  })

  it('names the year of another year', () => {
    expect(spokenDayOf('2027-01-17', today)).toBe('17. Januar 2027')
  })
})

describe('fullDayOf', () => {
  it('always names the year', () => {
    expect(fullDayOf('2026-10-17')).toBe('17. Oktober 2026')
  })
})

describe('monthNameOf', () => {
  it('names October', () => {
    expect(monthNameOf(10)).toBe('Oktober')
  })
})
