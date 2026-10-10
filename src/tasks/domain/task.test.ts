import { describe, expect, it } from 'vitest'
import {
  completionsNewestFirst,
  createDescription,
  DEFAULT_URGENCY_LEAD,
  dueAfterChange,
  endsRepetition,
  hasCompletions,
  initialDeadlineOf,
  InvalidDescription,
  isOpen,
  isRecurring,
  isUrgencyLead,
  lastCompletion,
  MAXIMUM_DESCRIPTION_LENGTH,
  nextDeadlineOf,
  taskById,
  URGENCY_LEADS,
  type Due,
  type DueChoice,
  type DueKind,
  type Task,
} from './task'
import type { RepeatRhythm } from './repetition'

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
    repetition: null,
  }

  function chosen(kind: DueKind): DueChoice {
    return {
      kind,
      deadline: '2026-10-17',
      urgentFrom: 'oneMonth',
      repeats: false,
      rhythm: 'monthly',
    }
  }

  function recurringOn(
    deadline: string,
    rhythm: RepeatRhythm,
    anchorDay: number,
  ): Due {
    return {
      kind: 'deadline',
      deadline,
      urgentFrom: 'oneWeek',
      repetition: { rhythm, anchorDay },
    }
  }

  function repeating(
    deadline: string,
    rhythm: RepeatRhythm = 'monthly',
  ): DueChoice {
    return {
      kind: 'deadline',
      deadline,
      urgentFrom: 'oneWeek',
      repeats: true,
      rhythm,
    }
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
      repetition: null,
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
      repetition: null,
    })
  })

  it('forgets the deadline once a task turns someday', () => {
    expect(dueAfterChange(deadlineTask, chosen('someday'), today)).toEqual({
      kind: 'someday',
    })
  })

  it('forgets the repetition once the task no longer repeats', () => {
    expect(
      dueAfterChange(
        recurringOn('2026-10-17', 'monthly', 17),
        { ...repeating('2026-10-17'), repeats: false },
        today,
      ),
    ).toMatchObject({ repetition: null })
  })

  it('anchors a new repetition on the day of the chosen deadline', () => {
    expect(dueAfterChange(null, repeating('2026-10-31'), today)).toEqual(
      recurringOn('2026-10-31', 'monthly', 31),
    )
  })

  it('anchors a changed deadline anew', () => {
    expect(
      dueAfterChange(
        recurringOn('2026-10-31', 'monthly', 31),
        repeating('2026-10-24'),
        today,
      ),
    ).toEqual(recurringOn('2026-10-24', 'monthly', 24))
  })

  it('keeps the anchor while the deadline stays the same', () => {
    expect(
      dueAfterChange(
        recurringOn('2027-02-28', 'monthly', 31),
        repeating('2027-02-28'),
        today,
      ),
    ).toEqual(recurringOn('2027-02-28', 'monthly', 31))
  })

  it('keeps the anchor when only the rhythm changes', () => {
    expect(
      dueAfterChange(
        recurringOn('2027-02-28', 'monthly', 31),
        repeating('2027-02-28', 'quarterly'),
        today,
      ),
    ).toEqual(recurringOn('2027-02-28', 'quarterly', 31))
  })

  it('anchors anew when the old anchor no longer fits the deadline', () => {
    expect(
      dueAfterChange(
        recurringOn('2026-10-24', 'weekly', 3),
        repeating('2026-10-24', 'monthly'),
        today,
      ),
    ).toEqual(recurringOn('2026-10-24', 'monthly', 24))
  })
})

describe('isRecurring', () => {
  function withDue(due: Due): Task {
    return { ...task('Müll'), due }
  }

  it('sees a deadline task with a repetition as recurring', () => {
    expect(
      isRecurring(
        withDue({
          kind: 'deadline',
          deadline: '2026-10-17',
          urgentFrom: 'oneWeek',
          repetition: { rhythm: 'weekly', anchorDay: 17 },
        }),
      ),
    ).toBe(true)
  })

  it('sees a deadline task without a repetition as not recurring', () => {
    expect(
      isRecurring(
        withDue({
          kind: 'deadline',
          deadline: '2026-10-17',
          urgentFrom: 'oneWeek',
          repetition: null,
        }),
      ),
    ).toBe(false)
  })

  it('sees a someday task as not recurring', () => {
    expect(isRecurring(task('Müll'))).toBe(false)
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

describe('hasCompletions', () => {
  it('sees a task without completions as never completed', () => {
    expect(hasCompletions(task('Müll'))).toBe(false)
  })

  it('sees a task with a completion as completed', () => {
    expect(hasCompletions(task('Müll', [5]))).toBe(true)
  })
})

const WEEKLY_ON_THE_15TH: Due = {
  kind: 'deadline',
  deadline: '2026-10-15',
  urgentFrom: 'oneWeek',
  repetition: { rhythm: 'weekly', anchorDay: 15 },
}

const ONCE_ON_THE_15TH: Due = {
  kind: 'deadline',
  deadline: '2026-10-15',
  urgentFrom: 'oneWeek',
  repetition: null,
}

describe('isOpen', () => {
  it('sees a task without completions as open', () => {
    expect(isOpen(task('Müll'))).toBe(true)
  })

  it('sees a completed task as no longer open', () => {
    expect(isOpen(task('Müll', [5]))).toBe(false)
  })

  it('sees a completed recurring task as still open', () => {
    expect(isOpen({ ...task('Müll', [5]), due: WEEKLY_ON_THE_15TH })).toBe(true)
  })
})

describe('completionsNewestFirst', () => {
  it('lists the completions from the newest to the oldest', () => {
    expect(completionsNewestFirst(task('Müll', [7, 9, 3]))).toEqual([9, 7, 3])
  })
})

describe('nextDeadlineOf', () => {
  it('moves the deadline of a recurring task beyond today', () => {
    expect(
      nextDeadlineOf(
        { ...task('Müll'), due: WEEKLY_ON_THE_15TH },
        '2026-10-10',
      ),
    ).toBe('2026-10-22')
  })

  it('finds no next deadline for a task that does not repeat', () => {
    expect(
      nextDeadlineOf({ ...task('Müll'), due: ONCE_ON_THE_15TH }, '2026-10-10'),
    ).toBeNull()
  })

  it('finds no next deadline for a someday task', () => {
    expect(nextDeadlineOf(task('Müll'), '2026-10-10')).toBeNull()
  })
})

describe('endsRepetition', () => {
  it('ends the repetition once the task no longer repeats', () => {
    expect(endsRepetition(WEEKLY_ON_THE_15TH, ONCE_ON_THE_15TH)).toBe(true)
  })

  it('ends the repetition once the task turns someday', () => {
    expect(endsRepetition(WEEKLY_ON_THE_15TH, { kind: 'someday' })).toBe(true)
  })

  it('keeps the repetition while the task still repeats', () => {
    expect(
      endsRepetition(WEEKLY_ON_THE_15TH, {
        ...WEEKLY_ON_THE_15TH,
        deadline: '2026-10-24',
      }),
    ).toBe(false)
  })

  it('ends nothing for a task that did not repeat', () => {
    expect(endsRepetition(ONCE_ON_THE_15TH, { kind: 'someday' })).toBe(false)
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
