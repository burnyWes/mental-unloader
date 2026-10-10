import type { Folder, FolderId } from '../domain/folder'

export interface FoldersClient {
  observeFolders(onFolders: (folders: readonly Folder[]) => void): () => void
  addFolder(name: string): FolderId
  renameFolder(id: FolderId, name: string): void
  removeFolder(id: FolderId): void
}
