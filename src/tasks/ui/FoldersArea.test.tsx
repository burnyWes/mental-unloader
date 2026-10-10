import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Announcer } from '../../shared/ui/Announcer'
import { useAnnouncer } from '../../shared/ui/useAnnouncer'
import { accessibilityViolations } from '../../testSupport/accessibility'
import {
  createInMemoryFoldersClient,
  type InMemoryFoldersClient,
} from '../api/inMemoryFoldersClient'
import type { Folder } from '../domain/folder'
import { FoldersArea } from './FoldersArea'
import { useFolders } from './useFolders'

function FoldersAreaHarness({ client }: { client: InMemoryFoldersClient }) {
  const [foldersClient] = useState(() => client)
  const folders = useFolders(foldersClient)
  const { spokenText, announce } = useAnnouncer()

  return (
    <>
      <FoldersArea
        folders={folders}
        navigation={
          <nav aria-label="Bereiche">
            <button type="button">Ordner</button>
          </nav>
        }
        announce={announce}
      />
      <Announcer text={spokenText} />
    </>
  )
}

const familie: Folder = { id: 'stored-1', name: 'Familie' }
const garten: Folder = { id: 'stored-2', name: 'Garten' }
const arbeit: Folder = { id: 'stored-3', name: 'Arbeit' }

function renderFoldersArea(initialFolders: readonly Folder[] = []) {
  const client = createInMemoryFoldersClient(initialFolders)
  const rendered = render(<FoldersAreaHarness client={client} />)
  return { client, container: rendered.container }
}

function heading(name: string) {
  return screen.getByRole('heading', { level: 1, name })
}

function button(name: string) {
  return screen.getByRole('button', { name })
}

function announced() {
  return screen.getByRole('status')
}

async function startCreating() {
  await userEvent.click(button('Ordner anlegen'))
}

async function createFolder(name: string) {
  await startCreating()
  await userEvent.type(screen.getByLabelText('Name'), name)
  await userEvent.click(button('Speichern'))
}

async function openFolder(name: string) {
  await userEvent.click(button(name))
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
      client.foldersArriveFromElsewhere([{ ...familie, name: 'Haushalt' }]),
    )

    expect(heading('Haushalt')).toBeInTheDocument()
  })

  it('shows a folder created elsewhere on the overview', () => {
    const { client } = renderFoldersArea([familie])

    act(() => client.foldersArriveFromElsewhere([familie, garten]))

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

      act(() => client.foldersArriveFromElsewhere([garten]))

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

    act(() => client.foldersArriveFromElsewhere([familie]))

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
