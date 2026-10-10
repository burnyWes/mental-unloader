import { folderById, type Folder, type FolderId } from './folder'
import type { List } from './list'
import { byName } from './name'

export type Organizer = {
  folders: readonly Folder[]
  lists: readonly List[]
}

export const EMPTY_ORGANIZER: Organizer = { folders: [], lists: [] }

export function listsOfFolder(
  organizer: Organizer,
  folderId: FolderId,
): readonly List[] {
  return byName(organizer.lists.filter((list) => list.folderId === folderId))
}

export function listCountOfFolder(
  organizer: Organizer,
  folderId: FolderId,
): number {
  return listsOfFolder(organizer, folderId).length
}

export function folderOfList(organizer: Organizer, list: List): Folder | null {
  return folderById(organizer.folders, list.folderId)
}

export function sortedFolders(organizer: Organizer): readonly Folder[] {
  return byName(organizer.folders)
}
