import { describe, expect, it } from 'vitest'
import type { Folder } from './folder'
import type { List } from './list'
import {
  folderOfList,
  listCountOfFolder,
  listsOfFolder,
  sortedFolders,
  type Organizer,
} from './organizer'

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

const organizer: Organizer = {
  folders: [garten, familie, arbeit],
  lists: [wocheneinkauf, beete, haushalt, orphan, geburtstage],
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
