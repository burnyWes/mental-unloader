import type { FolderId } from './folder'

export type ListId = string

export type List = {
  id: ListId
  name: string
  folderId: FolderId
}

export function listById(lists: readonly List[], id: ListId): List | null {
  return lists.find((list) => list.id === id) ?? null
}
