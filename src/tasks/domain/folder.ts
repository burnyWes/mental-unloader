export type FolderId = string

export type Folder = {
  id: FolderId
  name: string
}

export const MAXIMUM_FOLDER_NAME_LENGTH = 100

export type InvalidFolderNameReason = 'empty' | 'tooLong'

export class InvalidFolderName extends Error {
  reason: InvalidFolderNameReason

  constructor(reason: InvalidFolderNameReason) {
    super(reason)
    this.name = 'InvalidFolderName'
    this.reason = reason
  }
}

export function createFolderName(written: string): string {
  const name = written.trim()
  if (name === '') throw new InvalidFolderName('empty')
  if (name.length > MAXIMUM_FOLDER_NAME_LENGTH)
    throw new InvalidFolderName('tooLong')
  return name
}

export function byName(folders: readonly Folder[]): readonly Folder[] {
  return [...folders].sort(
    (one, other) =>
      one.name.localeCompare(other.name, 'de-DE') ||
      one.id.localeCompare(other.id),
  )
}

export function folderById(
  folders: readonly Folder[],
  id: FolderId,
): Folder | null {
  return folders.find((folder) => folder.id === id) ?? null
}
