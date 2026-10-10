import { describe, expect, it } from 'vitest'
import type { Folder } from './folder'
import type { List } from './list'
import {
  folderOfList,
  listCountOfFolder,
  listOfTask,
  listsOfFolder,
  openTaskSummaryOfList,
  sortedFolders,
  taskCountOfList,
  tasksOfFolder,
  tasksOfList,
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
  it('counts the open and the urgent tasks but not the completed ones', () => {
    expect(openTaskSummaryOfList(organizer, haushalt.id)).toEqual({
      open: 2,
      urgent: 1,
    })
  })

  it('counts nothing for a list without tasks', () => {
    expect(openTaskSummaryOfList(organizer, geburtstage.id)).toEqual({
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
