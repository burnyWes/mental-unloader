import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import type { Folder, FolderId } from '../domain/folder'
import type { FoldersClient } from './foldersClient'

const FOLDERS = 'folders'

const WRITE_FAILED = 'Konnte nicht gespeichert werden.'
const LOAD_FAILED = 'Ordner konnten nicht geladen werden.'

function toFolder(id: FolderId, stored: DocumentData): Folder {
  return { id, name: String(stored.name ?? '') }
}

export function createFirestoreFoldersClient(
  firestore: Firestore,
  onFailure: (message: string) => void,
): FoldersClient {
  const folders = collection(firestore, FOLDERS)

  function folderDocument(id: FolderId) {
    return doc(firestore, FOLDERS, id)
  }

  function writeInBackground(write: Promise<void>) {
    write.catch(() => onFailure(WRITE_FAILED))
  }

  return {
    observeFolders(onFolders) {
      return onSnapshot(
        folders,
        (snapshot) => {
          onFolders(
            snapshot.docs.map((document) =>
              toFolder(document.id, document.data()),
            ),
          )
        },
        () => onFailure(LOAD_FAILED),
      )
    },

    addFolder(name) {
      const reference = doc(folders)
      writeInBackground(setDoc(reference, { name }))
      return reference.id
    },

    renameFolder(id, name) {
      writeInBackground(updateDoc(folderDocument(id), { name }))
    },

    removeFolder(id) {
      writeInBackground(deleteDoc(folderDocument(id)))
    },
  }
}
