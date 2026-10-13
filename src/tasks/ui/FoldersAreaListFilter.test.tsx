import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import type { Due, Task } from '../domain/task'
import {
  announced,
  button,
  buttonNamedFirst,
  filterButtonNamed,
  heading,
  openCompletedList,
  openFolder,
  openList,
  renderFoldersArea,
} from './foldersAreaHarness'

const familie: Folder = { id: 'stored-1', name: 'Familie' }

const ausmisten: List = {
  id: 'list-1',
  name: 'Ausmisten',
  folderId: familie.id,
}
const geburtstage: List = {
  id: 'list-2',
  name: 'Geburtstage',
  folderId: familie.id,
}
const haushalt: List = { id: 'list-3', name: 'Haushalt', folderId: familie.id }
const umzug: List = { id: 'list-4', name: 'Umzug', folderId: familie.id }

const COMPLETED_AT = new Date(2026, 9, 5, 12, 0).getTime()

const weekly: Due = {
  kind: 'deadline',
  deadline: '2026-10-15',
  urgentFrom: 'oneWeek',
  repetition: { rhythm: 'weekly', anchorDay: 15 },
}

function task(
  id: string,
  name: string,
  list: List,
  completions: readonly number[] = [],
  due: Due = { kind: 'someday' },
): Task {
  return {
    id,
    listId: list.id,
    name,
    description: '',
    due,
    createdAt: 0,
    completions,
  }
}

const kartons = task('task-1', 'Kartons packen', umzug, [COMPLETED_AT])
const fenster = task('task-2', 'Fenster putzen', haushalt)
const keller = task('task-3', 'Keller räumen', ausmisten, [COMPLETED_AT])

function renderFolder(tasks: readonly Task[] = [kartons, fenster, keller]) {
  return renderFoldersArea(
    [familie],
    [umzug, haushalt, geburtstage, ausmisten],
    tasks,
  )
}

function listButtonNames(): readonly string[] {
  return screen
    .getAllByRole('button', { name: /^(Ausmisten|Geburtstage|Haushalt|Umzug)/ })
    .map((each) => each.textContent ?? '')
}

async function completeTask(name: string) {
  await userEvent.click(button(`${name} erledigen`))
  await userEvent.click(button('Erledigen'))
}

describe('FoldersArea filtering lists', () => {
  it('starts on the open lists with both counts when entering from the overview', async () => {
    renderFolder()

    await openFolder('Familie')

    expect(filterButtonNamed('offen')).toHaveAttribute('aria-pressed', 'true')
    expect(filterButtonNamed('offen')).toHaveTextContent('offen (2)')
    expect(filterButtonNamed('erledigt')).toHaveTextContent('erledigt (2)')
  })

  it('shows the open and the empty lists under open, by name', async () => {
    renderFolder()

    await openFolder('Familie')

    expect(listButtonNames()).toEqual([
      expect.stringMatching(/^Geburtstage/),
      expect.stringMatching(/^Haushalt/),
    ])
  })

  it('shows the completed lists under completed, by name', async () => {
    renderFolder()
    await openFolder('Familie')

    await userEvent.click(filterButtonNamed('erledigt'))

    expect(filterButtonNamed('erledigt')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(listButtonNames()).toEqual(['Ausmisten', 'Umzug'])
  })

  it('keeps a list with a recurring task open after it was completed', async () => {
    renderFoldersArea(
      [familie],
      [haushalt],
      [task('task-1', 'Müll rausbringen', haushalt, [COMPLETED_AT], weekly)],
    )

    await openFolder('Familie')

    expect(buttonNamedFirst('Haushalt')).toBeInTheDocument()
    expect(filterButtonNamed('erledigt')).toHaveTextContent('erledigt (0)')
  })

  it('tells when no list is open', async () => {
    renderFoldersArea([familie], [umzug], [kartons])

    await openFolder('Familie')

    expect(screen.getByText('Keine offenen Listen.')).toBeInTheDocument()
  })

  it('tells when no list is completed', async () => {
    renderFoldersArea([familie], [haushalt], [fenster])
    await openFolder('Familie')

    await userEvent.click(filterButtonNamed('erledigt'))

    expect(screen.getByText('Noch keine Liste erledigt.')).toBeInTheDocument()
  })

  it('tells when the folder has no lists in either filter', async () => {
    renderFoldersArea([familie])
    await openFolder('Familie')

    await userEvent.click(filterButtonNamed('erledigt'))

    expect(screen.getByText('Noch keine Listen.')).toBeInTheDocument()
  })

  it('returns to the completed lists after completing the last task of a list', async () => {
    renderFolder()
    await openList('Familie', 'Haushalt')
    await completeTask('Fenster putzen')

    await userEvent.click(button('Zurück'))

    expect(filterButtonNamed('erledigt')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(button('Haushalt')).toHaveFocus()
  })

  it('returns to the open lists after creating a task in a completed list', async () => {
    renderFolder()
    await openCompletedList('Familie', 'Umzug')
    await userEvent.click(button('Aufgabe anlegen'))
    await userEvent.type(screen.getByLabelText('Name'), 'Lampen abbauen')
    await userEvent.click(button('Speichern'))

    await userEvent.click(button('Zurück'))

    expect(filterButtonNamed('offen')).toHaveAttribute('aria-pressed', 'true')
    expect(buttonNamedFirst('Umzug')).toHaveFocus()
  })

  it('returns to the open lists after reopening a task of a completed list', async () => {
    renderFolder()
    await openCompletedList('Familie', 'Umzug')
    await userEvent.click(filterButtonNamed('erledigt'))
    await userEvent.click(buttonNamedFirst('Kartons packen'))
    await userEvent.click(button('Wieder öffnen'))
    await userEvent.click(button('Zurück'))

    await userEvent.click(button('Zurück'))

    expect(filterButtonNamed('offen')).toHaveAttribute('aria-pressed', 'true')
    expect(buttonNamedFirst('Umzug')).toHaveFocus()
  })

  it('moves a list from completed to open when a task is reopened elsewhere', async () => {
    const { client } = renderFolder()
    await openFolder('Familie')
    await userEvent.click(filterButtonNamed('erledigt'))

    act(() =>
      client.arrivesFromElsewhere({
        tasks: [{ ...kartons, completions: [] }, fenster, keller],
      }),
    )

    expect(listButtonNames()).toEqual(['Ausmisten'])
    expect(filterButtonNamed('offen')).toHaveTextContent('offen (3)')
  })

  it('stays on the completed lists and focuses the next one after deleting a completed list', async () => {
    renderFolder()
    await openCompletedList('Familie', 'Ausmisten')
    await userEvent.click(button('Liste bearbeiten'))
    await userEvent.click(button('Löschen'))

    await userEvent.click(button('Löschen'))

    expect(heading('Familie')).toBeInTheDocument()
    expect(filterButtonNamed('erledigt')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(button('Umzug')).toHaveFocus()
  })

  it.each(['offen', 'erledigt'])(
    'shows the %s lists without accessibility violations',
    async (filter) => {
      const { container } = renderFolder()
      await openFolder('Familie')

      await userEvent.click(filterButtonNamed(filter))

      expect(await accessibilityViolations(container)).toEqual([])
    },
  )
})

describe('FoldersArea announcing a completed list', () => {
  it('announces the list once its last open task is completed', async () => {
    renderFolder()
    await openList('Familie', 'Haushalt')

    await completeTask('Fenster putzen')

    expect(announced()).toHaveTextContent(
      'Fenster putzen erledigt. Liste Haushalt erledigt.',
    )
  })

  it('announces only the task while another task of the list stays open', async () => {
    renderFolder([fenster, task('task-4', 'Bad putzen', haushalt)])
    await openList('Familie', 'Haushalt')

    await completeTask('Fenster putzen')

    expect(announced()).toHaveTextContent('Fenster putzen erledigt.')
    expect(announced()).not.toHaveTextContent('Liste')
  })
})
