import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  onSnapshotsInSync,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QuerySnapshot,
} from 'firebase/firestore'
import type { Folder, FolderId } from '../domain/folder'
import type { List, ListId } from '../domain/list'
import type { OrganizerClient } from './organizerClient'

const FOLDERS = 'folders'
const LISTS = 'lists'

const WRITE_FAILED = 'Konnte nicht gespeichert werden.'
const LOAD_FAILED = 'Ordner und Listen konnten nicht geladen werden.'

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

export function createFirestoreOrganizerClient(
  firestore: Firestore,
  onFailure: (message: string) => void,
): OrganizerClient {
  const folders = collection(firestore, FOLDERS)
  const lists = collection(firestore, LISTS)

  function folderDocument(id: FolderId) {
    return doc(firestore, FOLDERS, id)
  }

  function listDocument(id: ListId) {
    return doc(firestore, LISTS, id)
  }

  function writeInBackground(write: Promise<void>) {
    write.catch(() => onFailure(WRITE_FAILED))
  }

  return {
    observeOrganizer(onOrganizer) {
      let knownFolders: readonly Folder[] | null = null
      let knownLists: readonly List[] | null = null
      let changedSinceReport = false
      let loadFailureReported = false

      function reportWhenBothArrived() {
        if (knownFolders === null || knownLists === null) return
        if (!changedSinceReport) return
        changedSinceReport = false
        onOrganizer({ folders: knownFolders, lists: knownLists })
      }

      function reportLoadFailure() {
        if (!loadFailureReported) onFailure(LOAD_FAILED)
        loadFailureReported = true
      }

      function documentsOf<Known>(
        snapshot: QuerySnapshot,
        toKnown: (id: string, stored: DocumentData) => Known,
      ): readonly Known[] {
        changedSinceReport = true
        return snapshot.docs.map((document) =>
          toKnown(document.id, document.data()),
        )
      }

      const stopFolders = onSnapshot(
        folders,
        (snapshot) => {
          knownFolders = documentsOf(snapshot, toFolder)
        },
        () => {
          knownFolders = []
          changedSinceReport = true
          reportLoadFailure()
          reportWhenBothArrived()
        },
      )
      const stopLists = onSnapshot(
        lists,
        (snapshot) => {
          knownLists = documentsOf(snapshot, toList)
        },
        () => {
          knownLists = []
          changedSinceReport = true
          reportLoadFailure()
          reportWhenBothArrived()
        },
      )
      const stopSync = onSnapshotsInSync(firestore, reportWhenBothArrived)

      return () => {
        stopSync()
        stopFolders()
        stopLists()
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

    removeFolder(id, listIds) {
      const batch = writeBatch(firestore)
      batch.delete(folderDocument(id))
      listIds.forEach((listId) => batch.delete(listDocument(listId)))
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

    removeList(id) {
      writeInBackground(deleteDoc(listDocument(id)))
    },
  }
}
