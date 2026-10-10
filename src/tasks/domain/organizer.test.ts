import { describe, expect, it } from 'vitest'
import type { Folder } from './folder'
import type { List } from './list'
import {
  EMPTY_ORGANIZER,
  folderOfList,
  listCountOfFolder,
  listOfTask,
  listsOfFolder,
  openTaskSummaryOfList,
  sortedFolders,
  taskCountOfList,
  tasksOfFolder,
  tasksOfList,
  urgentTasksOf,
  type Organizer,
} from './organizer'
import type { Due, Task } from './task'

const familie: Folder = { id: 'folder-1', name: 'Familie' }
const garten: Folder = { id: 'folder-2', name: 'Garten' }
const arbeit: Folder = { id: 'folder-3', name: 'Arbeit' }

function list(id: string, name: string, folderId: string): List {
  return { id, name, folderId }
}

const wocheneinkauf = list('list-1', 'Wocheneinkauf', familie.id)
const haushalt = list('list-2', 'Haushalt', familie.id)
const geburtstage = list('list-3', 'Geburtstage', familie.id)
const beete = list('list-4', 'Beete', garten.id)
const orphan = list('list-5', 'Waise', 'folder-gone')

function task(
  id: string,
  listId: string,
  due: Due = { kind: 'someday' },
  completions: readonly number[] = [],
): Task {
  return {
    id,
    listId,
    name: id,
    description: '',
    due,
    createdAt: 0,
    completions,
  }
}

const urgent: Due = { kind: 'urgent', since: '2026-10-10' }

const weeklyOnThe15th: Due = {
  kind: 'deadline',
  deadline: '2026-10-15',
  urgentFrom: 'oneWeek',
  repetition: { rhythm: 'weekly', anchorDay: 15 },
}

const muell = task('task-1', haushalt.id, urgent)
const keller = task('task-2', haushalt.id)
const fenster = task('task-3', haushalt.id, urgent, [5])
const milch = task('task-4', wocheneinkauf.id)
const rosen = task('task-5', beete.id, urgent)
const lost = task('task-6', 'list-gone')

const organizer: Organizer = {
  folders: [garten, familie, arbeit],
  lists: [wocheneinkauf, beete, haushalt, orphan, geburtstage],
  tasks: [muell, milch, keller, rosen, fenster, lost],
}

describe('listsOfFolder', () => {
  it('finds only the lists of the folder, alphabetically', () => {
    expect(listsOfFolder(organizer, familie.id)).toEqual([
      geburtstage,
      haushalt,
      wocheneinkauf,
    ])
  })
})

describe('listCountOfFolder', () => {
  it.each([
    [arbeit, 0],
    [garten, 1],
    [familie, 3],
  ])('counts the lists of %o as %i', (folder, count) => {
    expect(listCountOfFolder(organizer, folder.id)).toBe(count)
  })
})

describe('folderOfList', () => {
  it('finds the folder holding the list', () => {
    expect(folderOfList(organizer, beete)).toEqual(garten)
  })

  it('finds no folder for an orphaned list', () => {
    expect(folderOfList(organizer, orphan)).toBeNull()
  })
})

describe('sortedFolders', () => {
  it('sorts the folders alphabetically', () => {
    expect(sortedFolders(organizer)).toEqual([arbeit, familie, garten])
  })
})

describe('tasksOfList', () => {
  it('finds only the tasks of the list, open or completed', () => {
    expect(tasksOfList(organizer, haushalt.id)).toEqual([
      muell,
      keller,
      fenster,
    ])
  })
})

describe('taskCountOfList', () => {
  it.each([
    [geburtstage, 0],
    [beete, 1],
    [haushalt, 3],
  ])('counts the tasks of %o as %i', (list, count) => {
    expect(taskCountOfList(organizer, list.id)).toBe(count)
  })
})

describe('openTaskSummaryOfList', () => {
  const today = '2026-10-10'

  it('counts the open and the urgent tasks but not the completed ones', () => {
    expect(openTaskSummaryOfList(organizer, haushalt.id, today)).toEqual({
      open: 2,
      urgent: 1,
    })
  })

  it('counts deadline tasks as urgent only once their lead is reached', () => {
    const deadlineOn = (deadline: string): Due => ({
      kind: 'deadline',
      deadline,
      urgentFrom: 'oneWeek',
      repetition: null,
    })
    const withDeadlines: Organizer = {
      ...organizer,
      tasks: [
        task('reached', geburtstage.id, deadlineOn('2026-10-15')),
        task('ahead', geburtstage.id, deadlineOn('2026-10-20')),
        task('done', geburtstage.id, deadlineOn('2026-10-15'), [5]),
        task('fire', geburtstage.id, urgent),
        task('coffee', geburtstage.id),
      ],
    }

    expect(openTaskSummaryOfList(withDeadlines, geburtstage.id, today)).toEqual(
      { open: 4, urgent: 2 },
    )
  })

  it('counts a completed recurring task as open and urgent', () => {
    const withRecurring: Organizer = {
      ...organizer,
      tasks: [task('muell', geburtstage.id, weeklyOnThe15th, [5])],
    }

    expect(openTaskSummaryOfList(withRecurring, geburtstage.id, today)).toEqual(
      { open: 1, urgent: 1 },
    )
  })

  it('counts nothing for a list without tasks', () => {
    expect(openTaskSummaryOfList(organizer, geburtstage.id, today)).toEqual({
      open: 0,
      urgent: 0,
    })
  })
})

describe('tasksOfFolder', () => {
  it('gathers the tasks of all lists of the folder', () => {
    const gathered = tasksOfFolder(organizer, familie.id)

    expect(gathered).toHaveLength(4)
    expect(gathered).toEqual(
      expect.arrayContaining([muell, keller, fenster, milch]),
    )
  })

  it('gathers nothing for a folder without lists', () => {
    expect(tasksOfFolder(organizer, arbeit.id)).toEqual([])
  })
})

describe('listOfTask', () => {
  it('finds the list holding the task', () => {
    expect(listOfTask(organizer, rosen)).toEqual(beete)
  })

  it('finds no list for an orphaned task', () => {
    expect(listOfTask(organizer, lost)).toBeNull()
  })
})

describe('urgentTasksOf', () => {
  const today = '2026-10-10'
  const wartung = list('list-6', 'Wartung', garten.id)

  function created(
    id: string,
    listId: string,
    due: Due,
    createdAt: number,
    completions: readonly number[] = [],
  ): Task {
    return { ...task(id, listId, due, completions), createdAt }
  }

  function deadlineOn(
    deadline: string,
    urgentFrom: 'oneWeek' | 'immediately' = 'oneWeek',
  ): Due {
    return { kind: 'deadline', deadline, urgentFrom, repetition: null }
  }

  function urgentSince(since: string): Due {
    return { kind: 'urgent', since }
  }

  function idsOf(organizer: Organizer) {
    return urgentTasksOf(organizer, today).map(({ task }) => task.id)
  }

  it('gathers the urgent tasks of all folders and lists with their origin', () => {
    const fire = created('fire', haushalt.id, urgent, 1)
    const reached = created('reached', wartung.id, deadlineOn('2026-10-15'), 2)
    const overdue = created('overdue', beete.id, deadlineOn('2026-10-08'), 3)
    const immediately = created(
      'immediately',
      wocheneinkauf.id,
      deadlineOn('2027-05-01', 'immediately'),
      4,
    )

    expect(
      urgentTasksOf(
        {
          folders: [familie, garten],
          lists: [haushalt, wocheneinkauf, beete, wartung],
          tasks: [reached, immediately, overdue, fire],
        },
        today,
      ),
    ).toEqual([
      { task: fire, list: haushalt, folder: familie },
      { task: overdue, list: beete, folder: garten },
      { task: reached, list: wartung, folder: garten },
      { task: immediately, list: wocheneinkauf, folder: familie },
    ])
  })

  it('leaves out someday, deadlines ahead of their lead and completed tasks', () => {
    expect(
      idsOf({
        folders: [familie],
        lists: [haushalt],
        tasks: [
          created('coffee', haushalt.id, { kind: 'someday' }, 1),
          created('ahead', haushalt.id, deadlineOn('2026-10-20'), 2),
          created('done', haushalt.id, urgent, 3, [5]),
          created('fire', haushalt.id, urgent, 4),
        ],
      }),
    ).toEqual(['fire'])
  })

  it('keeps a completed recurring task once its lead is reached', () => {
    expect(
      idsOf({
        folders: [familie],
        lists: [haushalt],
        tasks: [created('muell', haushalt.id, weeklyOnThe15th, 1, [5])],
      }),
    ).toEqual(['muell'])
  })

  it('orders across lists: older urgency first, then deadlines, then creation', () => {
    expect(
      idsOf({
        folders: [familie, garten],
        lists: [haushalt, beete],
        tasks: [
          created('late deadline', beete.id, deadlineOn('2026-10-12'), 1),
          created('young fire', haushalt.id, urgentSince('2026-10-09'), 2),
          created('early deadline', haushalt.id, deadlineOn('2026-10-11'), 9),
          created('old fire', beete.id, urgentSince('2026-10-01'), 3),
          created('same deadline', beete.id, deadlineOn('2026-10-11'), 4),
        ],
      }),
    ).toEqual([
      'old fire',
      'young fire',
      'same deadline',
      'early deadline',
      'late deadline',
    ])
  })

  it('leaves out tasks without a list and tasks of a list without a folder', () => {
    expect(
      idsOf({
        folders: [familie],
        lists: [haushalt, orphan],
        tasks: [
          created('lost', 'list-gone', urgent, 1),
          created('orphaned', orphan.id, urgent, 2),
          created('fire', haushalt.id, urgent, 3),
        ],
      }),
    ).toEqual(['fire'])
  })

  it('gathers nothing from an empty organizer', () => {
    expect(urgentTasksOf(EMPTY_ORGANIZER, today)).toEqual([])
  })
})
