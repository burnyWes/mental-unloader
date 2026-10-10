import { useCallback, useEffect, useState } from 'react'
import type { OrganizerClient } from '../api/organizerClient'
import type { FolderId } from '../domain/folder'
import type { ListId } from '../domain/list'
import { byName } from '../domain/name'
import { EMPTY_ORGANIZER, type Organizer } from '../domain/organizer'

export type OrganizerState = Organizer & {
  addFolder: (name: string) => FolderId
  renameFolder: (id: FolderId, name: string) => void
  removeFolder: (id: FolderId, listIds: readonly ListId[]) => void
  addList: (folderId: FolderId, name: string) => ListId
  changeList: (id: ListId, name: string, folderId: FolderId) => void
  removeList: (id: ListId) => void
}

export function useOrganizer(client: OrganizerClient): OrganizerState {
  const [knownOrganizer, setKnownOrganizer] =
    useState<Organizer>(EMPTY_ORGANIZER)

  useEffect(() => client.observeOrganizer(setKnownOrganizer), [client])

  const addFolder = useCallback(
    (name: string) => client.addFolder(name),
    [client],
  )

  const renameFolder = useCallback(
    (id: FolderId, name: string) => client.renameFolder(id, name),
    [client],
  )

  const removeFolder = useCallback(
    (id: FolderId, listIds: readonly ListId[]) =>
      client.removeFolder(id, listIds),
    [client],
  )

  const addList = useCallback(
    (folderId: FolderId, name: string) => client.addList(folderId, name),
    [client],
  )

  const changeList = useCallback(
    (id: ListId, name: string, folderId: FolderId) =>
      client.changeList(id, name, folderId),
    [client],
  )

  const removeList = useCallback(
    (id: ListId) => client.removeList(id),
    [client],
  )

  return {
    folders: byName(knownOrganizer.folders),
    lists: byName(knownOrganizer.lists),
    addFolder,
    renameFolder,
    removeFolder,
    addList,
    changeList,
    removeList,
  }
}
