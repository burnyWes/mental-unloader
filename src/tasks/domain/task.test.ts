import { describe, expect, it } from 'vitest'
import {
  createDescription,
  DEFAULT_URGENCY_LEAD,
  dueAfterChange,
  initialDeadlineOf,
  InvalidDescription,
  isCompleted,
  isUrgencyLead,
  lastCompletion,
  MAXIMUM_DESCRIPTION_LENGTH,
  taskById,
  URGENCY_LEADS,
  type Due,
  type DueChoice,
  type DueKind,
  type Task,
} from './task'

function task(id: string, completions: readonly number[] = []): Task {
  return {
    id,
    listId: 'list-1',
    name: id,
    description: '',
    due: { kind: 'someday' },
    createdAt: 0,
    completions,
  }
}

function rejectionOf(written: string): InvalidDescription {
  try {
    createDescription(written)
  } catch (error) {
    if (error instanceof InvalidDescription) return error
    throw error
  }
  throw new Error('the description was accepted')
}

describe('createDescription', () => {
  it('trims the written description', () => {
    expect(createDescription('  Gelbe Tonne auch.\n')).toBe('Gelbe Tonne auch.')
  })

  it('accepts an empty description', () => {
    expect(createDescription('   ')).toBe('')
  })

  it('accepts a description of the maximum length', () => {
    const longest = 'a'.repeat(MAXIMUM_DESCRIPTION_LENGTH)

    expect(createDescription(longest)).toBe(longest)
  })

  it('rejects a description beyond the maximum length', () => {
    const tooLong = 'a'.repeat(MAXIMUM_DESCRIPTION_LENGTH + 1)

    expect(rejectionOf(tooLong).reason).toBe('tooLong')
  })
})

describe('dueAfterChange', () => {
  const today = '2026-10-10'
  const deadlineTask: Due = {
    kind: 'deadline',
    deadline: '2026-10-20',
    urgentFrom: 'onDeadline',
  }

  function chosen(kind: DueKind): DueChoice {
    return { kind, deadline: '2026-10-17', urgentFrom: 'oneMonth' }
  }

  it('makes a new urgent task urgent since today', () => {
    expect(dueAfterChange(null, chosen('urgent'), today)).toEqual({
      kind: 'urgent',
      since: today,
    })
  })

  it('keeps the day an urgent task became urgent', () => {
    expect(
      dueAfterChange(
        { kind: 'urgent', since: '2026-10-01' },
        chosen('urgent'),
        today,
      ),
    ).toEqual({ kind: 'urgent', since: '2026-10-01' })
  })

  it('makes a task urgent since today once it turns urgent', () => {
    expect(
      dueAfterChange({ kind: 'someday' }, chosen('urgent'), today),
    ).toEqual({
      kind: 'urgent',
      since: today,
    })
  })

  it('forgets the urgency once a task turns someday', () => {
    expect(
      dueAfterChange(
        { kind: 'urgent', since: '2026-10-01' },
        chosen('someday'),
        today,
      ),
    ).toEqual({ kind: 'someday' })
  })

  it('makes a new someday task someday', () => {
    expect(dueAfterChange(null, chosen('someday'), today)).toEqual({
      kind: 'someday',
    })
  })

  it('gives a new deadline task the chosen deadline and lead', () => {
    expect(dueAfterChange(null, chosen('deadline'), today)).toEqual({
      kind: 'deadline',
      deadline: '2026-10-17',
      urgentFrom: 'oneMonth',
    })
  })

  it('makes a deadline task urgent since today once it turns urgent', () => {
    expect(dueAfterChange(deadlineTask, chosen('urgent'), today)).toEqual({
      kind: 'urgent',
      since: today,
    })
  })

  it('forgets the urgency once an urgent task gets a deadline', () => {
    expect(
      dueAfterChange(
        { kind: 'urgent', since: '2026-10-01' },
        chosen('deadline'),
        today,
      ),
    ).toEqual({
      kind: 'deadline',
      deadline: '2026-10-17',
      urgentFrom: 'oneMonth',
    })
  })

  it('forgets the deadline once a task turns someday', () => {
    expect(dueAfterChange(deadlineTask, chosen('someday'), today)).toEqual({
      kind: 'someday',
    })
  })
})

describe('initialDeadlineOf', () => {
  it('lies a week after today', () => {
    expect(initialDeadlineOf('2026-10-10')).toBe('2026-10-17')
  })
})

describe('urgency leads', () => {
  it('offers the eight leads from the shortest to the longest', () => {
    expect(URGENCY_LEADS).toEqual([
      'immediately',
      'onDeadline',
      'oneDay',
      'oneWeek',
      'oneMonth',
      'oneQuarter',
      'halfYear',
      'oneYear',
    ])
  })

  it('starts with one week', () => {
    expect(DEFAULT_URGENCY_LEAD).toBe('oneWeek')
  })

  it('recognizes a known lead', () => {
    expect(isUrgencyLead('oneQuarter')).toBe(true)
  })

  it.each(['twoWeeks', '', 7, null])('rejects %o as a lead', (value) => {
    expect(isUrgencyLead(value)).toBe(false)
  })
})

describe('isCompleted', () => {
  it('sees a task without completions as open', () => {
    expect(isCompleted(task('Müll'))).toBe(false)
  })

  it('sees a task with a completion as completed', () => {
    expect(isCompleted(task('Müll', [5]))).toBe(true)
  })
})

describe('lastCompletion', () => {
  it('finds nothing for an open task', () => {
    expect(lastCompletion(task('Müll'))).toBeNull()
  })

  it('finds the latest completion wherever it is stored', () => {
    expect(lastCompletion(task('Müll', [7, 9, 3]))).toBe(9)
  })
})

describe('taskById', () => {
  const tasks = [task('task-1'), task('task-2')]

  it('finds the task with the id', () => {
    expect(taskById(tasks, 'task-2')).toEqual(task('task-2'))
  })

  it('finds nothing for an unknown id', () => {
    expect(taskById(tasks, 'task-3')).toBeNull()
  })
})
