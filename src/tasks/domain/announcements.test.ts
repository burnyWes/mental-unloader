import { describe, expect, it } from 'vitest'
import {
  descriptionFailureMessage,
  folderCreatedAnnouncement,
  folderDeletedAnnouncement,
  folderDeletedElsewhereAnnouncement,
  folderDeletionExplanation,
  folderDeletionHeading,
  folderSavedAnnouncement,
  listCountLabel,
  listCreatedAnnouncement,
  listDeletedAnnouncement,
  listDeletedElsewhereAnnouncement,
  listDeletionExplanation,
  listDeletionHeading,
  listMovedAnnouncement,
  listSavedAnnouncement,
  completedOnLabel,
  nameFailureMessage,
  openTaskSummaryLabel,
  TASK_COMPLETION_EXPLANATION,
  TASK_DELETION_EXPLANATION,
  taskAlreadyCompletedAnnouncement,
  taskCompletedAnnouncement,
  taskCompletionHeading,
  taskCountLabel,
  taskCreatedAnnouncement,
  taskDeletedAnnouncement,
  taskDeletedElsewhereAnnouncement,
  taskDeletionHeading,
  taskMovedAnnouncement,
  taskReopenedAnnouncement,
  taskSavedAnnouncement,
} from './announcements'

describe('task completion announcements', () => {
  it('asks before completing a task', () => {
    expect(taskCompletionHeading('Müll rausbringen')).toBe(
      'Müll rausbringen erledigen?',
    )
  })

  it('explains where a completed task goes', () => {
    expect(TASK_COMPLETION_EXPLANATION).toBe(
      'Sie wandert in die erledigten Aufgaben.',
    )
  })

  it('announces a completed task', () => {
    expect(taskCompletedAnnouncement('Müll rausbringen')).toBe(
      'Müll rausbringen erledigt.',
    )
  })

  it('announces a reopened task', () => {
    expect(taskReopenedAnnouncement('Müll rausbringen')).toBe(
      'Müll rausbringen wieder geöffnet.',
    )
  })

  it('announces a task completed on another device meanwhile', () => {
    expect(taskAlreadyCompletedAnnouncement('Müll rausbringen')).toBe(
      'Müll rausbringen wurde schon erledigt.',
    )
  })

  it('names the day a task was completed', () => {
    expect(completedOnLabel(new Date(2026, 9, 10, 9, 0).getTime())).toBe(
      'erledigt am 10. Oktober',
    )
  })
})

describe('task deletion announcements', () => {
  it('asks before deleting a task', () => {
    expect(taskDeletionHeading('Müll rausbringen')).toBe(
      'Aufgabe Müll rausbringen löschen?',
    )
  })

  it('explains that a deleted task vanishes everywhere', () => {
    expect(TASK_DELETION_EXPLANATION).toBe(
      'Sie verschwindet auf allen Geräten.',
    )
  })

  it('announces a task deleted here', () => {
    expect(taskDeletedAnnouncement('Müll rausbringen')).toBe(
      'Aufgabe Müll rausbringen gelöscht.',
    )
  })
})

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
    [0, 0, 'Ordner Familie löschen?'],
    [1, 0, 'Ordner Familie mit 1 Liste löschen?'],
    [3, 0, 'Ordner Familie mit 3 Listen löschen?'],
    [1, 1, 'Ordner Familie mit 1 Liste und 1 Aufgabe löschen?'],
    [3, 17, 'Ordner Familie mit 3 Listen und 17 Aufgaben löschen?'],
  ])(
    'asks before deleting a folder with %i lists and %i tasks',
    (listCount, taskCount, asked) => {
      expect(folderDeletionHeading('Familie', listCount, taskCount)).toBe(asked)
    },
  )

  it('explains that a deleted folder vanishes everywhere', () => {
    expect(folderDeletionExplanation(0, 0)).toBe(
      'Er verschwindet auf allen Geräten.',
    )
  })

  it('explains that a deleted folder takes its lists along', () => {
    expect(folderDeletionExplanation(3, 0)).toBe(
      'Er verschwindet mitsamt seinen Listen auf allen Geräten.',
    )
  })

  it('explains that a deleted folder takes its lists and tasks along', () => {
    expect(folderDeletionExplanation(3, 17)).toBe(
      'Er verschwindet mitsamt seinen Listen und Aufgaben auf allen Geräten.',
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

  it.each([
    [0, 'Liste Haushalt löschen?'],
    [1, 'Liste Haushalt mit 1 Aufgabe löschen?'],
    [5, 'Liste Haushalt mit 5 Aufgaben löschen?'],
  ])('asks before deleting a list with %i tasks', (taskCount, asked) => {
    expect(listDeletionHeading('Haushalt', taskCount)).toBe(asked)
  })

  it('explains that a deleted list vanishes everywhere', () => {
    expect(listDeletionExplanation(0)).toBe(
      'Sie verschwindet auf allen Geräten.',
    )
  })

  it('explains that a deleted list takes its tasks along', () => {
    expect(listDeletionExplanation(5)).toBe(
      'Sie verschwindet mitsamt ihren Aufgaben auf allen Geräten.',
    )
  })

  it('counts the open tasks of a list without urgent ones', () => {
    expect(openTaskSummaryLabel({ open: 5, urgent: 0 })).toBe('5 offen')
  })

  it('counts the open and the urgent tasks of a list', () => {
    expect(openTaskSummaryLabel({ open: 5, urgent: 2 })).toBe(
      '5 offen, 2 dringend',
    )
  })
})

describe('task announcements', () => {
  it('counts a single task', () => {
    expect(taskCountLabel(1)).toBe('1 Aufgabe')
  })

  it('counts several tasks', () => {
    expect(taskCountLabel(5)).toBe('5 Aufgaben')
  })

  it('announces a created task', () => {
    expect(taskCreatedAnnouncement('Müll rausbringen')).toBe(
      'Aufgabe Müll rausbringen angelegt.',
    )
  })

  it('announces a saved task', () => {
    expect(taskSavedAnnouncement('Müll rausbringen')).toBe(
      'Aufgabe Müll rausbringen gespeichert.',
    )
  })

  it('announces a task moved to a list of a folder', () => {
    expect(taskMovedAnnouncement('Müll rausbringen', 'Garten', 'Beete')).toBe(
      'Aufgabe Müll rausbringen nach Garten, Beete verschoben.',
    )
  })

  it('announces a task deleted on another device', () => {
    expect(taskDeletedElsewhereAnnouncement('Müll rausbringen')).toBe(
      'Aufgabe Müll rausbringen wurde gelöscht.',
    )
  })

  it('names the maximum length of a description that is too long', () => {
    expect(descriptionFailureMessage()).toBe(
      'Die Beschreibung darf höchstens 2000 Zeichen lang sein.',
    )
  })
})
