import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  installFakeViewTransitions,
  type FakeViewTransitions,
} from '../../testSupport/fakeViewTransitions'
import {
  descriptionFailureMessage,
  folderDeletedAnnouncement,
  listDeletedAnnouncement,
} from '../domain/announcements'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import { MAXIMUM_DESCRIPTION_LENGTH, type Task } from '../domain/task'
import {
  announced,
  button,
  buttonNamedFirst,
  filterButtonNamed,
  heading,
  renderFoldersArea,
} from './foldersAreaHarness'

const familie: Folder = { id: 'stored-1', name: 'Familie' }

const haushalt: List = {
  id: 'stored-list-1',
  name: 'Haushalt',
  folderId: familie.id,
}

const garten: Folder = { id: 'stored-2', name: 'Garten' }

const keller: Task = {
  id: 'stored-task-1',
  listId: haushalt.id,
  name: 'Keller aufräumen',
  description: '',
  due: { kind: 'someday' },
  createdAt: 0,
  completions: [],
}

describe('sliding between the pages of the folders area', () => {
  let viewTransitions: FakeViewTransitions

  beforeEach(() => {
    viewTransitions = installFakeViewTransitions()
  })

  afterEach(() => {
    viewTransitions.uninstall()
  })

  async function slideBy(element: HTMLElement) {
    await userEvent.click(element)
    viewTransitions.finishPendingUpdates()
  }

  async function slideIntoList() {
    await slideBy(buttonNamedFirst('Familie'))
    await slideBy(buttonNamedFirst('Haushalt'))
  }

  it('slides forward from the overview into a folder and back', async () => {
    renderFoldersArea([familie])

    await slideBy(buttonNamedFirst('Familie'))
    expect(heading('Familie')).toHaveFocus()
    await slideBy(button('Zurück'))

    expect(heading('Ordner')).toBeInTheDocument()
    expect(viewTransitions.directions()).toEqual(['forward', 'back'])
  })

  it('slides forward from a folder into a list and back', async () => {
    renderFoldersArea([familie], [haushalt])

    await slideIntoList()
    expect(heading('Haushalt')).toHaveFocus()
    await slideBy(button('Zurück'))

    expect(heading('Familie')).toBeInTheDocument()
    expect(viewTransitions.directions()).toEqual(['forward', 'forward', 'back'])
  })

  it('slides forward from a list into a task and back', async () => {
    renderFoldersArea([familie], [haushalt], [keller])
    await slideIntoList()

    await slideBy(buttonNamedFirst('Keller aufräumen'))
    expect(heading('Keller aufräumen')).toBeInTheDocument()
    await slideBy(button('Zurück'))

    expect(heading('Haushalt')).toBeInTheDocument()
    expect(viewTransitions.directions()).toEqual([
      'forward',
      'forward',
      'forward',
      'back',
    ])
  })

  it('slides the lists of a folder sideways when switching the status filter', async () => {
    renderFoldersArea([familie], [haushalt])
    await slideBy(buttonNamedFirst('Familie'))

    await slideBy(filterButtonNamed('erledigt'))
    expect(screen.getByText('Noch keine Liste erledigt.')).toBeInTheDocument()
    await slideBy(filterButtonNamed('offen'))

    expect(buttonNamedFirst('Haushalt')).toBeInTheDocument()
    expect(viewTransitions.directions()).toEqual([
      'forward',
      'itemsForward',
      'itemsBack',
    ])
  })

  it('slides the tasks of a list sideways when switching the status filter', async () => {
    renderFoldersArea([familie], [haushalt], [keller])
    await slideIntoList()

    await slideBy(filterButtonNamed('erledigt'))
    await slideBy(filterButtonNamed('offen'))

    expect(buttonNamedFirst('Keller aufräumen')).toBeInTheDocument()
    expect(viewTransitions.directions()).toEqual([
      'forward',
      'forward',
      'itemsForward',
      'itemsBack',
    ])
  })

  it('does not slide when choosing the filter already shown', async () => {
    renderFoldersArea([familie], [haushalt])
    await slideBy(buttonNamedFirst('Familie'))

    await userEvent.click(filterButtonNamed('offen'))

    expect(viewTransitions.directions()).toEqual(['forward'])
  })

  it('keeps focus behavior when sliding', async () => {
    renderFoldersArea([familie], [haushalt])
    await slideIntoList()

    await slideBy(button('Zurück'))

    expect(buttonNamedFirst('Haushalt')).toHaveFocus()
  })

  it('slides forward into the create folder form and back on save', async () => {
    renderFoldersArea()

    await slideBy(button('Ordner anlegen'))
    await userEvent.type(screen.getByLabelText('Name'), 'Familie')
    await slideBy(button('Speichern'))

    expect(buttonNamedFirst('Familie')).toHaveFocus()
    expect(viewTransitions.directions()).toEqual(['forward', 'back'])
  })

  it('slides through folder editing and deletion confirmation', async () => {
    renderFoldersArea([familie])
    await slideBy(buttonNamedFirst('Familie'))

    await slideBy(button('Ordner bearbeiten'))
    await slideBy(button('Löschen'))
    await slideBy(button('Abbrechen'))
    await slideBy(button('Löschen'))
    await slideBy(button('Löschen'))

    expect(heading('Ordner')).toBeInTheDocument()
    expect(viewTransitions.directions()).toEqual([
      'forward',
      'forward',
      'forward',
      'back',
      'forward',
      'back',
    ])
  })

  it('deletes a folder only once the slide updates the page', async () => {
    const { client } = renderFoldersArea([familie])
    await slideBy(buttonNamedFirst('Familie'))
    await slideBy(button('Ordner bearbeiten'))
    await slideBy(button('Löschen'))

    await userEvent.click(button('Löschen'))

    expect(heading('Ordner Familie löschen?')).toBeInTheDocument()
    expect(client.storedFolders()).toEqual([familie])

    viewTransitions.finishPendingUpdates()

    expect(heading('Ordner')).toBeInTheDocument()
    expect(client.storedFolders()).toEqual([])
    expect(announced()).toHaveTextContent(folderDeletedAnnouncement('Familie'))
  })

  it('deletes a list only once the slide updates the page', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await slideIntoList()
    await slideBy(button('Liste bearbeiten'))
    await slideBy(button('Löschen'))

    await userEvent.click(button('Löschen'))

    expect(heading('Liste Haushalt löschen?')).toBeInTheDocument()
    expect(client.storedLists()).toEqual([haushalt])

    viewTransitions.finishPendingUpdates()

    expect(heading('Familie')).toBeInTheDocument()
    expect(client.storedLists()).toEqual([])
    expect(announced()).toHaveTextContent(listDeletedAnnouncement('Haushalt'))
  })

  it('slides for list creation, list editing and task creation', async () => {
    renderFoldersArea([familie], [haushalt])
    await slideBy(buttonNamedFirst('Familie'))

    await slideBy(button('Liste anlegen'))
    await slideBy(button('Zurück'))
    await slideBy(buttonNamedFirst('Haushalt'))
    await slideBy(button('Liste bearbeiten'))
    await slideBy(button('Speichern'))
    await slideBy(button('Aufgabe anlegen'))
    await userEvent.type(screen.getByLabelText('Name'), 'Keller aufräumen')
    await slideBy(button('Speichern'))

    expect(heading('Haushalt')).toBeInTheDocument()
    expect(viewTransitions.directions()).toEqual([
      'forward',
      'forward',
      'back',
      'forward',
      'forward',
      'back',
      'forward',
      'back',
    ])
  })

  it('does not slide while typing a name or choosing a folder', async () => {
    renderFoldersArea([familie, garten], [haushalt])
    await slideIntoList()
    await slideBy(button('Liste bearbeiten'))

    await userEvent.type(screen.getByLabelText('Name'), ' neu')
    await userEvent.selectOptions(
      screen.getByLabelText('Ordner', { exact: true }),
      'Garten',
    )

    expect(viewTransitions.directions()).toEqual([
      'forward',
      'forward',
      'forward',
    ])
  })

  const EMPTY_NAME_FAILURE = 'Bitte einen Namen eingeben.'

  function expectFailureInField(failure: string, field: HTMLElement) {
    expect(screen.getByText(failure)).toBeInTheDocument()
    expect(announced()).toHaveTextContent(failure)
    expect(field).toHaveFocus()
  }

  async function saveWithoutName() {
    await userEvent.clear(screen.getByLabelText('Name'))
    await slideBy(button('Speichern'))
  }

  it('stays on the folder form with a failure when saving an empty name while sliding', async () => {
    const { client } = renderFoldersArea()
    await slideBy(button('Ordner anlegen'))

    await saveWithoutName()

    expect(heading('Ordner anlegen')).toBeInTheDocument()
    expectFailureInField(EMPTY_NAME_FAILURE, screen.getByLabelText('Name'))
    expect(viewTransitions.directions()).toEqual(['forward'])
    expect(client.storedFolders()).toEqual([])
  })

  it('stays on the list form with a failure when saving an empty name while sliding', async () => {
    renderFoldersArea([familie], [haushalt])
    await slideIntoList()
    await slideBy(button('Liste bearbeiten'))

    await saveWithoutName()

    expect(heading('Liste bearbeiten')).toBeInTheDocument()
    expectFailureInField(EMPTY_NAME_FAILURE, screen.getByLabelText('Name'))
    expect(viewTransitions.directions()).toEqual([
      'forward',
      'forward',
      'forward',
    ])
  })

  it('stays on the task form with a failure when saving an empty name while sliding', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await slideIntoList()
    await slideBy(button('Aufgabe anlegen'))

    await saveWithoutName()

    expect(heading('Aufgabe anlegen')).toBeInTheDocument()
    expectFailureInField(EMPTY_NAME_FAILURE, screen.getByLabelText('Name'))
    expect(viewTransitions.directions()).toEqual([
      'forward',
      'forward',
      'forward',
    ])
    expect(client.storedTasks()).toEqual([])
  })

  it('stays on the task form with a failure when the description is too long while sliding', async () => {
    renderFoldersArea([familie], [haushalt], [keller])
    await slideIntoList()
    await slideBy(buttonNamedFirst('Keller aufräumen'))
    await slideBy(button('Bearbeiten'))

    await userEvent.click(screen.getByLabelText('Beschreibung'))
    await userEvent.paste('x'.repeat(MAXIMUM_DESCRIPTION_LENGTH + 1))
    await slideBy(button('Speichern'))

    expect(heading('Aufgabe bearbeiten')).toBeInTheDocument()
    expectFailureInField(
      descriptionFailureMessage(),
      screen.getByLabelText('Beschreibung'),
    )
    expect(viewTransitions.directions()).toEqual([
      'forward',
      'forward',
      'forward',
      'forward',
    ])
  })
})
