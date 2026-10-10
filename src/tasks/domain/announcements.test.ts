import { describe, expect, it } from 'vitest'
import {
  folderCreatedAnnouncement,
  folderDeletedAnnouncement,
  folderDeletedElsewhereAnnouncement,
  folderDeletionExplanation,
  folderDeletionHeading,
  folderSavedAnnouncement,
  LIST_DELETION_EXPLANATION,
  listCountLabel,
  listCreatedAnnouncement,
  listDeletedAnnouncement,
  listDeletedElsewhereAnnouncement,
  listDeletionHeading,
  listMovedAnnouncement,
  listSavedAnnouncement,
  nameFailureMessage,
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

  it.each([
    [0, 'Ordner Familie löschen?'],
    [1, 'Ordner Familie mit 1 Liste löschen?'],
    [3, 'Ordner Familie mit 3 Listen löschen?'],
  ])('asks before deleting a folder with %i lists', (listCount, asked) => {
    expect(folderDeletionHeading('Familie', listCount)).toBe(asked)
  })

  it('explains that a deleted folder vanishes everywhere', () => {
    expect(folderDeletionExplanation(0)).toBe(
      'Er verschwindet auf allen Geräten.',
    )
  })

  it('explains that a deleted folder takes its lists along', () => {
    expect(folderDeletionExplanation(3)).toBe(
      'Er verschwindet mitsamt seinen Listen auf allen Geräten.',
    )
  })

  it('asks for a name when none was written', () => {
    expect(nameFailureMessage('empty')).toBe('Bitte einen Namen eingeben.')
  })

  it('names the maximum length of a name that is too long', () => {
    expect(nameFailureMessage('tooLong')).toBe(
      'Der Name darf höchstens 100 Zeichen lang sein.',
    )
  })
})

describe('list announcements', () => {
  it('counts a single list', () => {
    expect(listCountLabel(1)).toBe('1 Liste')
  })

  it('counts several lists', () => {
    expect(listCountLabel(2)).toBe('2 Listen')
  })

  it('announces a created list', () => {
    expect(listCreatedAnnouncement('Haushalt')).toBe('Liste Haushalt angelegt.')
  })

  it('announces a saved list', () => {
    expect(listSavedAnnouncement('Haushalt')).toBe(
      'Liste Haushalt gespeichert.',
    )
  })

  it('announces a list moved to another folder', () => {
    expect(listMovedAnnouncement('Haushalt', 'Garten')).toBe(
      'Liste Haushalt nach Garten verschoben.',
    )
  })

  it('announces a list deleted here', () => {
    expect(listDeletedAnnouncement('Haushalt')).toBe('Liste Haushalt gelöscht.')
  })

  it('announces a list deleted on another device', () => {
    expect(listDeletedElsewhereAnnouncement('Haushalt')).toBe(
      'Liste Haushalt wurde gelöscht.',
    )
  })

  it('asks before deleting a list', () => {
    expect(listDeletionHeading('Haushalt')).toBe('Liste Haushalt löschen?')
  })

  it('explains that a deleted list vanishes everywhere', () => {
    expect(LIST_DELETION_EXPLANATION).toBe(
      'Sie verschwindet auf allen Geräten.',
    )
  })
})
