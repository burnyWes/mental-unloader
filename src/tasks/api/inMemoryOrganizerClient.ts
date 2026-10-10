import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import type { Organizer } from '../domain/organizer'
import type { OrganizerClient } from './organizerClient'

export type InMemoryOrganizerClient = OrganizerClient & {
  arrivesFromElsewhere(organizer: Partial<Organizer>): void
  storedFolders(): readonly Folder[]
  storedLists(): readonly List[]
  holdBackSnapshots(): void
  releaseSnapshots(): void
}

export function createInMemoryOrganizerClient({
  folders: initialFolders = [],
  lists: initialLists = [],
}: Partial<Organizer> = {}): InMemoryOrganizerClient {
  let folders = [...initialFolders]
  let lists = [...initialLists]
  let nextFolderId = 1
  let nextListId = 1
  let snapshotsHeldBack = false
  const listeners = new Set<(organizer: Organizer) => void>()

  function currentOrganizer(): Organizer {
    return { folders: [...folders], lists: [...lists] }
  }

  function publish() {
    if (snapshotsHeldBack) return
    listeners.forEach((listener) => listener(currentOrganizer()))
  }

  return {
    observeOrganizer(onOrganizer) {
      listeners.add(onOrganizer)
      onOrganizer(currentOrganizer())
      return () => listeners.delete(onOrganizer)
    },
    addFolder(name) {
      const id = `folder-${nextFolderId}`
      nextFolderId += 1
      folders = [...folders, { id, name }]
      publish()
      return id
    },
    renameFolder(id, name) {
      folders = folders.map((folder) =>
        folder.id === id ? { id, name } : folder,
      )
      publish()
    },
    removeFolder(id, listIds) {
      folders = folders.filter((folder) => folder.id !== id)
      lists = lists.filter((list) => !listIds.includes(list.id))
      publish()
    },
    addList(folderId, name) {
      const id = `list-${nextListId}`
      nextListId += 1
      lists = [...lists, { id, name, folderId }]
      publish()
      return id
    },
    changeList(id, name, folderId) {
      lists = lists.map((list) =>
        list.id === id ? { id, name, folderId } : list,
      )
      publish()
    },
    removeList(id) {
      lists = lists.filter((list) => list.id !== id)
      publish()
    },
    arrivesFromElsewhere(arriving) {
      folders = [...(arriving.folders ?? folders)]
      lists = [...(arriving.lists ?? lists)]
      publish()
    },
    storedFolders() {
      return [...folders]
    },
    storedLists() {
      return [...lists]
    },
    holdBackSnapshots() {
      snapshotsHeldBack = true
    },
    releaseSnapshots() {
      snapshotsHeldBack = false
      publish()
    },
  }
}
