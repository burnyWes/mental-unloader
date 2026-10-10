import type { Folder } from '../domain/folder'
import type { FoldersClient } from './foldersClient'

export type InMemoryFoldersClient = FoldersClient & {
  foldersArriveFromElsewhere(folders: readonly Folder[]): void
  storedFolders(): readonly Folder[]
  holdBackSnapshots(): void
  releaseSnapshots(): void
}

export function createInMemoryFoldersClient(
  initialFolders: readonly Folder[] = [],
): InMemoryFoldersClient {
  let folders = [...initialFolders]
  let nextId = 1
  let snapshotsHeldBack = false
  const listeners = new Set<(folders: readonly Folder[]) => void>()

  function publish() {
    if (snapshotsHeldBack) return
    listeners.forEach((listener) => listener([...folders]))
  }

  return {
    observeFolders(onFolders) {
      listeners.add(onFolders)
      onFolders([...folders])
      return () => listeners.delete(onFolders)
    },
    addFolder(name) {
      const id = `folder-${nextId}`
      nextId += 1
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
    removeFolder(id) {
      folders = folders.filter((folder) => folder.id !== id)
      publish()
    },
    foldersArriveFromElsewhere(arriving) {
      folders = [...arriving]
      publish()
    },
    storedFolders() {
      return [...folders]
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
