import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  installFakeViewTransitions,
  type FakeViewTransitions,
} from '../../testSupport/fakeViewTransitions'
import {
  taskCompletedAnnouncement,
  taskDeletedAnnouncement,
} from '../domain/announcements'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import type { Task } from '../domain/task'
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

const keller: Task = {
  id: 'stored-task-1',
  listId: haushalt.id,
  name: 'Keller aufräumen',
  description: '',
  due: { kind: 'someday' },
  createdAt: 0,
  completions: [],
}

const KELLER_COMPLETED: Task = { ...keller, completions: [1] }

describe('sliding between the steps of a task', () => {
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

  function directionsAfterOpeningTheList(): readonly string[] {
    return viewTransitions.directions().slice(2)
  }

  it('slides through editing a task', async () => {
    renderFoldersArea([familie], [haushalt], [keller])
    await slideIntoList()
    await slideBy(buttonNamedFirst('Keller aufräumen'))

    await slideBy(button('Bearbeiten'))
    await slideBy(button('Speichern'))
    await slideBy(button('Bearbeiten'))
    await slideBy(button('Zurück'))

    expect(heading('Keller aufräumen')).toBeInTheDocument()
    expect(directionsAfterOpeningTheList()).toEqual([
      'forward',
      'forward',
      'back',
      'forward',
      'back',
    ])
  })

  it('slides back to the list after confirming completion', async () => {
    const { client } = renderFoldersArea([familie], [haushalt], [keller])
    await slideIntoList()
    await slideBy(button('Keller aufräumen erledigen'))

    await userEvent.click(button('Erledigen'))

    expect(client.storedTasks()[0].completions).toEqual([])

    viewTransitions.finishPendingUpdates()

    expect(heading('Haushalt')).toBeInTheDocument()
    expect(client.storedTasks()[0].completions).toHaveLength(1)
    expect(announced()).toHaveTextContent(
      taskCompletedAnnouncement('Keller aufräumen'),
    )
    expect(directionsAfterOpeningTheList()).toEqual(['forward', 'back'])
  })

  it('slides back to the list after confirming deletion', async () => {
    const { client } = renderFoldersArea([familie], [haushalt], [keller])
    await slideIntoList()
    await slideBy(buttonNamedFirst('Keller aufräumen'))
    await slideBy(button('Löschen'))

    await slideBy(button('Löschen'))

    expect(heading('Haushalt')).toBeInTheDocument()
    expect(client.storedTasks()).toEqual([])
    expect(announced()).toHaveTextContent(
      taskDeletedAnnouncement('Keller aufräumen'),
    )
    expect(directionsAfterOpeningTheList()).toEqual([
      'forward',
      'forward',
      'back',
    ])
  })

  it('does not slide when reopening a task', async () => {
    renderFoldersArea([familie], [haushalt], [KELLER_COMPLETED])
    await slideBy(buttonNamedFirst('Familie'))
    await slideBy(filterButtonNamed('erledigt'))
    await slideBy(buttonNamedFirst('Haushalt'))
    await slideBy(filterButtonNamed('erledigt'))
    await slideBy(buttonNamedFirst('Keller aufräumen'))

    await userEvent.click(button('Wieder öffnen'))

    expect(heading('Keller aufräumen')).toBeInTheDocument()
    expect(viewTransitions.directions()).toEqual([
      'forward',
      'itemsForward',
      'forward',
      'itemsForward',
      'forward',
    ])
  })
})
