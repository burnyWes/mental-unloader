import { MAXIMUM_NAME_LENGTH, type InvalidNameReason } from './name'

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

export function folderDeletionHeading(name: string, listCount: number): string {
  if (listCount === 0) return `Ordner ${name} löschen?`
  return `Ordner ${name} mit ${listCountLabel(listCount)} löschen?`
}

export function folderDeletionExplanation(listCount: number): string {
  if (listCount === 0) return 'Er verschwindet auf allen Geräten.'
  return 'Er verschwindet mitsamt seinen Listen auf allen Geräten.'
}

export function listCountLabel(count: number): string {
  return count === 1 ? '1 Liste' : `${count} Listen`
}

export function listCreatedAnnouncement(name: string): string {
  return `Liste ${name} angelegt.`
}

export function listSavedAnnouncement(name: string): string {
  return `Liste ${name} gespeichert.`
}

export function listMovedAnnouncement(
  name: string,
  folderName: string,
): string {
  return `Liste ${name} nach ${folderName} verschoben.`
}

export function listDeletedAnnouncement(name: string): string {
  return `Liste ${name} gelöscht.`
}

export function listDeletedElsewhereAnnouncement(name: string): string {
  return `Liste ${name} wurde gelöscht.`
}

export function listDeletionHeading(name: string): string {
  return `Liste ${name} löschen?`
}

export const LIST_DELETION_EXPLANATION = 'Sie verschwindet auf allen Geräten.'

export function nameFailureMessage(reason: InvalidNameReason): string {
  switch (reason) {
    case 'empty':
      return 'Bitte einen Namen eingeben.'
    case 'tooLong':
      return `Der Name darf höchstens ${MAXIMUM_NAME_LENGTH} Zeichen lang sein.`
  }
}
