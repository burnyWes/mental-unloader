import { describe, expect, it } from 'vitest'
import {
  FOLDER_DELETION_EXPLANATION,
  folderCreatedAnnouncement,
  folderDeletedAnnouncement,
  folderDeletedElsewhereAnnouncement,
  folderDeletionHeading,
  folderNameFailureMessage,
  folderSavedAnnouncement,
} from './announcements'

describe('folder announcements', () => {
  it('announces a created folder', () => {
    expect(folderCreatedAnnouncement('Familie')).toBe(
      'Ordner Familie angelegt.',
    )
  })

  it('announces a saved folder', () => {
    expect(folderSavedAnnouncement('Familie')).toBe(
      'Ordner Familie gespeichert.',
    )
  })

  it('announces a folder deleted here', () => {
    expect(folderDeletedAnnouncement('Familie')).toBe(
      'Ordner Familie gelöscht.',
    )
  })

  it('announces a folder deleted on another device', () => {
    expect(folderDeletedElsewhereAnnouncement('Familie')).toBe(
      'Ordner Familie wurde gelöscht.',
    )
  })

  it('asks before deleting a folder', () => {
    expect(folderDeletionHeading('Familie')).toBe('Ordner Familie löschen?')
  })

  it('explains that a deleted folder vanishes everywhere', () => {
    expect(FOLDER_DELETION_EXPLANATION).toBe(
      'Er verschwindet auf allen Geräten.',
    )
  })

  it('asks for a name when none was written', () => {
    expect(folderNameFailureMessage('empty')).toBe(
      'Bitte einen Namen eingeben.',
    )
  })

  it('names the maximum length of a name that is too long', () => {
    expect(folderNameFailureMessage('tooLong')).toBe(
      'Der Name darf höchstens 100 Zeichen lang sein.',
    )
  })
})
