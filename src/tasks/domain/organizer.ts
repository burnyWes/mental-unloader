import { folderById, type Folder, type FolderId } from './folder'
import { listById, type List, type ListId } from './list'
import { byName } from './name'
import { isCompleted, type Task } from './task'

export type Organizer = {
  folders: readonly Folder[]
  lists: readonly List[]
  tasks: readonly Task[]
}

export type OpenTaskSummary = {
  open: number
  urgent: number
}

export const EMPTY_ORGANIZER: Organizer = { folders: [], lists: [], tasks: [] }

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

export function tasksOfList(
  organizer: Organizer,
  listId: ListId,
): readonly Task[] {
  return organizer.tasks.filter((task) => task.listId === listId)
}

export function taskCountOfList(organizer: Organizer, listId: ListId): number {
  return tasksOfList(organizer, listId).length
}

export function openTaskSummaryOfList(
  organizer: Organizer,
  listId: ListId,
): OpenTaskSummary {
  const openTasks = tasksOfList(organizer, listId).filter(
    (task) => !isCompleted(task),
  )
  return {
    open: openTasks.length,
    urgent: openTasks.filter((task) => task.due.kind === 'urgent').length,
  }
}

export function tasksOfFolder(
  organizer: Organizer,
  folderId: FolderId,
): readonly Task[] {
  return listsOfFolder(organizer, folderId).flatMap((list) =>
    tasksOfList(organizer, list.id),
  )
}

export function listOfTask(organizer: Organizer, task: Task): List | null {
  return listById(organizer.lists, task.listId)
}
