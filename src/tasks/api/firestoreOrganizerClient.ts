import {
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  onSnapshotsInSync,
  setDoc,
  updateDoc,
  writeBatch,
  type CollectionReference,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import { calendarDayOf } from '../domain/calendarDay'
import type { Folder, FolderId } from '../domain/folder'
import type { List, ListId } from '../domain/list'
import type { Due, Task, TaskContent, TaskId } from '../domain/task'
import type { NewTask, OrganizerClient } from './organizerClient'

const FOLDERS = 'folders'
const LISTS = 'lists'
const TASKS = 'tasks'

const WRITE_FAILED = 'Konnte nicht gespeichert werden.'
const LOAD_FAILED = 'Ordner, Listen und Aufgaben konnten nicht geladen werden.'

function toFolder(id: FolderId, stored: DocumentData): Folder {
  return { id, name: String(stored.name ?? '') }
}

function toList(id: ListId, stored: DocumentData): List {
  return {
    id,
    name: String(stored.name ?? ''),
    folderId: String(stored.folderId ?? ''),
  }
}

function toCreatedAt(stored: DocumentData): number {
  return typeof stored.createdAt === 'number' ? stored.createdAt : 0
}

function toDue(stored: DocumentData, createdAt: number): Due {
  if (stored.due !== 'urgent') return { kind: 'someday' }
  const since =
    typeof stored.urgentSince === 'string'
      ? stored.urgentSince
      : calendarDayOf(new Date(createdAt))
  return { kind: 'urgent', since }
}

function toCompletions(stored: DocumentData): readonly number[] {
  if (!Array.isArray(stored.completions)) return []
  return stored.completions.filter(
    (completion): completion is number => typeof completion === 'number',
  )
}

function toTask(id: TaskId, stored: DocumentData): Task {
  const createdAt = toCreatedAt(stored)
  return {
    id,
    listId: String(stored.listId ?? ''),
    name: String(stored.name ?? ''),
    description: String(stored.description ?? ''),
    due: toDue(stored, createdAt),
    createdAt,
    completions: toCompletions(stored),
  }
}

function storedUrgentSince(due: Due): DocumentData {
  return due.kind === 'urgent' ? { urgentSince: due.since } : {}
}

function newStoredTask(task: NewTask): DocumentData {
  return {
    listId: task.listId,
    name: task.name,
    description: task.description,
    due: task.due.kind,
    ...storedUrgentSince(task.due),
    createdAt: task.createdAt,
    completions: [],
  }
}

function changedStoredTask(content: TaskContent, listId: ListId): DocumentData {
  return {
    listId,
    name: content.name,
    description: content.description,
    due: content.due.kind,
    urgentSince:
      content.due.kind === 'urgent' ? content.due.since : deleteField(),
  }
}

export function createFirestoreOrganizerClient(
  firestore: Firestore,
  onFailure: (message: string) => void,
): OrganizerClient {
  const folders = collection(firestore, FOLDERS)
  const lists = collection(firestore, LISTS)
  const tasks = collection(firestore, TASKS)

  function folderDocument(id: FolderId) {
    return doc(firestore, FOLDERS, id)
  }

  function listDocument(id: ListId) {
    return doc(firestore, LISTS, id)
  }

  function taskDocument(id: TaskId) {
    return doc(firestore, TASKS, id)
  }

  function writeInBackground(write: Promise<void>) {
    write.catch(() => onFailure(WRITE_FAILED))
  }

  return {
    observeOrganizer(onOrganizer) {
      let knownFolders: readonly Folder[] | null = null
      let knownLists: readonly List[] | null = null
      let knownTasks: readonly Task[] | null = null
      let changedSinceReport = false
      let loadFailureReported = false

      function reportWhenAllArrived() {
        if (knownFolders === null || knownLists === null || knownTasks === null)
          return
        if (!changedSinceReport) return
        changedSinceReport = false
        onOrganizer({
          folders: knownFolders,
          lists: knownLists,
          tasks: knownTasks,
        })
      }

      function reportLoadFailure() {
        if (!loadFailureReported) onFailure(LOAD_FAILED)
        loadFailureReported = true
      }

      function observeCollection<Known>(
        reference: CollectionReference,
        toKnown: (id: string, stored: DocumentData) => Known,
        onKnown: (known: readonly Known[]) => void,
      ) {
        return onSnapshot(
          reference,
          (snapshot) => {
            changedSinceReport = true
            onKnown(
              snapshot.docs.map((document) =>
                toKnown(document.id, document.data()),
              ),
            )
          },
          () => {
            changedSinceReport = true
            onKnown([])
            reportLoadFailure()
            reportWhenAllArrived()
          },
        )
      }

      const stopFolders = observeCollection(folders, toFolder, (known) => {
        knownFolders = known
      })
      const stopLists = observeCollection(lists, toList, (known) => {
        knownLists = known
      })
      const stopTasks = observeCollection(tasks, toTask, (known) => {
        knownTasks = known
      })
      const stopSync = onSnapshotsInSync(firestore, reportWhenAllArrived)

      return () => {
        stopSync()
        stopFolders()
        stopLists()
        stopTasks()
      }
    },

    addFolder(name) {
      const reference = doc(folders)
      writeInBackground(setDoc(reference, { name }))
      return reference.id
    },

    renameFolder(id, name) {
      writeInBackground(updateDoc(folderDocument(id), { name }))
    },

    removeFolder(id, listIds, taskIds) {
      const batch = writeBatch(firestore)
      batch.delete(folderDocument(id))
      listIds.forEach((listId) => batch.delete(listDocument(listId)))
      taskIds.forEach((taskId) => batch.delete(taskDocument(taskId)))
      writeInBackground(batch.commit())
    },

    addList(folderId, name) {
      const reference = doc(lists)
      writeInBackground(setDoc(reference, { name, folderId }))
      return reference.id
    },

    changeList(id, name, folderId) {
      writeInBackground(updateDoc(listDocument(id), { name, folderId }))
    },

    removeList(id, taskIds) {
      const batch = writeBatch(firestore)
      batch.delete(listDocument(id))
      taskIds.forEach((taskId) => batch.delete(taskDocument(taskId)))
      writeInBackground(batch.commit())
    },

    addTask(task) {
      const reference = doc(tasks)
      writeInBackground(setDoc(reference, newStoredTask(task)))
      return reference.id
    },

    changeTask(id, content, listId) {
      writeInBackground(
        updateDoc(taskDocument(id), changedStoredTask(content, listId)),
      )
    },

    completeTask(id, at) {
      writeInBackground(
        updateDoc(taskDocument(id), { completions: arrayUnion(at) }),
      )
    },

    reopenTask(id) {
      writeInBackground(updateDoc(taskDocument(id), { completions: [] }))
    },

    removeTask(id) {
      writeInBackground(deleteDoc(taskDocument(id)))
    },
  }
}
