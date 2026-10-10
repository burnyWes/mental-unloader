import { useCallback, useEffect, useState } from 'react'
import type { NewTask, OrganizerClient } from '../api/organizerClient'
import type { CalendarDay } from '../domain/calendarDay'
import type { FolderId } from '../domain/folder'
import type { ListId } from '../domain/list'
import { byName } from '../domain/name'
import { EMPTY_ORGANIZER, type Organizer } from '../domain/organizer'
import type { TaskContent, TaskId } from '../domain/task'

export type OrganizerState = Organizer & {
  addFolder: (name: string) => FolderId
  renameFolder: (id: FolderId, name: string) => void
  removeFolder: (
    id: FolderId,
    listIds: readonly ListId[],
    taskIds: readonly TaskId[],
  ) => void
  addList: (folderId: FolderId, name: string) => ListId
  changeList: (id: ListId, name: string, folderId: FolderId) => void
  removeList: (id: ListId, taskIds: readonly TaskId[]) => void
  addTask: (task: NewTask) => TaskId
  changeTask: (
    id: TaskId,
    content: TaskContent,
    listId: ListId,
    completionsReset: boolean,
  ) => void
  completeTask: (
    id: TaskId,
    at: number,
    nextDeadline: CalendarDay | null,
  ) => void
  reopenTask: (id: TaskId) => void
  removeTask: (id: TaskId) => void
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
    (id: FolderId, listIds: readonly ListId[], taskIds: readonly TaskId[]) =>
      client.removeFolder(id, listIds, taskIds),
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
    (id: ListId, taskIds: readonly TaskId[]) => client.removeList(id, taskIds),
    [client],
  )

  const addTask = useCallback((task: NewTask) => client.addTask(task), [client])

  const changeTask = useCallback(
    (
      id: TaskId,
      content: TaskContent,
      listId: ListId,
      completionsReset: boolean,
    ) => client.changeTask(id, content, listId, completionsReset),
    [client],
  )

  const completeTask = useCallback(
    (id: TaskId, at: number, nextDeadline: CalendarDay | null) =>
      client.completeTask(id, at, nextDeadline),
    [client],
  )

  const reopenTask = useCallback(
    (id: TaskId) => client.reopenTask(id),
    [client],
  )

  const removeTask = useCallback(
    (id: TaskId) => client.removeTask(id),
    [client],
  )

  return {
    folders: byName(knownOrganizer.folders),
    lists: byName(knownOrganizer.lists),
    tasks: knownOrganizer.tasks,
    addFolder,
    renameFolder,
    removeFolder,
    addList,
    changeList,
    removeList,
    addTask,
    changeTask,
    completeTask,
    reopenTask,
    removeTask,
  }
}
