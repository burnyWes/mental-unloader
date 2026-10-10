export type FolderId = string

export type Folder = {
  id: FolderId
  name: string
}

export function folderById(
  folders: readonly Folder[],
  id: FolderId,
): Folder | null {
  return folders.find((folder) => folder.id === id) ?? null
}
