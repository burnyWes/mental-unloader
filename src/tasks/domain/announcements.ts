import {
  MAXIMUM_FOLDER_NAME_LENGTH,
  type InvalidFolderNameReason,
} from './folder'

export function folderCreatedAnnouncement(name: string): string {
  return `Ordner ${name} angelegt.`
}

export function folderSavedAnnouncement(name: string): string {
  return `Ordner ${name} gespeichert.`
}

export function folderDeletedAnnouncement(name: string): string {
  return `Ordner ${name} gelöscht.`
}

export function folderDeletedElsewhereAnnouncement(name: string): string {
  return `Ordner ${name} wurde gelöscht.`
}

export function folderDeletionHeading(name: string): string {
  return `Ordner ${name} löschen?`
}

export const FOLDER_DELETION_EXPLANATION = 'Er verschwindet auf allen Geräten.'

export function folderNameFailureMessage(
  reason: InvalidFolderNameReason,
): string {
  switch (reason) {
    case 'empty':
      return 'Bitte einen Namen eingeben.'
    case 'tooLong':
      return `Der Name darf höchstens ${MAXIMUM_FOLDER_NAME_LENGTH} Zeichen lang sein.`
  }
}
