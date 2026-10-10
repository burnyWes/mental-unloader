import type { CalendarDay } from '../domain/calendarDay'
import type { FolderId } from '../domain/folder'
import type { ListId } from '../domain/list'
import type { Organizer } from '../domain/organizer'
import type { TaskContent, TaskId } from '../domain/task'

export type NewTask = TaskContent & { listId: ListId; createdAt: number }

export interface OrganizerClient {
  observeOrganizer(onOrganizer: (organizer: Organizer) => void): () => void
  addFolder(name: string): FolderId
  renameFolder(id: FolderId, name: string): void
  removeFolder(
    id: FolderId,
    listIds: readonly ListId[],
    taskIds: readonly TaskId[],
  ): void
  addList(folderId: FolderId, name: string): ListId
  changeList(id: ListId, name: string, folderId: FolderId): void
  removeList(id: ListId, taskIds: readonly TaskId[]): void
  addTask(task: NewTask): TaskId
  changeTask(
    id: TaskId,
    content: TaskContent,
    listId: ListId,
    completionsReset: boolean,
  ): void
  completeTask(id: TaskId, at: number, nextDeadline: CalendarDay | null): void
  reopenTask(id: TaskId): void
  removeTask(id: TaskId): void
}
