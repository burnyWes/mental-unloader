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
  heading,
  openList,
  renderFoldersArea,
  TENTH_OF_OCTOBER_MORNING,
} from './foldersAreaHarness'

const familie: Folder = { id: 'stored-1', name: 'Familie' }
const garten: Folder = { id: 'stored-2', name: 'Garten' }

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
const beete: List = { id: 'stored-list-3', name: 'Beete', folderId: garten.id }

const SOMEDAY: Due = { kind: 'someday' }

function urgentSince(since: string): Due {
  return { kind: 'urgent', since }
}

function task(
  id: string,
  name: string,
  list: List,
  due: Due,
  createdAt = 0,
  completions: readonly number[] = [],
): Task {
  return {
    id,
    listId: list.id,
    name,
    description: '',
    due,
    createdAt,
    completions,
  }
}

const muell = task(
  'stored-task-1',
  'Müll rausbringen',
  haushalt,
  urgentSince('2026-10-01'),
  1,
)
const keller = task('stored-task-2', 'Keller aufräumen', haushalt, SOMEDAY, 2)

function rowNames() {
  return screen
    .getAllByRole('listitem')
    .map((item) =>
      item.querySelector('.taskRowName')?.textContent?.replace(/\s+/g, ' '),
    )
}

function nameField() {
  return screen.getByLabelText('Name')
}

function descriptionField() {
  return screen.getByLabelText('Beschreibung')
}

async function startCreatingTask() {
  await openList('Familie', 'Haushalt')
  await userEvent.click(button('Aufgabe anlegen'))
}

async function writeTask(name: string, description = '') {
  await userEvent.type(nameField(), name)
  if (description !== '') {
    await userEvent.click(descriptionField())
    await userEvent.paste(description)
  }
}

async function save() {
  await userEvent.click(button('Speichern'))
}

describe('FoldersArea list page with tasks', () => {
  it('offers to create a task on an empty list', async () => {
    renderFoldersArea([familie], [haushalt])

    await openList('Familie', 'Haushalt')

    expect(button('Aufgabe anlegen')).toBeInTheDocument()
    expect(screen.getByText('Noch keine Aufgaben.')).toBeInTheDocument()
  })

  it('shows the open tasks of the list, urgent ones first, oldest first', async () => {
    renderFoldersArea(
      [familie],
      [haushalt, wocheneinkauf],
      [
        task('t-1', 'Kaffee neu', haushalt, SOMEDAY, 20),
        task('t-2', 'Feuer neu', haushalt, urgentSince('2026-10-09'), 5),
        task('t-3', 'Milch', wocheneinkauf, SOMEDAY, 1),
        task('t-4', 'Kaffee alt', haushalt, SOMEDAY, 10),
        task('t-5', 'Feuer alt', haushalt, urgentSince('2026-10-01'), 30),
        task('t-6', 'Waise', { ...haushalt, id: 'gone' }, SOMEDAY, 1),
      ],
    )

    await openList('Familie', 'Haushalt')

    expect(rowNames()).toEqual([
      'Feuer alt, dringend',
      'Feuer neu, dringend',
      'Kaffee alt',
      'Kaffee neu',
    ])
  })

  it('names the row of an urgent task with its urgency', async () => {
    renderFoldersArea([familie], [haushalt], [muell, keller])

    await openList('Familie', 'Haushalt')

    expect(button('Müll rausbringen, dringend')).toBeInTheDocument()
    expect(button('Keller aufräumen')).toBeInTheDocument()
  })

  it('shows a task created elsewhere on the open list', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await openList('Familie', 'Haushalt')

    act(() => client.arrivesFromElsewhere({ tasks: [keller] }))

    expect(button('Keller aufräumen')).toBeInTheDocument()
  })

  it('shows an empty list without accessibility violations', async () => {
    const { container } = renderFoldersArea([familie], [haushalt])
    await openList('Familie', 'Haushalt')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows a list with tasks without accessibility violations', async () => {
    const { container } = renderFoldersArea(
      [familie],
      [haushalt],
      [muell, keller],
    )
    await openList('Familie', 'Haushalt')

    expect(await accessibilityViolations(container)).toEqual([])
  })
})

describe('FoldersArea creating tasks', () => {
  it('opens the form with the name focused, someday chosen and no list choice', async () => {
    renderFoldersArea([familie], [haushalt])

    await startCreatingTask()

    expect(heading('Aufgabe anlegen')).toBeInTheDocument()
    expect(nameField()).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'Irgendwann' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Dringend' })).not.toBeChecked()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Liste')).not.toBeInTheDocument()
  })

  it('creates an urgent task, focuses its row and announces it', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await startCreatingTask()

    await writeTask('  Müll rausbringen ', ' Gelbe Tonne auch. ')
    await userEvent.click(screen.getByRole('radio', { name: 'Dringend' }))
    await save()

    expect(client.storedTasks()).toEqual([
      {
        id: 'task-1',
        listId: haushalt.id,
        name: 'Müll rausbringen',
        description: 'Gelbe Tonne auch.',
        due: { kind: 'urgent', since: '2026-10-10' },
        createdAt: TENTH_OF_OCTOBER_MORNING.getTime(),
        completions: [],
      },
    ])
    expect(heading('Haushalt')).toBeInTheDocument()
    expect(button('Müll rausbringen, dringend')).toHaveFocus()
    expect(announced()).toHaveTextContent('Aufgabe Müll rausbringen angelegt.')
  })

  it('creates a someday task', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await startCreatingTask()

    await writeTask('Keller aufräumen')
    await save()

    expect(client.storedTasks()[0].due).toEqual({ kind: 'someday' })
    expect(button('Keller aufräumen')).toHaveFocus()
  })

  it('focuses a new task only once it arrives', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await startCreatingTask()
    client.holdBackSnapshots()

    await writeTask('Keller aufräumen')
    await save()

    expect(heading('Haushalt')).toHaveFocus()
    expect(
      screen.queryByRole('button', { name: 'Keller aufräumen' }),
    ).toBeNull()

    act(() => client.releaseSnapshots())

    expect(button('Keller aufräumen')).toHaveFocus()
  })

  it('rejects an empty name below the name field', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await startCreatingTask()

    await writeTask('   ')
    await save()

    expect(nameField()).toHaveAccessibleDescription(
      'Bitte einen Namen eingeben.',
    )
    expect(announced()).toHaveTextContent('Bitte einen Namen eingeben.')
    expect(nameField()).toHaveFocus()
    expect(client.storedTasks()).toEqual([])
  })

  it('rejects a name longer than 100 characters', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await startCreatingTask()

    await userEvent.click(nameField())
    await userEvent.paste('a'.repeat(101))
    await save()

    expect(nameField()).toHaveAccessibleDescription(
      'Der Name darf höchstens 100 Zeichen lang sein.',
    )
    expect(nameField()).toHaveFocus()
    expect(client.storedTasks()).toEqual([])
  })

  it('rejects a description longer than 2000 characters below its field', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await startCreatingTask()

    await writeTask('Müll rausbringen', 'a'.repeat(2001))
    await save()

    expect(descriptionField()).toHaveAccessibleDescription(
      'Die Beschreibung darf höchstens 2000 Zeichen lang sein.',
    )
    expect(announced()).toHaveTextContent(
      'Die Beschreibung darf höchstens 2000 Zeichen lang sein.',
    )
    expect(descriptionField()).toHaveFocus()
    expect(client.storedTasks()).toEqual([])
  })

  it('shows only the failure of the latest attempt', async () => {
    renderFoldersArea([familie], [haushalt])
    await startCreatingTask()
    await save()

    await writeTask('Müll rausbringen', 'a'.repeat(2001))
    await save()

    expect(nameField()).not.toHaveAccessibleDescription(
      'Bitte einen Namen eingeben.',
    )
    expect(
      screen.queryByText('Bitte einen Namen eingeben.'),
    ).not.toBeInTheDocument()
    expect(descriptionField()).toHaveAccessibleDescription(
      'Die Beschreibung darf höchstens 2000 Zeichen lang sein.',
    )
  })

  it('returns from the form to the list without saving', async () => {
    const { client } = renderFoldersArea([familie], [haushalt])
    await startCreatingTask()
    await writeTask('Müll rausbringen')

    await userEvent.click(button('Zurück'))

    expect(heading('Haushalt')).toHaveFocus()
    expect(client.storedTasks()).toEqual([])
  })

  it('returns to the folder when the list is deleted elsewhere while the form is open', async () => {
    const { client } = renderFoldersArea([familie], [haushalt, wocheneinkauf])
    await startCreatingTask()

    act(() => client.arrivesFromElsewhere({ lists: [wocheneinkauf] }))

    expect(heading('Familie')).toHaveFocus()
    expect(announced()).toHaveTextContent('Liste Haushalt wurde gelöscht.')
  })

  it('shows the form to create a task without accessibility violations', async () => {
    const { container } = renderFoldersArea(
      [familie, garten],
      [haushalt, beete],
    )
    await startCreatingTask()

    expect(await accessibilityViolations(container)).toEqual([])
  })
})

describe('FoldersArea task overview and editing', () => {
  const described: Task = {
    ...muell,
    description: 'Gelbe Tonne auch.\nUnd die blaue.',
  }

  let rendered: ReturnType<typeof renderFoldersArea>

  function client() {
    return rendered.client
  }

  function renderTasks(tasks: readonly Task[] = [described, keller]) {
    rendered = renderFoldersArea(
      [familie, garten],
      [haushalt, wocheneinkauf, beete],
      tasks,
    )
    return rendered
  }

  function storedTask(id: string) {
    return client()
      .storedTasks()
      .find((each) => each.id === id)
  }

  async function openTask(name: string) {
    await openList('Familie', 'Haushalt')
    await userEvent.click(buttonNamedFirst(name))
  }

  async function startEditingTask(name: string) {
    await openTask(name)
    await userEvent.click(button('Bearbeiten'))
  }

  async function replaceTaskName(name: string) {
    await userEvent.clear(nameField())
    await userEvent.type(nameField(), name)
  }

  async function chooseList(name: string) {
    await userEvent.selectOptions(screen.getByLabelText('Liste'), name)
  }

  function chosenListName() {
    const choice = screen.getByLabelText('Liste') as HTMLSelectElement
    return choice.selectedOptions[0].textContent
  }

  const openTaskPages = [
    ['overview', () => openTask('Müll rausbringen')],
    ['form', () => startEditingTask('Müll rausbringen')],
  ] as const

  it('opens the overview with the name focused and the facts below', async () => {
    renderTasks()

    await openTask('Müll rausbringen')

    expect(heading('Müll rausbringen')).toHaveFocus()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(document.querySelector('.taskDescription')?.textContent).toBe(
      'Gelbe Tonne auch.\nUnd die blaue.',
    )
    expect(screen.getByText('Fälligkeit')).toBeInTheDocument()
    expect(screen.getByText('Dringend')).toBeInTheDocument()
    expect(screen.getByText('Familie › Haushalt')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(screen.getByText('Familie, Haushalt')).toBeInTheDocument()
    expect(button('Bearbeiten')).toBeInTheDocument()
  })

  it('shows no description when there is none', async () => {
    renderTasks()

    await openTask('Keller aufräumen')

    expect(screen.getByText('Irgendwann')).toBeInTheDocument()
    expect(document.querySelector('.taskDescription')).toBeNull()
  })

  it('returns from the overview to the list with the row of the task focused', async () => {
    renderTasks()
    await openTask('Keller aufräumen')

    await userEvent.click(button('Zurück'))

    expect(heading('Haushalt')).toBeInTheDocument()
    expect(button('Keller aufräumen')).toHaveFocus()
  })

  it('opens the form to edit with the task filled in and its list chosen', async () => {
    renderTasks()

    await startEditingTask('Müll rausbringen')

    expect(heading('Aufgabe bearbeiten')).toBeInTheDocument()
    expect(nameField()).toHaveValue('Müll rausbringen')
    expect(nameField()).toHaveFocus()
    expect(descriptionField()).toHaveValue('Gelbe Tonne auch.\nUnd die blaue.')
    expect(screen.getByRole('radio', { name: 'Dringend' })).toBeChecked()
    expect(chosenListName()).toBe('Haushalt')
    expect(
      [...document.querySelectorAll('optgroup')].map((group) => group.label),
    ).toEqual(['Familie', 'Garten'])
    expect(screen.queryByRole('button', { name: 'Löschen' })).toBeNull()
  })

  it('saves a new name and shows the overview with it focused', async () => {
    renderTasks()
    await startEditingTask('Müll rausbringen')

    await replaceTaskName('Altglas wegbringen')
    await save()

    expect(storedTask(muell.id)?.name).toBe('Altglas wegbringen')
    expect(heading('Altglas wegbringen')).toHaveFocus()
    expect(announced()).toHaveTextContent(
      'Aufgabe Altglas wegbringen gespeichert.',
    )
  })

  it('makes a someday task urgent since today', async () => {
    renderTasks()
    await startEditingTask('Keller aufräumen')

    await userEvent.click(screen.getByRole('radio', { name: 'Dringend' }))
    await save()

    expect(storedTask(keller.id)?.due).toEqual(urgentSince('2026-10-10'))
  })

  it('keeps the day an urgent task became urgent', async () => {
    renderTasks()
    await startEditingTask('Müll rausbringen')

    await replaceTaskName('Altglas wegbringen')
    await save()

    expect(storedTask(muell.id)?.due).toEqual(urgentSince('2026-10-01'))
  })

  it('makes an urgent task someday', async () => {
    renderTasks()
    await startEditingTask('Müll rausbringen')

    await userEvent.click(screen.getByRole('radio', { name: 'Irgendwann' }))
    await save()

    expect(storedTask(muell.id)?.due).toEqual(SOMEDAY)
  })

  it('moves a task to a list of another folder and returns there', async () => {
    renderTasks()
    await startEditingTask('Müll rausbringen')

    await chooseList('Beete')
    await save()

    expect(storedTask(muell.id)?.listId).toBe(beete.id)
    expect(heading('Müll rausbringen')).toHaveFocus()
    expect(announced()).toHaveTextContent(
      'Aufgabe Müll rausbringen nach Garten, Beete verschoben.',
    )
    await userEvent.click(button('Zurück'))
    expect(heading('Beete')).toBeInTheDocument()
    expect(button('Müll rausbringen, dringend')).toHaveFocus()
  })

  it.each([
    ['an empty name', '', ''],
    ['a description that is too long', 'Altglas', 'a'.repeat(2001)],
  ])('saves nothing with %s', async (_case, name, description) => {
    renderTasks()
    await startEditingTask('Müll rausbringen')
    await userEvent.clear(nameField())
    await userEvent.clear(descriptionField())

    if (name !== '') await userEvent.type(nameField(), name)
    if (description !== '') {
      await userEvent.click(descriptionField())
      await userEvent.paste(description)
    }
    await chooseList('Beete')
    await save()

    expect(storedTask(muell.id)).toEqual(described)
    expect(heading('Aufgabe bearbeiten')).toBeInTheDocument()
  })

  it('returns from the form to the overview without saving', async () => {
    renderTasks()
    await startEditingTask('Müll rausbringen')
    await replaceTaskName('Altglas wegbringen')

    await userEvent.click(button('Zurück'))

    expect(heading('Müll rausbringen')).toHaveFocus()
    expect(storedTask(muell.id)).toEqual(described)
  })

  it.each(openTaskPages)(
    'returns to the list when the task is deleted elsewhere while its %s is open',
    async (_page, openPage) => {
      renderTasks()
      await openPage()

      act(() => client().arrivesFromElsewhere({ tasks: [keller] }))

      expect(heading('Haushalt')).toHaveFocus()
      expect(announced()).toHaveTextContent(
        'Aufgabe Müll rausbringen wurde gelöscht.',
      )
    },
  )

  it.each(openTaskPages)(
    'returns to the folder when the list is deleted elsewhere while the %s of a task is open',
    async (_page, openPage) => {
      renderTasks()
      await openPage()

      act(() =>
        client().arrivesFromElsewhere({
          lists: [wocheneinkauf, beete],
          tasks: [],
        }),
      )

      expect(heading('Familie')).toHaveFocus()
      expect(announced()).toHaveTextContent('Liste Haushalt wurde gelöscht.')
      expect(announced()).not.toHaveTextContent('Aufgabe')
    },
  )

  it.each(openTaskPages)(
    'returns to the overview when the folder is deleted elsewhere while the %s of a task is open',
    async (_page, openPage) => {
      renderTasks()
      await openPage()

      act(() =>
        client().arrivesFromElsewhere({
          folders: [garten],
          lists: [beete],
          tasks: [],
        }),
      )

      expect(heading('Ordner')).toHaveFocus()
      expect(announced()).toHaveTextContent('Ordner Familie wurde gelöscht.')
      expect(announced()).not.toHaveTextContent('Liste')
      expect(announced()).not.toHaveTextContent('Aufgabe')
    },
  )

  it('stays on the overview of a task moved elsewhere and returns to its new list', async () => {
    renderTasks()
    await openTask('Müll rausbringen')

    act(() =>
      client().arrivesFromElsewhere({
        tasks: [{ ...described, listId: beete.id }, keller],
      }),
    )

    expect(heading('Müll rausbringen')).toHaveFocus()
    await userEvent.click(button('Zurück'))
    expect(heading('Beete')).toBeInTheDocument()
  })

  it('follows a move from elsewhere in the form while no list was chosen', async () => {
    renderTasks()
    await startEditingTask('Müll rausbringen')

    act(() =>
      client().arrivesFromElsewhere({
        tasks: [{ ...described, listId: beete.id }, keller],
      }),
    )
    expect(heading('Aufgabe bearbeiten')).toBeInTheDocument()
    expect(chosenListName()).toBe('Beete')
    await save()

    expect(storedTask(muell.id)?.listId).toBe(beete.id)
    expect(announced()).toHaveTextContent(
      'Aufgabe Müll rausbringen gespeichert.',
    )
  })

  it('falls back to the current list when the chosen one is deleted elsewhere', async () => {
    renderTasks()
    await startEditingTask('Müll rausbringen')
    await chooseList('Beete')

    act(() =>
      client().arrivesFromElsewhere({ lists: [haushalt, wocheneinkauf] }),
    )
    expect(chosenListName()).toBe('Haushalt')
    await save()

    expect(storedTask(muell.id)?.listId).toBe(haushalt.id)
    expect(announced()).toHaveTextContent(
      'Aufgabe Müll rausbringen gespeichert.',
    )
  })

  it('announces only the folder deleted elsewhere after moving the task into it', async () => {
    renderTasks()
    await startEditingTask('Müll rausbringen')
    await chooseList('Beete')
    await save()

    act(() =>
      client().arrivesFromElsewhere({
        folders: [familie],
        lists: [haushalt, wocheneinkauf],
        tasks: [keller],
      }),
    )

    expect(heading('Ordner')).toHaveFocus()
    expect(announced()).toHaveTextContent('Ordner Garten wurde gelöscht.')
    expect(announced()).not.toHaveTextContent('Liste')
  })

  it('announces only the list deleted elsewhere after moving the task into it', async () => {
    renderTasks()
    await startEditingTask('Müll rausbringen')
    await chooseList('Beete')
    await save()

    act(() =>
      client().arrivesFromElsewhere({
        lists: [haushalt, wocheneinkauf],
        tasks: [keller],
      }),
    )

    expect(heading('Garten')).toHaveFocus()
    expect(announced()).toHaveTextContent('Liste Beete wurde gelöscht.')
    expect(announced()).not.toHaveTextContent('Aufgabe')
  })

  it('shows a rename from elsewhere on the overview', async () => {
    renderTasks()
    await openTask('Müll rausbringen')

    act(() =>
      client().arrivesFromElsewhere({
        tasks: [{ ...described, name: 'Altglas wegbringen' }, keller],
      }),
    )

    expect(heading('Altglas wegbringen')).toBeInTheDocument()
    expect(announced()).toBeEmptyDOMElement()
  })

  it('keeps the own input in the form when the task is renamed elsewhere', async () => {
    renderTasks()
    await startEditingTask('Müll rausbringen')
    await replaceTaskName('Papier')

    act(() =>
      client().arrivesFromElsewhere({
        tasks: [{ ...described, name: 'Altglas wegbringen' }, keller],
      }),
    )

    expect(nameField()).toHaveValue('Papier')
  })

  it('shows the overview without accessibility violations', async () => {
    const { container } = renderTasks()
    await openTask('Müll rausbringen')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows the form to edit a task without accessibility violations', async () => {
    const { container } = renderTasks()
    await startEditingTask('Müll rausbringen')

    expect(await accessibilityViolations(container)).toEqual([])
  })
})

describe('FoldersArea completing, reopening and deleting tasks', () => {
  const COMPLETED_TODAY = TENTH_OF_OCTOBER_MORNING.getTime()
  const COMPLETED_EARLIER = new Date(2026, 9, 5, 18, 0).getTime()

  const fenster = task(
    'stored-task-3',
    'Fenster putzen',
    haushalt,
    SOMEDAY,
    3,
    [COMPLETED_TODAY],
  )
  const bad = task('stored-task-4', 'Bad putzen', haushalt, SOMEDAY, 4, [
    COMPLETED_EARLIER,
  ])
  const muellCompleted: Task = { ...muell, completions: [COMPLETED_TODAY] }

  let rendered: ReturnType<typeof renderFoldersArea>

  function client() {
    return rendered.client
  }

  function renderTasks(tasks: readonly Task[] = [muell, keller, bad, fenster]) {
    rendered = renderFoldersArea([familie], [haushalt], tasks)
    return rendered
  }

  function storedTask(id: string) {
    return client()
      .storedTasks()
      .find((each) => each.id === id)
  }

  function filterButton(name: string) {
    return screen.getByRole('button', { name: new RegExp(`^${name} \\(`) })
  }

  async function chooseFilter(name: string) {
    await userEvent.click(filterButton(name))
  }

  async function openTask(name: string, filter = 'offen') {
    await openList('Familie', 'Haushalt')
    await chooseFilter(filter)
    await userEvent.click(buttonNamedFirst(name))
  }

  async function requestCompletionFromRow(name: string) {
    await openList('Familie', 'Haushalt')
    await userEvent.click(button(`${name} erledigen`))
  }

  async function requestCompletionFromOverview(name: string) {
    await openTask(name)
    await userEvent.click(button('Erledigen'))
  }

  async function requestDeletion(name: string, filter = 'offen') {
    await openTask(name, filter)
    await userEvent.click(button('Löschen'))
  }

  const completionRequests = [
    ['row', () => requestCompletionFromRow('Müll rausbringen')],
    ['overview', () => requestCompletionFromOverview('Müll rausbringen')],
  ] as const

  describe('filter', () => {
    it('starts on the open tasks with both filters counted', async () => {
      renderTasks()

      await openList('Familie', 'Haushalt')

      expect(screen.getByRole('group', { name: 'Filter' })).toBeInTheDocument()
      expect(button('offen (2)')).toHaveAttribute('aria-pressed', 'true')
      expect(button('erledigt (2)')).toHaveAttribute('aria-pressed', 'false')
      expect(rowNames()).toEqual([
        'Müll rausbringen, dringend',
        'Keller aufräumen',
      ])
    })

    it('shows the completed tasks, the latest completed first, without a check box', async () => {
      renderTasks()
      await openList('Familie', 'Haushalt')

      await chooseFilter('erledigt')

      expect(button('erledigt (2)')).toHaveAttribute('aria-pressed', 'true')
      expect(button('offen (2)')).toHaveAttribute('aria-pressed', 'false')
      expect(
        button('Fenster putzen, erledigt am 10. Oktober'),
      ).toBeInTheDocument()
      expect(button('Bad putzen, erledigt am 5. Oktober')).toBeInTheDocument()
      expect(rowNames()[0]).toContain('Fenster putzen')
      expect(screen.getByText('erledigt 10.10.')).toHaveAttribute(
        'aria-hidden',
        'true',
      )
      expect(
        screen.queryByRole('button', { name: /erledigen$/ }),
      ).not.toBeInTheDocument()
    })

    it('keeps the focus on the filter button and announces nothing', async () => {
      renderTasks()
      await openList('Familie', 'Haushalt')

      await chooseFilter('erledigt')

      expect(filterButton('erledigt')).toHaveFocus()
      expect(announced()).toBeEmptyDOMElement()
    })

    it('tells when nothing is open', async () => {
      renderTasks([fenster])

      await openList('Familie', 'Haushalt')

      expect(screen.getByText('Keine offenen Aufgaben.')).toBeInTheDocument()
    })

    it('tells when nothing is completed', async () => {
      renderTasks([muell])
      await openList('Familie', 'Haushalt')

      await chooseFilter('erledigt')

      expect(screen.getByText('Noch nichts erledigt.')).toBeInTheDocument()
    })

    it('shows both filters counting nothing on an empty list', async () => {
      renderTasks([])

      await openList('Familie', 'Haushalt')

      expect(screen.getByText('Noch keine Aufgaben.')).toBeInTheDocument()
      expect(button('offen (0)')).toBeInTheDocument()
      expect(button('erledigt (0)')).toBeInTheDocument()
    })

    it('keeps the completed filter across creating a task and going back', async () => {
      renderTasks()
      await openList('Familie', 'Haushalt')
      await chooseFilter('erledigt')

      await userEvent.click(button('Aufgabe anlegen'))
      await userEvent.click(button('Zurück'))

      expect(filterButton('erledigt')).toHaveAttribute('aria-pressed', 'true')
    })

    it('shows the open tasks after creating a task from the completed filter', async () => {
      renderTasks()
      await openList('Familie', 'Haushalt')
      await chooseFilter('erledigt')

      await userEvent.click(button('Aufgabe anlegen'))
      await writeTask('Altglas wegbringen')
      await save()

      expect(filterButton('offen')).toHaveAttribute('aria-pressed', 'true')
      expect(button('Altglas wegbringen')).toHaveFocus()
    })

    it('shows the open tasks again after editing the list', async () => {
      renderTasks()
      await openList('Familie', 'Haushalt')
      await chooseFilter('erledigt')

      await userEvent.click(button('Liste bearbeiten'))
      await userEvent.click(button('Zurück'))

      expect(filterButton('offen')).toHaveAttribute('aria-pressed', 'true')
    })

    it('shows the completed filter without accessibility violations', async () => {
      const { container } = renderTasks()
      await openList('Familie', 'Haushalt')
      await chooseFilter('erledigt')

      expect(await accessibilityViolations(container)).toEqual([])
    })
  })

  describe('completing', () => {
    it('asks before completing a task from its row', async () => {
      renderTasks()

      await requestCompletionFromRow('Müll rausbringen')

      expect(heading('Müll rausbringen erledigen?')).toHaveFocus()
      expect(
        screen.getByText('Sie wandert in die erledigten Aufgaben.'),
      ).toBeInTheDocument()
    })

    it('completes a task, focuses the following row and announces it', async () => {
      renderTasks()
      await requestCompletionFromRow('Müll rausbringen')

      await userEvent.click(button('Erledigen'))

      expect(storedTask(muell.id)?.completions).toEqual([COMPLETED_TODAY])
      expect(heading('Haushalt')).toBeInTheDocument()
      expect(filterButton('offen')).toHaveAttribute('aria-pressed', 'true')
      expect(button('Keller aufräumen')).toHaveFocus()
      expect(announced()).toHaveTextContent('Müll rausbringen erledigt.')
    })

    it('hides the completed task and counts it no longer before the completion arrives', async () => {
      renderTasks()
      await requestCompletionFromRow('Müll rausbringen')
      client().holdBackSnapshots()

      await userEvent.click(button('Erledigen'))

      expect(
        screen.queryByRole('button', { name: /^Müll rausbringen/ }),
      ).toBeNull()
      expect(button('offen (1)')).toBeInTheDocument()
      expect(button('Keller aufräumen')).toHaveFocus()
    })

    it('focuses the new last row after completing the last one', async () => {
      renderTasks()
      await requestCompletionFromRow('Keller aufräumen')

      await userEvent.click(button('Erledigen'))

      expect(button('Müll rausbringen, dringend')).toHaveFocus()
    })

    it('focuses the heading after completing the only open task', async () => {
      renderTasks([muell])
      await requestCompletionFromRow('Müll rausbringen')

      await userEvent.click(button('Erledigen'))

      expect(heading('Haushalt')).toHaveFocus()
      expect(screen.getByText('Keine offenen Aufgaben.')).toBeInTheDocument()
      expect(button('erledigt (1)')).toBeInTheDocument()
    })

    it.each(['Abbrechen', 'Zurück'])(
      'returns to the check box of the row without completing with %s',
      async (name) => {
        renderTasks()
        await requestCompletionFromRow('Müll rausbringen')

        await userEvent.click(button(name))

        expect(heading('Haushalt')).toBeInTheDocument()
        expect(button('Müll rausbringen erledigen')).toHaveFocus()
        expect(storedTask(muell.id)).toEqual(muell)
      },
    )

    it('completes a task from its overview and shows the open tasks', async () => {
      renderTasks([muell, keller, fenster])
      await openTask('Fenster putzen', 'erledigt')
      await userEvent.click(button('Wieder öffnen'))

      await userEvent.click(button('Erledigen'))
      await userEvent.click(button('Erledigen'))

      expect(filterButton('offen')).toHaveAttribute('aria-pressed', 'true')
      expect(announced()).toHaveTextContent('Fenster putzen erledigt.')
    })

    it('returns to the overview when the completion is cancelled there', async () => {
      renderTasks()
      await requestCompletionFromOverview('Müll rausbringen')

      await userEvent.click(button('Abbrechen'))

      expect(heading('Müll rausbringen')).toHaveFocus()
      expect(storedTask(muell.id)).toEqual(muell)
    })

    it.each(completionRequests)(
      'shows the overview when the task is completed elsewhere while asking from the %s',
      async (_from, request) => {
        renderTasks()
        await request()

        act(() =>
          client().arrivesFromElsewhere({ tasks: [muellCompleted, keller] }),
        )

        expect(heading('Müll rausbringen')).toHaveFocus()
        expect(button('Wieder öffnen')).toBeInTheDocument()
        expect(announced()).toHaveTextContent(
          'Müll rausbringen wurde schon erledigt.',
        )
      },
    )

    it('stays on the overview after reopening a task completed elsewhere while asking', async () => {
      renderTasks()
      await requestCompletionFromRow('Müll rausbringen')
      act(() =>
        client().arrivesFromElsewhere({ tasks: [muellCompleted, keller] }),
      )

      await userEvent.click(button('Wieder öffnen'))

      expect(heading('Müll rausbringen')).toBeInTheDocument()
      expect(button('Erledigen')).toHaveFocus()
      expect(
        screen.queryByRole('heading', { name: 'Müll rausbringen erledigen?' }),
      ).toBeNull()
    })

    it('shows the completion confirmation without accessibility violations', async () => {
      const { container } = renderTasks()
      await requestCompletionFromRow('Müll rausbringen')

      expect(await accessibilityViolations(container)).toEqual([])
    })
  })

  describe('reopening', () => {
    it('shows when a completed task was completed', async () => {
      renderTasks()

      await openTask('Fenster putzen', 'erledigt')

      expect(screen.getByText('Erledigt')).toBeInTheDocument()
      expect(screen.getByText('10. Oktober')).toBeInTheDocument()
      expect(button('Wieder öffnen')).toBeInTheDocument()
    })

    it('reopens a task, keeps the focus on the button and announces it', async () => {
      renderTasks()
      await openTask('Fenster putzen', 'erledigt')

      await userEvent.click(button('Wieder öffnen'))

      expect(storedTask(fenster.id)?.completions).toEqual([])
      expect(heading('Fenster putzen')).toBeInTheDocument()
      expect(button('Erledigen')).toHaveFocus()
      expect(announced()).toHaveTextContent('Fenster putzen wieder geöffnet.')
    })

    it('returns to the open tasks after reopening a completed one', async () => {
      renderTasks()
      await openTask('Fenster putzen', 'erledigt')
      await userEvent.click(button('Wieder öffnen'))

      await userEvent.click(button('Zurück'))

      expect(filterButton('offen')).toHaveAttribute('aria-pressed', 'true')
      expect(button('Fenster putzen')).toHaveFocus()
    })

    it('returns from a completed task to the completed tasks', async () => {
      renderTasks()
      await openTask('Fenster putzen', 'erledigt')

      await userEvent.click(button('Zurück'))

      expect(filterButton('erledigt')).toHaveAttribute('aria-pressed', 'true')
      expect(button('Fenster putzen, erledigt am 10. Oktober')).toHaveFocus()
    })

    it('shows a task reopened elsewhere without announcing it', async () => {
      renderTasks()
      await openTask('Fenster putzen', 'erledigt')

      act(() =>
        client().arrivesFromElsewhere({
          tasks: [muell, keller, bad, { ...fenster, completions: [] }],
        }),
      )

      expect(button('Erledigen')).toBeInTheDocument()
      expect(announced()).toBeEmptyDOMElement()
    })

    it('shows the overview of a completed task without accessibility violations', async () => {
      const { container } = renderTasks()
      await openTask('Fenster putzen', 'erledigt')

      expect(await accessibilityViolations(container)).toEqual([])
    })
  })

  describe('deleting', () => {
    it('asks before deleting a task', async () => {
      renderTasks()

      await requestDeletion('Müll rausbringen')

      expect(heading('Aufgabe Müll rausbringen löschen?')).toHaveFocus()
      expect(
        screen.getByText('Sie verschwindet auf allen Geräten.'),
      ).toBeInTheDocument()
    })

    it.each(['Abbrechen', 'Zurück'])(
      'returns to the overview without deleting with %s',
      async (name) => {
        renderTasks()
        await requestDeletion('Müll rausbringen')

        await userEvent.click(button(name))

        expect(heading('Müll rausbringen')).toHaveFocus()
        expect(storedTask(muell.id)).toEqual(muell)
      },
    )

    it('deletes a task, focuses the following row and announces it', async () => {
      renderTasks()
      await requestDeletion('Müll rausbringen')

      await userEvent.click(button('Löschen'))

      expect(storedTask(muell.id)).toBeUndefined()
      expect(heading('Haushalt')).toBeInTheDocument()
      expect(button('Keller aufräumen')).toHaveFocus()
      expect(announced()).toHaveTextContent(
        'Aufgabe Müll rausbringen gelöscht.',
      )
      expect(announced()).not.toHaveTextContent('wurde gelöscht.')
    })

    it('deletes a completed task and stays on the completed tasks', async () => {
      renderTasks()
      await requestDeletion('Fenster putzen', 'erledigt')

      await userEvent.click(button('Löschen'))

      expect(filterButton('erledigt')).toHaveAttribute('aria-pressed', 'true')
      expect(button('Bad putzen, erledigt am 5. Oktober')).toHaveFocus()
    })

    it.each([
      ['completion', () => requestCompletionFromRow('Müll rausbringen')],
      ['deletion', () => requestDeletion('Müll rausbringen')],
    ] as const)(
      'returns to the list when the task is deleted elsewhere while its %s is asked',
      async (_question, request) => {
        renderTasks()
        await request()

        act(() => client().arrivesFromElsewhere({ tasks: [keller] }))

        expect(heading('Haushalt')).toHaveFocus()
        expect(announced()).toHaveTextContent(
          'Aufgabe Müll rausbringen wurde gelöscht.',
        )
      },
    )

    it('shows the deletion confirmation without accessibility violations', async () => {
      const { container } = renderTasks()
      await requestDeletion('Müll rausbringen')

      expect(await accessibilityViolations(container)).toEqual([])
    })
  })
})
