import { spokenDateOf } from './calendarDay'
import { MAXIMUM_NAME_LENGTH, type InvalidNameReason } from './name'
import type { OpenTaskSummary } from './organizer'
import { MAXIMUM_DESCRIPTION_LENGTH } from './task'

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

export function folderDeletionHeading(
  name: string,
  listCount: number,
  taskCount: number,
): string {
  if (listCount === 0) return `Ordner ${name} löschen?`
  if (taskCount === 0)
    return `Ordner ${name} mit ${listCountLabel(listCount)} löschen?`
  return `Ordner ${name} mit ${listCountLabel(listCount)} und ${taskCountLabel(taskCount)} löschen?`
}

export function folderDeletionExplanation(
  listCount: number,
  taskCount: number,
): string {
  if (listCount === 0) return 'Er verschwindet auf allen Geräten.'
  if (taskCount === 0)
    return 'Er verschwindet mitsamt seinen Listen auf allen Geräten.'
  return 'Er verschwindet mitsamt seinen Listen und Aufgaben auf allen Geräten.'
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

export function listDeletionHeading(name: string, taskCount: number): string {
  if (taskCount === 0) return `Liste ${name} löschen?`
  return `Liste ${name} mit ${taskCountLabel(taskCount)} löschen?`
}

export function listDeletionExplanation(taskCount: number): string {
  if (taskCount === 0) return 'Sie verschwindet auf allen Geräten.'
  return 'Sie verschwindet mitsamt ihren Aufgaben auf allen Geräten.'
}

export function openTaskSummaryLabel({
  open,
  urgent,
}: OpenTaskSummary): string {
  if (urgent === 0) return `${open} offen`
  return `${open} offen, ${urgent} dringend`
}

export function taskCountLabel(count: number): string {
  return count === 1 ? '1 Aufgabe' : `${count} Aufgaben`
}

export function taskCreatedAnnouncement(name: string): string {
  return `Aufgabe ${name} angelegt.`
}

export function taskSavedAnnouncement(name: string): string {
  return `Aufgabe ${name} gespeichert.`
}

export function taskMovedAnnouncement(
  name: string,
  folderName: string,
  listName: string,
): string {
  return `Aufgabe ${name} nach ${folderName}, ${listName} verschoben.`
}

export function taskDeletedElsewhereAnnouncement(name: string): string {
  return `Aufgabe ${name} wurde gelöscht.`
}

export function taskCompletionHeading(name: string): string {
  return `${name} erledigen?`
}

export const TASK_COMPLETION_EXPLANATION =
  'Sie wandert in die erledigten Aufgaben.'

export function taskCompletedAnnouncement(name: string): string {
  return `${name} erledigt.`
}

export function taskReopenedAnnouncement(name: string): string {
  return `${name} wieder geöffnet.`
}

export function taskAlreadyCompletedAnnouncement(name: string): string {
  return `${name} wurde schon erledigt.`
}

export function completedOnLabel(at: number): string {
  return `erledigt am ${spokenDateOf(at)}`
}

export function taskDeletionHeading(name: string): string {
  return `Aufgabe ${name} löschen?`
}

export const TASK_DELETION_EXPLANATION = 'Sie verschwindet auf allen Geräten.'

export function taskDeletedAnnouncement(name: string): string {
  return `Aufgabe ${name} gelöscht.`
}

export function nameFailureMessage(reason: InvalidNameReason): string {
  switch (reason) {
    case 'empty':
      return 'Bitte einen Namen eingeben.'
    case 'tooLong':
      return `Der Name darf höchstens ${MAXIMUM_NAME_LENGTH} Zeichen lang sein.`
  }
}

export function descriptionFailureMessage(): string {
  return `Die Beschreibung darf höchstens ${MAXIMUM_DESCRIPTION_LENGTH} Zeichen lang sein.`
}
