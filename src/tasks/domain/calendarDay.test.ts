import { describe, expect, it } from 'vitest'
import { calendarDayOf, shortDateOf, spokenDateOf } from './calendarDay'

const fifthOfMarchMorning = new Date(2026, 2, 5, 9, 0)
const fifthOfMarchBeforeMidnight = new Date(2026, 2, 5, 23, 59)

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
