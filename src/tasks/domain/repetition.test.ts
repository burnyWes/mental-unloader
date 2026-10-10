import { describe, expect, it } from 'vitest'
import {
  DEFAULT_REPEAT_RHYTHM,
  isAnchorDay,
  isAnchoredOn,
  isRepeatRhythm,
  nextDeadlineAfter,
  REPEAT_RHYTHMS,
  repetitionStartingOn,
  type RepeatRhythm,
} from './repetition'

describe('repeat rhythms', () => {
  it('offers the five rhythms from the shortest to the longest', () => {
    expect(REPEAT_RHYTHMS).toEqual([
      'weekly',
      'monthly',
      'quarterly',
      'halfYearly',
      'yearly',
    ])
  })

  it('starts with monthly', () => {
    expect(DEFAULT_REPEAT_RHYTHM).toBe('monthly')
  })

  it('recognizes a known rhythm', () => {
    expect(isRepeatRhythm('quarterly')).toBe(true)
  })

  it.each(['daily', '', 1, null])('rejects %o as a rhythm', (value) => {
    expect(isRepeatRhythm(value)).toBe(false)
  })
})

describe('repetitionStartingOn', () => {
  it('anchors the repetition on the day of the deadline', () => {
    expect(repetitionStartingOn('2026-10-31', 'monthly')).toEqual({
      rhythm: 'monthly',
      anchorDay: 31,
    })
  })
})

describe('isAnchorDay', () => {
  it.each([1, 15, 31])('accepts %i', (value) => {
    expect(isAnchorDay(value)).toBe(true)
  })

  it.each([0, 32, 1.5, '15', null])('rejects %o', (value) => {
    expect(isAnchorDay(value)).toBe(false)
  })
})

describe('isAnchoredOn', () => {
  it('sees a deadline on its anchor day as anchored', () => {
    expect(isAnchoredOn('2026-10-24', 24)).toBe(true)
  })

  it('sees the end of a short month as anchored on a later day', () => {
    expect(isAnchoredOn('2026-02-28', 31)).toBe(true)
  })

  it('sees a deadline on another day as not anchored', () => {
    expect(isAnchoredOn('2026-10-24', 3)).toBe(false)
  })
})

describe('nextDeadlineAfter', () => {
  function next(
    deadline: string,
    rhythm: RepeatRhythm,
    anchorDay: number,
    today: string,
  ) {
    return nextDeadlineAfter(deadline, { rhythm, anchorDay }, today)
  }

  it('moves a weekly deadline completed early by one week', () => {
    expect(next('2026-10-15', 'weekly', 15, '2026-10-10')).toBe('2026-10-22')
  })

  it('moves a weekly deadline completed on the day by one week', () => {
    expect(next('2026-10-10', 'weekly', 10, '2026-10-10')).toBe('2026-10-17')
  })

  it('moves an overdue weekly deadline beyond today', () => {
    expect(next('2026-10-01', 'weekly', 1, '2026-10-20')).toBe('2026-10-22')
  })

  it('cuts a monthly deadline to the end of a shorter month', () => {
    expect(next('2026-01-31', 'monthly', 31, '2026-01-10')).toBe('2026-02-28')
  })

  it('returns to the anchor day after a shorter month', () => {
    expect(next('2026-02-28', 'monthly', 31, '2026-02-10')).toBe('2026-03-31')
  })

  it.each([
    ['2026-11-30', '2027-02-28'],
    ['2027-11-30', '2028-02-29'],
  ])(
    'moves a quarterly deadline across the turn of the year from %s to %s',
    (deadline, moved) => {
      expect(next(deadline, 'quarterly', 30, '2026-10-10')).toBe(moved)
    },
  )

  it('moves a half-yearly deadline by six months', () => {
    expect(next('2026-08-31', 'halfYearly', 31, '2026-08-10')).toBe(
      '2027-02-28',
    )
  })

  it('moves a yearly deadline on a leap day to the end of February', () => {
    expect(next('2028-02-29', 'yearly', 29, '2028-02-10')).toBe('2029-02-28')
  })

  it('returns a yearly deadline to the next leap day', () => {
    expect(next('2031-02-28', 'yearly', 29, '2031-02-10')).toBe('2032-02-29')
  })

  it('moves a long overdue monthly deadline to the first anchor after today', () => {
    expect(next('2025-08-15', 'monthly', 15, '2026-10-10')).toBe('2026-10-15')
  })

  it('skips the anchor of the running month once it has passed', () => {
    expect(next('2025-08-05', 'monthly', 5, '2026-10-10')).toBe('2026-11-05')
  })
})
