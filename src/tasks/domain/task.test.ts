import { describe, expect, it } from 'vitest'
import {
  createDescription,
  dueAfterChange,
  InvalidDescription,
  isCompleted,
  lastCompletion,
  MAXIMUM_DESCRIPTION_LENGTH,
  taskById,
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

  it('makes a new urgent task urgent since today', () => {
    expect(dueAfterChange(null, 'urgent', today)).toEqual({
      kind: 'urgent',
      since: today,
    })
  })

  it('keeps the day an urgent task became urgent', () => {
    expect(
      dueAfterChange({ kind: 'urgent', since: '2026-10-01' }, 'urgent', today),
    ).toEqual({ kind: 'urgent', since: '2026-10-01' })
  })

  it('makes a task urgent since today once it turns urgent', () => {
    expect(dueAfterChange({ kind: 'someday' }, 'urgent', today)).toEqual({
      kind: 'urgent',
      since: today,
    })
  })

  it('forgets the urgency once a task turns someday', () => {
    expect(
      dueAfterChange({ kind: 'urgent', since: '2026-10-01' }, 'someday', today),
    ).toEqual({ kind: 'someday' })
  })

  it('makes a new someday task someday', () => {
    expect(dueAfterChange(null, 'someday', today)).toEqual({ kind: 'someday' })
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
