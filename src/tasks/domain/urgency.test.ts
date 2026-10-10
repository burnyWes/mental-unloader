import { describe, expect, it } from 'vitest'
import type { Due, Task, UrgencyLead } from './task'
import { isOverdueOn, isUrgentOn, urgencyStartOf } from './urgency'

function task(due: Due): Task {
  return {
    id: 'task-1',
    listId: 'list-1',
    name: 'Reifen wechseln',
    description: '',
    due,
    createdAt: 0,
    completions: [],
  }
}

function deadlineTask(deadline: string, urgentFrom: UrgencyLead = 'oneWeek') {
  return task({ kind: 'deadline', deadline, urgentFrom, repetition: null })
}

const URGENT = task({ kind: 'urgent', since: '2026-10-01' })
const SOMEDAY = task({ kind: 'someday' })

describe('urgencyStartOf', () => {
  it('has no start for a task urgent immediately', () => {
    expect(urgencyStartOf('2026-10-17', 'immediately')).toBeNull()
  })

  it.each([
    ['onDeadline', '2026-10-17'],
    ['oneDay', '2026-10-16'],
    ['oneWeek', '2026-10-10'],
    ['oneMonth', '2026-09-17'],
    ['oneQuarter', '2026-07-17'],
    ['halfYear', '2026-04-17'],
    ['oneYear', '2025-10-17'],
  ] as const)('starts %s ahead of the deadline on %s', (lead, start) => {
    expect(urgencyStartOf('2026-10-17', lead)).toBe(start)
  })

  it('starts on the last day of a shorter month', () => {
    expect(urgencyStartOf('2026-03-31', 'oneMonth')).toBe('2026-02-28')
  })
})

describe('isUrgentOn', () => {
  it('sees an urgent task as urgent', () => {
    expect(isUrgentOn(URGENT, '2026-10-10')).toBe(true)
  })

  it('never sees a someday task as urgent', () => {
    expect(isUrgentOn(SOMEDAY, '2026-10-10')).toBe(false)
  })

  it('sees a deadline task urgent immediately as urgent a year ahead', () => {
    expect(
      isUrgentOn(deadlineTask('2027-10-10', 'immediately'), '2026-10-10'),
    ).toBe(true)
  })

  it.each([
    ['2026-10-09', false],
    ['2026-10-10', true],
  ])('sees a deadline task one week ahead on %s as %s', (today, urgent) => {
    expect(isUrgentOn(deadlineTask('2026-10-17'), today)).toBe(urgent)
  })

  it.each([
    ['2026-10-16', false],
    ['2026-10-17', true],
  ])(
    'sees a deadline task due on its deadline on %s as %s',
    (today, urgent) => {
      expect(isUrgentOn(deadlineTask('2026-10-17', 'onDeadline'), today)).toBe(
        urgent,
      )
    },
  )

  it('sees an overdue task as urgent', () => {
    expect(
      isUrgentOn(deadlineTask('2026-10-08', 'onDeadline'), '2026-10-10'),
    ).toBe(true)
  })
})

describe('isOverdueOn', () => {
  it('sees a task due yesterday as overdue', () => {
    expect(isOverdueOn(deadlineTask('2026-10-09'), '2026-10-10')).toBe(true)
  })

  it('does not see a task due today as overdue', () => {
    expect(isOverdueOn(deadlineTask('2026-10-10'), '2026-10-10')).toBe(false)
  })

  it.each([URGENT, SOMEDAY])('never sees %o as overdue', (each) => {
    expect(isOverdueOn(each, '2026-10-10')).toBe(false)
  })
})
