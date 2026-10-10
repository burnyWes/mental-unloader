import { describe, expect, it } from 'vitest'
import type { Due, Task } from './task'
import { completedTasksInOrder, openTasksInOrder } from './taskOrder'

const SOMEDAY: Due = { kind: 'someday' }

function urgentSince(since: string): Due {
  return { kind: 'urgent', since }
}

function task(
  name: string,
  due: Due,
  createdAt: number,
  completions: readonly number[] = [],
): Task {
  return {
    id: name,
    listId: 'list-1',
    name,
    description: '',
    due,
    createdAt,
    completions,
  }
}

function namesOf(tasks: readonly Task[]) {
  return tasks.map((each) => each.name)
}

describe('openTasksInOrder', () => {
  it('puts urgent tasks before someday tasks', () => {
    const tasks = [
      task('Keller', SOMEDAY, 1),
      task('Müll', urgentSince('2026-10-10'), 2),
    ]

    expect(namesOf(openTasksInOrder(tasks))).toEqual(['Müll', 'Keller'])
  })

  it('orders urgent tasks by the day they became urgent', () => {
    const tasks = [
      task('neu', urgentSince('2026-10-10'), 1),
      task('alt', urgentSince('2026-10-01'), 2),
    ]

    expect(namesOf(openTasksInOrder(tasks))).toEqual(['alt', 'neu'])
  })

  it('orders tasks urgent since the same day by their creation', () => {
    const tasks = [
      task('später', urgentSince('2026-10-10'), 9),
      task('früher', urgentSince('2026-10-10'), 3),
    ]

    expect(namesOf(openTasksInOrder(tasks))).toEqual(['früher', 'später'])
  })

  it('orders someday tasks by their creation', () => {
    const tasks = [task('später', SOMEDAY, 9), task('früher', SOMEDAY, 3)]

    expect(namesOf(openTasksInOrder(tasks))).toEqual(['früher', 'später'])
  })

  it('leaves out completed tasks', () => {
    const tasks = [task('offen', SOMEDAY, 1), task('erledigt', SOMEDAY, 2, [5])]

    expect(namesOf(openTasksInOrder(tasks))).toEqual(['offen'])
  })
})

describe('completedTasksInOrder', () => {
  it('shows only completed tasks, the latest completed first', () => {
    const tasks = [
      task('früh erledigt', SOMEDAY, 1, [10]),
      task('offen', SOMEDAY, 2),
      task('spät erledigt', SOMEDAY, 3, [5, 20]),
    ]

    expect(namesOf(completedTasksInOrder(tasks))).toEqual([
      'spät erledigt',
      'früh erledigt',
    ])
  })
})
