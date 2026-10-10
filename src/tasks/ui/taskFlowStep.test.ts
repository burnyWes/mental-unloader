import { describe, expect, it } from 'vitest'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import type { Organizer } from '../domain/organizer'
import type { Task } from '../domain/task'
import type { TaskDraft } from './foldersAreaPage'
import { resolveTaskFlowStep, type TaskFlowStep } from './taskFlowStep'

const familie: Folder = { id: 'folder-1', name: 'Familie' }
const garten: Folder = { id: 'folder-2', name: 'Garten' }

const haushalt: List = { id: 'list-1', name: 'Haushalt', folderId: familie.id }
const beete: List = { id: 'list-2', name: 'Beete', folderId: garten.id }
const orphan: List = { id: 'list-3', name: 'Waise', folderId: 'folder-gone' }

const muell: Task = {
  id: 'task-1',
  listId: haushalt.id,
  name: 'Müll rausbringen',
  description: '',
  due: { kind: 'someday' },
  createdAt: 0,
  completions: [],
}

const draft: TaskDraft = {
  name: 'Müll rausbringen',
  description: '',
  dueKind: 'someday',
  deadline: '2026-10-17',
  urgentFrom: 'oneWeek',
}

const organizer: Organizer = {
  folders: [familie, garten],
  lists: [haushalt, beete, orphan],
  tasks: [muell],
}

const shownTask = { task: muell, list: haushalt, folder: familie }

function editing(draftListId: string | null): TaskFlowStep {
  return { kind: 'edit', draft, draftListId }
}

describe('resolveTaskFlowStep', () => {
  it('shows the overview as it is', () => {
    expect(
      resolveTaskFlowStep({ kind: 'overview' }, shownTask, organizer),
    ).toEqual({ kind: 'overview', alreadyCompleted: false })
  })

  it.each(['overview', 'row'] as const)(
    'asks before completing an open task coming from the %s',
    (from) => {
      expect(
        resolveTaskFlowStep(
          { kind: 'confirmCompletion', from },
          shownTask,
          organizer,
        ),
      ).toEqual({ kind: 'confirmCompletion', from })
    },
  )

  it('shows the overview of a task completed meanwhile instead of asking', () => {
    const completed = { ...shownTask, task: { ...muell, completions: [5] } }

    expect(
      resolveTaskFlowStep(
        { kind: 'confirmCompletion', from: 'row' },
        completed,
        organizer,
      ),
    ).toEqual({ kind: 'overview', alreadyCompleted: true })
  })

  it('asks before deleting a task', () => {
    expect(
      resolveTaskFlowStep({ kind: 'confirmDeletion' }, shownTask, organizer),
    ).toEqual({ kind: 'confirmDeletion' })
  })

  it('targets the current list while no list was chosen', () => {
    expect(resolveTaskFlowStep(editing(null), shownTask, organizer)).toEqual({
      kind: 'edit',
      draft,
      draftListId: null,
      targetList: haushalt,
      targetFolder: familie,
    })
  })

  it('targets a chosen list that still exists', () => {
    expect(
      resolveTaskFlowStep(editing(beete.id), shownTask, organizer),
    ).toEqual({
      kind: 'edit',
      draft,
      draftListId: beete.id,
      targetList: beete,
      targetFolder: garten,
    })
  })

  it('falls back to the current list when the chosen one is gone', () => {
    expect(
      resolveTaskFlowStep(editing('list-gone'), shownTask, organizer),
    ).toMatchObject({ draftListId: null, targetList: haushalt })
  })

  it('falls back to the current list when the folder of the chosen one is gone', () => {
    expect(
      resolveTaskFlowStep(editing(orphan.id), shownTask, organizer),
    ).toMatchObject({ draftListId: null, targetList: haushalt })
  })
})
