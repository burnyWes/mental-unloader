import { describe, expect, it } from 'vitest'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import type { Organizer, UrgentTask } from '../domain/organizer'
import type { Due, Task } from '../domain/task'
import {
  focusAfterLeaving,
  resolveUrgentAreaPage,
  URGENT_HEADING_FOCUS,
  type UrgentAreaPage,
} from './urgentAreaPage'

const familie: Folder = { id: 'folder-1', name: 'Familie' }
const haushalt: List = { id: 'list-1', name: 'Haushalt', folderId: familie.id }

const URGENT: Due = { kind: 'urgent', since: '2026-10-01' }

function task(id: string): Task {
  return {
    id,
    listId: haushalt.id,
    name: id,
    description: '',
    due: URGENT,
    createdAt: 0,
    completions: [],
  }
}

const muell = task('muell')
const reifen = task('reifen')
const zahnarzt = task('zahnarzt')

const organizer: Organizer = {
  folders: [familie],
  lists: [haushalt],
  tasks: [muell, reifen],
}

function urgentRows(...tasks: readonly Task[]): readonly UrgentTask[] {
  return tasks.map((each) => ({ task: each, list: haushalt, folder: familie }))
}

const openedPage: UrgentAreaPage = {
  kind: 'task',
  id: muell.id,
  entry: 'overview',
  openedAt: 1,
}

describe('resolveUrgentAreaPage', () => {
  it('passes the overview through', () => {
    const page: UrgentAreaPage = {
      kind: 'overview',
      focus: { kind: 'returningTask', id: muell.id, button: 'open' },
    }

    expect(resolveUrgentAreaPage(page, organizer)).toEqual({
      shown: page,
      vanished: false,
    })
  })

  it('shows an opened task with its list and folder', () => {
    expect(resolveUrgentAreaPage(openedPage, organizer)).toEqual({
      shown: {
        kind: 'task',
        task: muell,
        list: haushalt,
        folder: familie,
        entry: 'overview',
        openedAt: 1,
      },
      vanished: false,
    })
  })

  it.each([
    ['the task', { ...organizer, tasks: [reifen] }],
    ['its list', { ...organizer, lists: [] }],
    ['the folder of its list', { ...organizer, folders: [] }],
  ])(
    'returns to the urgent page with the heading focused without %s',
    (_missing, vanishedFrom) => {
      expect(resolveUrgentAreaPage(openedPage, vanishedFrom)).toEqual({
        shown: { kind: 'overview', focus: URGENT_HEADING_FOCUS },
        vanished: true,
      })
    },
  )
})

describe('focusAfterLeaving', () => {
  const stillUrgent = urgentRows(reifen, muell, zahnarzt)
  const noLongerUrgent = urgentRows(reifen, zahnarzt)

  it('returns to the name of a task still urgent after going back', () => {
    expect(focusAfterLeaving(muell, stillUrgent, 0, 'back')).toEqual({
      focus: { kind: 'returningTask', id: muell.id, button: 'open' },
      noLongerUrgent: false,
    })
  })

  it('returns to the check box of a task whose completion was cancelled', () => {
    expect(focusAfterLeaving(muell, stillUrgent, 1, 'cancelled')).toEqual({
      focus: { kind: 'returningTask', id: muell.id, button: 'complete' },
      noLongerUrgent: false,
    })
  })

  it.each(['back', 'cancelled'] as const)(
    'follows the row at the opened place of a task no longer urgent after %s',
    (reason) => {
      expect(focusAfterLeaving(muell, noLongerUrgent, 1, reason)).toEqual({
        focus: { kind: 'followingTask', removedAt: 1, removedId: muell.id },
        noLongerUrgent: true,
      })
    },
  )

  it.each(['completed', 'deleted'] as const)(
    'follows the row at the current place of a task %s while still shown',
    (reason) => {
      expect(focusAfterLeaving(muell, stillUrgent, 0, reason)).toEqual({
        focus: { kind: 'followingTask', removedAt: 1, removedId: muell.id },
        noLongerUrgent: false,
      })
    },
  )

  it.each(['completed', 'deleted'] as const)(
    'follows the row at the opened place of a task %s while no longer shown',
    (reason) => {
      expect(focusAfterLeaving(muell, noLongerUrgent, 2, reason)).toEqual({
        focus: { kind: 'followingTask', removedAt: 2, removedId: muell.id },
        noLongerUrgent: false,
      })
    },
  )
})
