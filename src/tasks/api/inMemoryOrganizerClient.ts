import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import type { Organizer } from '../domain/organizer'
import type { CalendarDay } from '../domain/calendarDay'
import type { Due, Task } from '../domain/task'
import type { OrganizerClient } from './organizerClient'

export type InMemoryOrganizerClient = OrganizerClient & {
  arrivesFromElsewhere(organizer: Partial<Organizer>): void
  storedFolders(): readonly Folder[]
  storedLists(): readonly List[]
  storedTasks(): readonly Task[]
  holdBackSnapshots(): void
  releaseSnapshots(): void
}

function dueMovedTo(due: Due, nextDeadline: CalendarDay | null): Due {
  if (due.kind !== 'deadline' || nextDeadline === null) return due
  return { ...due, deadline: nextDeadline }
}

export function createInMemoryOrganizerClient({
  folders: initialFolders = [],
  lists: initialLists = [],
  tasks: initialTasks = [],
}: Partial<Organizer> = {}): InMemoryOrganizerClient {
  let folders = [...initialFolders]
  let lists = [...initialLists]
  let tasks = [...initialTasks]
  let nextFolderId = 1
  let nextListId = 1
  let nextTaskId = 1
  let snapshotsHeldBack = false
  const listeners = new Set<(organizer: Organizer) => void>()

  function currentOrganizer(): Organizer {
    return { folders: [...folders], lists: [...lists], tasks: [...tasks] }
  }

  function publish() {
    if (snapshotsHeldBack) return
    listeners.forEach((listener) => listener(currentOrganizer()))
  }

  return {
    observeOrganizer(onOrganizer) {
      listeners.add(onOrganizer)
      onOrganizer(currentOrganizer())
      return () => listeners.delete(onOrganizer)
    },
    addFolder(name) {
      const id = `folder-${nextFolderId}`
      nextFolderId += 1
      folders = [...folders, { id, name }]
      publish()
      return id
    },
    renameFolder(id, name) {
      folders = folders.map((folder) =>
        folder.id === id ? { id, name } : folder,
      )
      publish()
    },
    removeFolder(id, listIds, taskIds) {
      folders = folders.filter((folder) => folder.id !== id)
      lists = lists.filter((list) => !listIds.includes(list.id))
      tasks = tasks.filter((task) => !taskIds.includes(task.id))
      publish()
    },
    addList(folderId, name) {
      const id = `list-${nextListId}`
      nextListId += 1
      lists = [...lists, { id, name, folderId }]
      publish()
      return id
    },
    changeList(id, name, folderId) {
      lists = lists.map((list) =>
        list.id === id ? { id, name, folderId } : list,
      )
      publish()
    },
    removeList(id, taskIds) {
      lists = lists.filter((list) => list.id !== id)
      tasks = tasks.filter((task) => !taskIds.includes(task.id))
      publish()
    },
    addTask(newTask) {
      const id = `task-${nextTaskId}`
      nextTaskId += 1
      tasks = [...tasks, { id, ...newTask, completions: [] }]
      publish()
      return id
    },
    changeTask(id, content, listId, completionsReset) {
      tasks = tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              ...content,
              listId,
              completions: completionsReset ? [] : task.completions,
            }
          : task,
      )
      publish()
    },
    completeTask(id, at, nextDeadline) {
      tasks = tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              due: dueMovedTo(task.due, nextDeadline),
              completions: [...task.completions, at],
            }
          : task,
      )
      publish()
    },
    reopenTask(id) {
      tasks = tasks.map((task) =>
        task.id === id ? { ...task, completions: [] } : task,
      )
      publish()
    },
    removeTask(id) {
      tasks = tasks.filter((task) => task.id !== id)
      publish()
    },
    arrivesFromElsewhere(arriving) {
      folders = [...(arriving.folders ?? folders)]
      lists = [...(arriving.lists ?? lists)]
      tasks = [...(arriving.tasks ?? tasks)]
      publish()
    },
    storedFolders() {
      return [...folders]
    },
    storedLists() {
      return [...lists]
    },
    storedTasks() {
      return [...tasks]
    },
    holdBackSnapshots() {
      snapshotsHeldBack = true
    },
    releaseSnapshots() {
      snapshotsHeldBack = false
      publish()
    },
  }
}
