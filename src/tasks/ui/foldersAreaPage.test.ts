import { describe, expect, it } from 'vitest'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import type { Organizer } from '../domain/organizer'
import type { Task } from '../domain/task'
import { listFilterOf, listsShownIn } from './foldersAreaPage'

const familie: Folder = { id: 'folder-1', name: 'Familie' }
const garten: Folder = { id: 'folder-2', name: 'Garten' }

function list(id: string, name: string, folderId: string): List {
  return { id, name, folderId }
}

const umzug = list('list-1', 'Umzug', familie.id)
const haushalt = list('list-2', 'Haushalt', familie.id)
const geburtstage = list('list-3', 'Geburtstage', familie.id)
const ausmisten = list('list-4', 'Ausmisten', familie.id)
const beete = list('list-5', 'Beete', garten.id)

function task(
  id: string,
  listId: string,
  completions: readonly number[] = [],
): Task {
  return {
    id,
    listId,
    name: id,
    description: '',
    due: { kind: 'someday' },
    createdAt: 0,
    completions,
  }
}

const organizer: Organizer = {
  folders: [familie, garten],
  lists: [umzug, haushalt, geburtstage, ausmisten, beete],
  tasks: [
    task('kartons', umzug.id, [1]),
    task('fenster', haushalt.id),
    task('keller', ausmisten.id, [2]),
    task('rosen', beete.id, [3]),
  ],
}

describe('listsShownIn', () => {
  it('shows the open and the empty lists of the folder under open, by name', () => {
    expect(listsShownIn('open', organizer, familie.id)).toEqual([
      geburtstage,
      haushalt,
    ])
  })

  it('shows the completed lists of the folder under completed, by name', () => {
    expect(listsShownIn('completed', organizer, familie.id)).toEqual([
      ausmisten,
      umzug,
    ])
  })
})

describe('listFilterOf', () => {
  it('places a completed list under completed', () => {
    expect(listFilterOf(organizer, umzug.id)).toBe('completed')
  })

  it.each([
    ['an open', haushalt],
    ['an empty', geburtstage],
  ])('places %s list under open', (_, shown) => {
    expect(listFilterOf(organizer, shown.id)).toBe('open')
  })
})
