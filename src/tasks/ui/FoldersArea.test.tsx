import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import type { Task } from '../domain/task'
import {
  announced,
  button,
  heading,
  openFolder,
  openList,
  renderFoldersArea,
} from './foldersAreaHarness'

const familie: Folder = { id: 'stored-1', name: 'Familie' }
const garten: Folder = { id: 'stored-2', name: 'Garten' }
const arbeit: Folder = { id: 'stored-3', name: 'Arbeit' }

const haushalt: List = {
  id: 'stored-list-1',
  name: 'Haushalt',
  folderId: familie.id,
}
const wocheneinkauf: List = {
  id: 'stored-list-2',
  name: 'Wocheneinkauf',
  folderId: familie.id,
}
const geburtstage: List = {
  id: 'stored-list-3',
  name: 'Geburtstage',
  folderId: familie.id,
}
const beete: List = { id: 'stored-list-4', name: 'Beete', folderId: garten.id }
const orphan: List = {
  id: 'stored-list-5',
  name: 'Waise',
  folderId: 'stored-gone',
}

function task(
  id: string,
  list: List,
  urgent: boolean,
  completions: readonly number[] = [],
): Task {
  return {
    id,
    listId: list.id,
    name: id,
    description: '',
    due: urgent ? { kind: 'urgent', since: '2026-10-01' } : { kind: 'someday' },
    createdAt: 0,
    completions,
  }
}

async function startCreating() {
  await userEvent.click(button('Ordner anlegen'))
}

async function createFolder(name: string) {
  await startCreating()
  await userEvent.type(screen.getByLabelText('Name'), name)
  await userEvent.click(button('Speichern'))
}

async function startEditing(name: string) {
  await openFolder(name)
  await userEvent.click(button('Ordner bearbeiten'))
}

async function replaceName(name: string) {
  await userEvent.clear(screen.getByLabelText('Name'))
  await userEvent.type(screen.getByLabelText('Name'), name)
}

async function requestDeletion(name: string) {
  await startEditing(name)
  await userEvent.click(button('Löschen'))
}

async function deleteFolder(name: string) {
  await requestDeletion(name)
  await userEvent.click(button('Löschen'))
}

async function startCreatingList(folderName: string) {
  await openFolder(folderName)
  await userEvent.click(button('Liste anlegen'))
}

async function createList(folderName: string, name: string) {
  await startCreatingList(folderName)
  await userEvent.type(screen.getByLabelText('Name'), name)
  await userEvent.click(button('Speichern'))
}

async function startEditingList(folderName: string, name: string) {
  await openList(folderName, name)
  await userEvent.click(button('Liste bearbeiten'))
}

async function requestListDeletion(folderName: string, name: string) {
  await startEditingList(folderName, name)
  await userEvent.click(button('Löschen'))
}

function listButtonNames() {
  return screen.getAllByRole('listitem').map((item) => item.textContent)
}

const openFolderPages = [
  ['folder page', (name: string) => openFolder(name)],
  ['form', (name: string) => startEditing(name)],
  ['confirmation', (name: string) => requestDeletion(name)],
] as const

describe('FoldersArea', () => {
  it('shows an empty overview that offers to create a folder', () => {
    renderFoldersArea()

    expect(heading('Ordner')).toHaveFocus()
    expect(screen.getByText('Noch keine Ordner.')).toBeInTheDocument()
    expect(button('Ordner anlegen')).toBeInTheDocument()
  })

  it('lists the folders alphabetically as buttons named after them', () => {
    renderFoldersArea([garten, familie, arbeit])

    const folderButtons = screen
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(folderButtons).toEqual(['Arbeit', 'Familie', 'Garten'])
    expect(button('Familie')).toBeInTheDocument()
  })

  it('opens the form to create a folder with the name focused and no navigation', async () => {
    renderFoldersArea()

    await startCreating()

    expect(heading('Ordner anlegen')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveFocus()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('creates a folder, focuses it on the overview and announces it', async () => {
    const { client } = renderFoldersArea()

    await createFolder('  Familie ')

    expect(client.storedFolders()).toEqual([
      { id: 'folder-1', name: 'Familie' },
    ])
    expect(heading('Ordner')).toBeInTheDocument()
    expect(button('Familie')).toHaveFocus()
    expect(announced()).toHaveTextContent('Ordner Familie angelegt.')
  })

  it('focuses a new folder only once it arrives', async () => {
    const { client } = renderFoldersArea()
    client.holdBackSnapshots()

    await createFolder('Familie')

    expect(heading('Ordner')).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Familie' })).toBeNull()

    act(() => client.releaseSnapshots())

    expect(button('Familie')).toHaveFocus()
  })

  it('leaves the focus where the household moved it before the new folder arrived', async () => {
    const { client } = renderFoldersArea()
    client.holdBackSnapshots()
    await createFolder('Familie')

    act(() => button('Ordner anlegen').focus())
    act(() => client.releaseSnapshots())

    expect(button('Ordner anlegen')).toHaveFocus()
  })

  it('rejects an empty name and keeps the focus in the field', async () => {
    const { client } = renderFoldersArea()
    await startCreating()

    await userEvent.type(screen.getByLabelText('Name'), '   ')
    await userEvent.click(button('Speichern'))

    expect(screen.getByText('Bitte einen Namen eingeben.')).toBeInTheDocument()
    expect(announced()).toHaveTextContent('Bitte einen Namen eingeben.')
    expect(screen.getByLabelText('Name')).toHaveFocus()
    expect(client.storedFolders()).toEqual([])
  })

  it('rejects a name longer than 100 characters', async () => {
    const { client } = renderFoldersArea()
    await startCreating()

    await userEvent.click(screen.getByLabelText('Name'))
    await userEvent.paste('a'.repeat(101))
    await userEvent.click(button('Speichern'))

    expect(
      screen.getByText('Der Name darf höchstens 100 Zeichen lang sein.'),
    ).toBeInTheDocument()
    expect(client.storedFolders()).toEqual([])
  })

  it('returns from the form to the overview without saving', async () => {
    const { client } = renderFoldersArea()
    await startCreating()
    await userEvent.type(screen.getByLabelText('Name'), 'Familie')

    await userEvent.click(button('Zurück'))

    expect(heading('Ordner')).toHaveFocus()
    expect(client.storedFolders()).toEqual([])
  })

  it('opens a folder with its name as focused heading', async () => {
    renderFoldersArea([familie])

    await openFolder('Familie')

    expect(heading('Familie')).toHaveFocus()
    expect(screen.getByText('Noch keine Listen.')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('returns from a folder to the overview', async () => {
    renderFoldersArea([familie])
    await openFolder('Familie')

    await userEvent.click(button('Zurück'))

    expect(heading('Ordner')).toHaveFocus()
  })

  it('shows a rename from elsewhere in the heading of the open folder', async () => {
    const { client } = renderFoldersArea([familie])
    await openFolder('Familie')

    act(() =>
      client.arrivesFromElsewhere({
        folders: [{ ...familie, name: 'Haushalt' }],
      }),
    )

    expect(heading('Haushalt')).toBeInTheDocument()
  })

  it('shows a folder created elsewhere on the overview', () => {
    const { client } = renderFoldersArea([familie])

    act(() => client.arrivesFromElsewhere({ folders: [familie, garten] }))

    expect(button('Garten')).toBeInTheDocument()
  })

  it('shows the empty overview without accessibility violations', async () => {
    const { container } = renderFoldersArea()

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows the filled overview without accessibility violations', async () => {
    const { container } = renderFoldersArea([familie, garten])

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows the form without accessibility violations', async () => {
    const { container } = renderFoldersArea()
    await startCreating()

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows a folder without accessibility violations', async () => {
    const { container } = renderFoldersArea([familie])
    await openFolder('Familie')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('opens the form to edit a folder with its name filled in and focused', async () => {
    renderFoldersArea([familie])

    await startEditing('Familie')

    expect(heading('Ordner bearbeiten')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Familie')
    expect(screen.getByLabelText('Name')).toHaveFocus()
  })

  it('renames a folder and returns to it with the new name focused', async () => {
    const { client } = renderFoldersArea([familie])
    await startEditing('Familie')

    await replaceName('Haushalt')
    await userEvent.click(button('Speichern'))

    expect(client.storedFolders()).toEqual([{ ...familie, name: 'Haushalt' }])
    expect(heading('Haushalt')).toHaveFocus()
    expect(announced()).toHaveTextContent('Ordner Haushalt gespeichert.')
  })

  it('keeps the stored name when an empty name is saved', async () => {
    const { client } = renderFoldersArea([familie])
    await startEditing('Familie')

    await userEvent.clear(screen.getByLabelText('Name'))
    await userEvent.click(button('Speichern'))

    expect(screen.getByText('Bitte einen Namen eingeben.')).toBeInTheDocument()
    expect(client.storedFolders()).toEqual([familie])
  })

  it('returns from the form to the folder without saving', async () => {
    const { client } = renderFoldersArea([familie])
    await startEditing('Familie')
    await replaceName('Haushalt')

    await userEvent.click(button('Zurück'))

    expect(heading('Familie')).toHaveFocus()
    expect(client.storedFolders()).toEqual([familie])
  })

  it('asks before deleting a folder', async () => {
    renderFoldersArea([familie])

    await requestDeletion('Familie')

    expect(heading('Ordner Familie löschen?')).toHaveFocus()
    expect(
      screen.getByText('Er verschwindet auf allen Geräten.'),
    ).toBeInTheDocument()
  })

  it.each(['Abbrechen', 'Zurück'])(
    'returns to the form with the changed name kept with %s',
    async (name) => {
      const { client } = renderFoldersArea([familie])
      await startEditing('Familie')
      await replaceName('Haushalt')
      await userEvent.click(button('Löschen'))

      await userEvent.click(button(name))

      expect(heading('Ordner bearbeiten')).toBeInTheDocument()
      expect(screen.getByLabelText('Name')).toHaveValue('Haushalt')
      expect(client.storedFolders()).toEqual([familie])
    },
  )

  it('deletes a folder, focuses the following one and announces it', async () => {
    const { client } = renderFoldersArea([arbeit, familie, garten])

    await deleteFolder('Familie')

    expect(client.storedFolders()).toEqual([arbeit, garten])
    expect(heading('Ordner')).toBeInTheDocument()
    expect(button('Garten')).toHaveFocus()
    expect(announced()).toHaveTextContent('Ordner Familie gelöscht.')
  })

  it('hides a deleted folder before its deletion arrives', async () => {
    const { client } = renderFoldersArea([arbeit, familie, garten])
    client.holdBackSnapshots()

    await deleteFolder('Familie')

    expect(screen.queryByRole('button', { name: 'Familie' })).toBeNull()
    expect(button('Garten')).toHaveFocus()
  })

  it('focuses the new last folder after deleting the last one', async () => {
    renderFoldersArea([arbeit, familie, garten])

    await deleteFolder('Garten')

    expect(button('Familie')).toHaveFocus()
  })

  it('focuses the heading after deleting the only folder', async () => {
    renderFoldersArea([familie])

    await deleteFolder('Familie')

    expect(heading('Ordner')).toHaveFocus()
    expect(screen.getByText('Noch keine Ordner.')).toBeInTheDocument()
  })

  it.each(openFolderPages)(
    'returns to the overview when the folder is deleted elsewhere while its %s is open',
    async (_page, openPage) => {
      const { client } = renderFoldersArea([familie, garten])
      await openPage('Familie')

      act(() => client.arrivesFromElsewhere({ folders: [garten] }))

      expect(heading('Ordner')).toHaveFocus()
      expect(announced()).toHaveTextContent('Ordner Familie wurde gelöscht.')
    },
  )

  it('does not report a folder deleted here as deleted elsewhere', async () => {
    renderFoldersArea([familie, garten])

    await deleteFolder('Familie')

    expect(announced()).not.toHaveTextContent('wurde gelöscht.')
  })

  it('stays on the open folder when another folder is deleted elsewhere', async () => {
    const { client } = renderFoldersArea([familie, garten])
    await openFolder('Familie')

    act(() => client.arrivesFromElsewhere({ folders: [familie] }))

    expect(heading('Familie')).toHaveFocus()
    expect(announced()).toBeEmptyDOMElement()
  })

  it('shows the form to edit without accessibility violations', async () => {
    const { container } = renderFoldersArea([familie])
    await startEditing('Familie')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows the deletion confirmation without accessibility violations', async () => {
    const { container } = renderFoldersArea([familie])
    await requestDeletion('Familie')

    expect(await accessibilityViolations(container)).toEqual([])
  })
})

describe('FoldersArea with lists', () => {
  const openListPages = [
    ['form to create a list', () => startCreatingList('Familie')],
    ['list page', () => openList('Familie', 'Haushalt')],
  ] as const

  it('offers to create a list on an empty folder', async () => {
    renderFoldersArea([familie])

    await openFolder('Familie')

    expect(button('Liste anlegen')).toBeInTheDocument()
    expect(screen.getByText('Noch keine Listen.')).toBeInTheDocument()
  })

  it('shows only the lists of the folder alphabetically as buttons', async () => {
    renderFoldersArea([familie, garten], [wocheneinkauf, beete, haushalt])

    await openFolder('Familie')

    expect(listButtonNames()).toEqual(['Haushalt', 'Wocheneinkauf'])
    expect(button('Haushalt')).toBeInTheDocument()
  })

  it('shows an orphaned list nowhere', async () => {
    renderFoldersArea([familie], [orphan])

    expect(button('Familie')).toBeInTheDocument()
    await openFolder('Familie')

    expect(screen.queryByRole('button', { name: 'Waise' })).toBeNull()
  })

  it.each([
    [[haushalt, wocheneinkauf, geburtstage], 'Familie, 3 Listen'],
    [[haushalt], 'Familie, 1 Liste'],
    [[], 'Familie'],
  ])('names the folder button after its lists as %#', (lists, name) => {
    renderFoldersArea([familie], lists)

    expect(screen.getByRole('button', { name })).toBeInTheDocument()
  })

  it.each([
    [
      [task('Müll', haushalt, true), task('Keller', haushalt, false)],
      'Haushalt, 2 offen, 1 dringend',
    ],
    [
      [task('Keller', haushalt, false), task('Bad', haushalt, false)],
      'Haushalt, 2 offen',
    ],
    [[task('Fenster', haushalt, true, [5])], 'Haushalt'],
  ])(
    'names the list button after its open tasks as %#',
    async (tasks, name) => {
      renderFoldersArea([familie], [haushalt], tasks)

      await openFolder('Familie')

      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    },
  )

  it('deletes the lists of a deleted folder and keeps those of others', async () => {
    const { client } = renderFoldersArea(
      [familie, garten],
      [haushalt, beete, wocheneinkauf],
    )

    await deleteFolder('Familie')

    expect(client.storedFolders()).toEqual([garten])
    expect(client.storedLists()).toEqual([beete])
  })

  it('returns to the folder when the open list is deleted elsewhere', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await openList('Familie', 'Haushalt')

    act(() => client.arrivesFromElsewhere({ lists: [] }))

    expect(heading('Familie')).toHaveFocus()
  })

  it('opens the form to create a list with the name focused and no folder choice', async () => {
    renderFoldersArea([familie])

    await startCreatingList('Familie')

    expect(heading('Liste anlegen')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveFocus()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Ordner')).not.toBeInTheDocument()
  })

  it('creates a list in the folder, focuses it and announces it', async () => {
    const { client } = renderFoldersArea([familie])

    await createList('Familie', '  Haushalt ')

    expect(client.storedLists()).toEqual([
      { id: 'list-1', name: 'Haushalt', folderId: familie.id },
    ])
    expect(heading('Familie')).toBeInTheDocument()
    expect(button('Haushalt')).toHaveFocus()
    expect(announced()).toHaveTextContent('Liste Haushalt angelegt.')
  })

  it('focuses a new list only once it arrives', async () => {
    const { client } = renderFoldersArea([familie])
    await startCreatingList('Familie')
    client.holdBackSnapshots()

    await userEvent.type(screen.getByLabelText('Name'), 'Haushalt')
    await userEvent.click(button('Speichern'))

    expect(heading('Familie')).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Haushalt' })).toBeNull()

    act(() => client.releaseSnapshots())

    expect(button('Haushalt')).toHaveFocus()
  })

  it('rejects an empty list name', async () => {
    const { client } = renderFoldersArea([familie])
    await startCreatingList('Familie')

    await userEvent.click(button('Speichern'))

    expect(screen.getByText('Bitte einen Namen eingeben.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveFocus()
    expect(client.storedLists()).toEqual([])
  })

  it('rejects a list name longer than 100 characters', async () => {
    const { client } = renderFoldersArea([familie])
    await startCreatingList('Familie')

    await userEvent.click(screen.getByLabelText('Name'))
    await userEvent.paste('a'.repeat(101))
    await userEvent.click(button('Speichern'))

    expect(
      screen.getByText('Der Name darf höchstens 100 Zeichen lang sein.'),
    ).toBeInTheDocument()
    expect(client.storedLists()).toEqual([])
  })

  it('returns from the form to the folder without creating a list', async () => {
    const { client } = renderFoldersArea([familie])
    await startCreatingList('Familie')
    await userEvent.type(screen.getByLabelText('Name'), 'Haushalt')

    await userEvent.click(button('Zurück'))

    expect(heading('Familie')).toHaveFocus()
    expect(client.storedLists()).toEqual([])
  })

  it('opens a list with its name as focused heading', async () => {
    renderFoldersArea([familie], [haushalt])

    await openList('Familie', 'Haushalt')

    expect(heading('Haushalt')).toHaveFocus()
    expect(screen.getByText('Noch keine Aufgaben.')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('returns from a list to its folder', async () => {
    renderFoldersArea([familie], [haushalt])
    await openList('Familie', 'Haushalt')

    await userEvent.click(button('Zurück'))

    expect(heading('Familie')).toHaveFocus()
  })

  it('shows a list created elsewhere in the open folder', async () => {
    const { client } = renderFoldersArea([familie])
    await openFolder('Familie')

    act(() => client.arrivesFromElsewhere({ lists: [haushalt] }))

    expect(button('Haushalt')).toBeInTheDocument()
  })

  it('shows a rename from elsewhere in the heading of the open list', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await openList('Familie', 'Haushalt')

    act(() =>
      client.arrivesFromElsewhere({ lists: [{ ...haushalt, name: 'Putzen' }] }),
    )

    expect(heading('Putzen')).toBeInTheDocument()
  })

  it.each(openListPages)(
    'returns to the overview when the folder is deleted elsewhere while the %s is open',
    async (_page, openPage) => {
      const { client } = renderFoldersArea([familie, garten], [haushalt])
      await openPage()

      act(() => client.arrivesFromElsewhere({ folders: [garten], lists: [] }))

      expect(heading('Ordner')).toHaveFocus()
      expect(announced()).toHaveTextContent('Ordner Familie wurde gelöscht.')
    },
  )

  it('shows an empty folder without accessibility violations', async () => {
    const { container } = renderFoldersArea([familie])
    await openFolder('Familie')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows a folder with lists without accessibility violations', async () => {
    const { container } = renderFoldersArea([familie], [haushalt, geburtstage])
    await openFolder('Familie')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows the form to create a list without accessibility violations', async () => {
    const { container } = renderFoldersArea([familie])
    await startCreatingList('Familie')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows a list without accessibility violations', async () => {
    const { container } = renderFoldersArea([familie], [haushalt])
    await openList('Familie', 'Haushalt')

    expect(await accessibilityViolations(container)).toEqual([])
  })
})

describe('FoldersArea editing lists', () => {
  async function deleteList(folderName: string, name: string) {
    await requestListDeletion(folderName, name)
    await userEvent.click(button('Löschen'))
  }

  async function chooseFolder(name: string) {
    await userEvent.selectOptions(screen.getByLabelText('Ordner'), name)
  }

  function folderChoice() {
    return screen.getByLabelText('Ordner')
  }

  function chosenFolderName() {
    return (folderChoice() as HTMLSelectElement).selectedOptions[0].textContent
  }

  const openListPages = [
    ['list page', () => openList('Familie', 'Haushalt')],
    ['form', () => startEditingList('Familie', 'Haushalt')],
    ['confirmation', () => requestListDeletion('Familie', 'Haushalt')],
  ] as const

  it('opens the form to edit a list with name, focus and its folder chosen', async () => {
    renderFoldersArea([garten, familie, arbeit], [haushalt])

    await startEditingList('Familie', 'Haushalt')

    expect(heading('Liste bearbeiten')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Haushalt')
    expect(screen.getByLabelText('Name')).toHaveFocus()
    expect(chosenFolderName()).toBe('Familie')
    expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual(['Arbeit', 'Familie', 'Garten'])
  })

  it('renames a list and returns to it with the new name focused', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await startEditingList('Familie', 'Haushalt')

    await replaceName('Einkauf')
    await userEvent.click(button('Speichern'))

    expect(client.storedLists()).toEqual([{ ...haushalt, name: 'Einkauf' }])
    expect(heading('Einkauf')).toHaveFocus()
    expect(announced()).toHaveTextContent('Liste Einkauf gespeichert.')
  })

  it('moves a list to another folder and returns there', async () => {
    const { client } = renderFoldersArea([familie, garten], [haushalt])
    await startEditingList('Familie', 'Haushalt')

    await chooseFolder('Garten')
    await userEvent.click(button('Speichern'))

    expect(client.storedLists()).toEqual([{ ...haushalt, folderId: garten.id }])
    expect(announced()).toHaveTextContent(
      'Liste Haushalt nach Garten verschoben.',
    )
    await userEvent.click(button('Zurück'))
    expect(heading('Garten')).toHaveFocus()
    expect(button('Haushalt')).toBeInTheDocument()
  })

  it('announces a move together with a rename under the new name', async () => {
    renderFoldersArea([familie, garten], [haushalt])
    await startEditingList('Familie', 'Haushalt')

    await replaceName('Einkauf')
    await chooseFolder('Garten')
    await userEvent.click(button('Speichern'))

    expect(announced()).toHaveTextContent(
      'Liste Einkauf nach Garten verschoben.',
    )
  })

  it('keeps the stored list when an empty name is saved', async () => {
    const { client } = renderFoldersArea([familie, garten], [haushalt])
    await startEditingList('Familie', 'Haushalt')

    await userEvent.clear(screen.getByLabelText('Name'))
    await chooseFolder('Garten')
    await userEvent.click(button('Speichern'))

    expect(screen.getByText('Bitte einen Namen eingeben.')).toBeInTheDocument()
    expect(client.storedLists()).toEqual([haushalt])
  })

  it('returns from the form to the list without saving', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await startEditingList('Familie', 'Haushalt')
    await replaceName('Einkauf')

    await userEvent.click(button('Zurück'))

    expect(heading('Haushalt')).toHaveFocus()
    expect(client.storedLists()).toEqual([haushalt])
  })

  it('asks before deleting a list', async () => {
    renderFoldersArea([familie], [haushalt])

    await requestListDeletion('Familie', 'Haushalt')

    expect(heading('Liste Haushalt löschen?')).toHaveFocus()
    expect(
      screen.getByText('Sie verschwindet auf allen Geräten.'),
    ).toBeInTheDocument()
  })

  it.each(['Abbrechen', 'Zurück'])(
    'returns to the form with name and folder kept with %s',
    async (name) => {
      const { client } = renderFoldersArea([familie, garten], [haushalt])
      await startEditingList('Familie', 'Haushalt')
      await replaceName('Einkauf')
      await chooseFolder('Garten')
      await userEvent.click(button('Löschen'))

      await userEvent.click(button(name))

      expect(heading('Liste bearbeiten')).toBeInTheDocument()
      expect(screen.getByLabelText('Name')).toHaveValue('Einkauf')
      expect(chosenFolderName()).toBe('Garten')
      expect(client.storedLists()).toEqual([haushalt])
    },
  )

  it('deletes a list, focuses the following one and announces it', async () => {
    const { client } = renderFoldersArea(
      [familie],
      [geburtstage, haushalt, wocheneinkauf],
    )

    await deleteList('Familie', 'Haushalt')

    expect(client.storedLists()).toEqual([geburtstage, wocheneinkauf])
    expect(heading('Familie')).toBeInTheDocument()
    expect(button('Wocheneinkauf')).toHaveFocus()
    expect(announced()).toHaveTextContent('Liste Haushalt gelöscht.')
  })

  it('hides a deleted list before its deletion arrives', async () => {
    const { client } = renderFoldersArea(
      [familie],
      [geburtstage, haushalt, wocheneinkauf],
    )
    await requestListDeletion('Familie', 'Haushalt')
    client.holdBackSnapshots()

    await userEvent.click(button('Löschen'))

    expect(screen.queryByRole('button', { name: 'Haushalt' })).toBeNull()
    expect(button('Wocheneinkauf')).toHaveFocus()
  })

  it('focuses the new last list after deleting the last one', async () => {
    renderFoldersArea([familie], [geburtstage, haushalt, wocheneinkauf])

    await deleteList('Familie', 'Wocheneinkauf')

    expect(button('Haushalt')).toHaveFocus()
  })

  it('focuses the heading after deleting the only list', async () => {
    renderFoldersArea([familie], [haushalt])

    await deleteList('Familie', 'Haushalt')

    expect(heading('Familie')).toHaveFocus()
    expect(screen.getByText('Noch keine Listen.')).toBeInTheDocument()
  })

  it.each(openListPages)(
    'returns to the folder when the list is deleted elsewhere while its %s is open',
    async (_page, openPage) => {
      const { client } = renderFoldersArea([familie], [haushalt, geburtstage])
      await openPage()

      act(() => client.arrivesFromElsewhere({ lists: [geburtstage] }))

      expect(heading('Familie')).toHaveFocus()
      expect(announced()).toHaveTextContent('Liste Haushalt wurde gelöscht.')
    },
  )

  it('does not report a list deleted here as deleted elsewhere', async () => {
    renderFoldersArea([familie], [haushalt, geburtstage])

    await deleteList('Familie', 'Haushalt')

    expect(announced()).not.toHaveTextContent('wurde gelöscht.')
  })

  it('stays on the list moved elsewhere and returns to its new folder', async () => {
    const { client } = renderFoldersArea([familie, garten], [haushalt])
    await openList('Familie', 'Haushalt')

    act(() =>
      client.arrivesFromElsewhere({
        lists: [{ ...haushalt, folderId: garten.id }],
      }),
    )

    expect(heading('Haushalt')).toHaveFocus()
    await userEvent.click(button('Zurück'))
    expect(heading('Garten')).toHaveFocus()
  })

  it('keeps the input and the own folder choice when the list is moved elsewhere', async () => {
    const { client } = renderFoldersArea([familie, garten, arbeit], [haushalt])
    await startEditingList('Familie', 'Haushalt')
    await replaceName('Einkauf')
    await chooseFolder('Arbeit')

    act(() =>
      client.arrivesFromElsewhere({
        lists: [{ ...haushalt, folderId: garten.id }],
      }),
    )

    expect(heading('Liste bearbeiten')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Einkauf')
    expect(chosenFolderName()).toBe('Arbeit')
  })

  it('falls back to the current folder when the chosen one is deleted elsewhere', async () => {
    const { client } = renderFoldersArea([familie, garten], [haushalt])
    await startEditingList('Familie', 'Haushalt')
    await chooseFolder('Garten')

    act(() => client.arrivesFromElsewhere({ folders: [familie] }))
    expect(chosenFolderName()).toBe('Familie')
    await userEvent.click(button('Speichern'))

    expect(client.storedLists()).toEqual([haushalt])
    expect(announced()).toHaveTextContent('Liste Haushalt gespeichert.')
  })

  it('follows a move from elsewhere while no folder was chosen', async () => {
    const { client } = renderFoldersArea([familie, garten], [haushalt])
    await startEditingList('Familie', 'Haushalt')

    act(() =>
      client.arrivesFromElsewhere({
        lists: [{ ...haushalt, folderId: garten.id }],
      }),
    )
    expect(chosenFolderName()).toBe('Garten')
    await userEvent.click(button('Speichern'))

    expect(client.storedLists()).toEqual([{ ...haushalt, folderId: garten.id }])
  })

  it('shows the form to edit a list without accessibility violations', async () => {
    const { container } = renderFoldersArea([familie, garten], [haushalt])
    await startEditingList('Familie', 'Haushalt')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows the list deletion confirmation without accessibility violations', async () => {
    const { container } = renderFoldersArea([familie], [haushalt])
    await requestListDeletion('Familie', 'Haushalt')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('names the tasks that are deleted along with the list', async () => {
    renderFoldersArea(
      [familie],
      [haushalt],
      [task('Müll', haushalt, true), task('Fenster', haushalt, false, [5])],
    )

    await requestListDeletion('Familie', 'Haushalt')

    expect(heading('Liste Haushalt mit 2 Aufgaben löschen?')).toHaveFocus()
    expect(
      screen.getByText(
        'Sie verschwindet mitsamt ihren Aufgaben auf allen Geräten.',
      ),
    ).toBeInTheDocument()
  })

  it('deletes the tasks of a deleted list and keeps those of others', async () => {
    const milch = task('Milch', wocheneinkauf, false)
    const { client } = renderFoldersArea(
      [familie],
      [haushalt, wocheneinkauf],
      [
        task('Müll', haushalt, true),
        milch,
        task('Fenster', haushalt, false, [5]),
      ],
    )

    await deleteList('Familie', 'Haushalt')

    expect(client.storedTasks()).toEqual([milch])
  })

  it('shows the deletion of a list with tasks without accessibility violations', async () => {
    const { container } = renderFoldersArea(
      [familie],
      [haushalt],
      [task('Müll', haushalt, true)],
    )
    await requestListDeletion('Familie', 'Haushalt')

    expect(await accessibilityViolations(container)).toEqual([])
  })
})

describe('FoldersArea deleting folders with lists', () => {
  const openListPages = [
    ['list page', () => openList('Familie', 'Haushalt')],
    ['form to edit a list', () => startEditingList('Familie', 'Haushalt')],
    ['list deletion', () => requestListDeletion('Familie', 'Haushalt')],
  ] as const

  it('names the lists that are deleted along with the folder', async () => {
    renderFoldersArea([familie], [haushalt, wocheneinkauf, geburtstage])

    await requestDeletion('Familie')

    expect(heading('Ordner Familie mit 3 Listen löschen?')).toHaveFocus()
    expect(
      screen.getByText(
        'Er verschwindet mitsamt seinen Listen auf allen Geräten.',
      ),
    ).toBeInTheDocument()
  })

  it('names a single list that is deleted along with the folder', async () => {
    renderFoldersArea([familie], [haushalt])

    await requestDeletion('Familie')

    expect(heading('Ordner Familie mit 1 Liste löschen?')).toBeInTheDocument()
  })

  it.each(openListPages)(
    'announces only the folder when it is deleted elsewhere with its lists while the %s is open',
    async (_page, openPage) => {
      const { client } = renderFoldersArea([familie, garten], [haushalt])
      await openPage()

      act(() => client.arrivesFromElsewhere({ folders: [garten], lists: [] }))

      expect(heading('Ordner')).toHaveFocus()
      expect(announced()).toHaveTextContent('Ordner Familie wurde gelöscht.')
      expect(announced()).not.toHaveTextContent('Liste')
    },
  )

  it('names the lists and tasks that are deleted along with the folder', async () => {
    renderFoldersArea(
      [familie],
      [haushalt, wocheneinkauf],
      [
        task('Müll', haushalt, true),
        task('Fenster', haushalt, false, [5]),
        task('Milch', wocheneinkauf, false),
      ],
    )

    await requestDeletion('Familie')

    expect(
      heading('Ordner Familie mit 2 Listen und 3 Aufgaben löschen?'),
    ).toHaveFocus()
    expect(
      screen.getByText(
        'Er verschwindet mitsamt seinen Listen und Aufgaben auf allen Geräten.',
      ),
    ).toBeInTheDocument()
  })

  it('deletes all tasks of a deleted folder and keeps those of others', async () => {
    const rosen = task('Rosen', beete, true)
    const { client } = renderFoldersArea(
      [familie, garten],
      [haushalt, wocheneinkauf, beete],
      [
        task('Müll', haushalt, true),
        rosen,
        task('Fenster', haushalt, false, [5]),
        task('Milch', wocheneinkauf, false),
      ],
    )

    await deleteFolder('Familie')

    expect(client.storedTasks()).toEqual([rosen])
  })

  it('shows the deletion of a folder with tasks without accessibility violations', async () => {
    const { container } = renderFoldersArea(
      [familie],
      [haushalt],
      [task('Müll', haushalt, true)],
    )
    await requestDeletion('Familie')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows the deletion of a folder with lists without accessibility violations', async () => {
    const { container } = renderFoldersArea([familie], [haushalt])
    await requestDeletion('Familie')

    expect(await accessibilityViolations(container)).toEqual([])
  })
})
