import { useCallback, useEffect, useState } from 'react'
import type { FoldersClient } from '../api/foldersClient'
import { byName, type Folder, type FolderId } from '../domain/folder'

export type Folders = {
  folders: readonly Folder[]
  addFolder: (name: string) => FolderId
  renameFolder: (id: FolderId, name: string) => void
  removeFolder: (id: FolderId) => void
}

export function useFolders(client: FoldersClient): Folders {
  const [knownFolders, setKnownFolders] = useState<readonly Folder[]>([])

  useEffect(() => client.observeFolders(setKnownFolders), [client])

  const addFolder = useCallback(
    (name: string) => client.addFolder(name),
    [client],
  )

  const renameFolder = useCallback(
    (id: FolderId, name: string) => client.renameFolder(id, name),
    [client],
  )

  const removeFolder = useCallback(
    (id: FolderId) => client.removeFolder(id),
    [client],
  )

  return {
    folders: byName(knownFolders),
    addFolder,
    renameFolder,
    removeFolder,
  }
}
