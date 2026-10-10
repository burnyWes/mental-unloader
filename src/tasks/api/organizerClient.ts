import type { FolderId } from '../domain/folder'
import type { ListId } from '../domain/list'
import type { Organizer } from '../domain/organizer'

export interface OrganizerClient {
  observeOrganizer(onOrganizer: (organizer: Organizer) => void): () => void
  addFolder(name: string): FolderId
  renameFolder(id: FolderId, name: string): void
  removeFolder(id: FolderId, listIds: readonly ListId[]): void
  addList(folderId: FolderId, name: string): ListId
  changeList(id: ListId, name: string, folderId: FolderId): void
  removeList(id: ListId): void
}
