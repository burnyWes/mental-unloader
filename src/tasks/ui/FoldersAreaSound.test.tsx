import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createInMemorySoundEffects,
  type RecordingSoundEffects,
} from '../../shared/sound/inMemorySoundEffects'
import type { SoundEffect } from '../../shared/sound/soundEffects'
import {
  installFakeViewTransitions,
  type FakeViewTransitions,
} from '../../testSupport/fakeViewTransitions'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import { MAXIMUM_DESCRIPTION_LENGTH, type Task } from '../domain/task'
import {
  button,
  buttonNamedFirst,
  filterButtonNamed,
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

const KELLER_IN_THE_LAST_YEAR: Task = {
  ...keller,
  due: {
    kind: 'deadline',
    deadline: '2099-06-15',
    urgentFrom: 'oneWeek',
    repetition: null,
  },
}

function radio(name: string) {
  return screen.getByRole('radio', { name })
}

function spinButton(name: string) {
  return screen.getByRole('spinbutton', { name })
}

function stepButtonOf(fieldName: string, arrow: '▲' | '▼') {
  const column = spinButton(fieldName).closest('.deadlineField') as HTMLElement
  return within(column).getByText(arrow)
}

describe('sounds of the folders area', () => {
  let viewTransitions: FakeViewTransitions
  let soundEffects: RecordingSoundEffects

  beforeEach(() => {
    viewTransitions = installFakeViewTransitions()
    soundEffects = createInMemorySoundEffects()
  })

  afterEach(() => {
    viewTransitions.uninstall()
  })

  function renderHearing(tasks: readonly Task[] = [keller], animations = true) {
    return renderFoldersArea([familie], [haushalt], tasks, {
      soundEffects,
      animations,
    })
  }

  async function tap(element: HTMLElement) {
    await userEvent.click(element)
    viewTransitions.finishPendingUpdates()
  }

  async function soundsOfTapping(
    element: HTMLElement,
  ): Promise<readonly SoundEffect[]> {
    const playedBefore = soundEffects.played().length
    await tap(element)
    return soundEffects.played().slice(playedBefore)
  }

  async function openTheList() {
    await tap(buttonNamedFirst('Familie'))
    await tap(buttonNamedFirst('Haushalt'))
  }

  async function openTheFolderDeletion() {
    await tap(buttonNamedFirst('Familie'))
    await tap(button('Ordner bearbeiten'))
    await tap(button('Löschen'))
  }

  async function openTheListDeletion() {
    await openTheList()
    await tap(button('Liste bearbeiten'))
    await tap(button('Löschen'))
  }

  async function openTheTask() {
    await openTheList()
    await tap(buttonNamedFirst('Keller aufräumen'))
  }

  it('plays the confirm sound instead of the page turn when deleting a folder', async () => {
    renderHearing()
    await openTheFolderDeletion()

    expect(await soundsOfTapping(button('Löschen'))).toEqual(['confirm'])
    expect(screen.getByRole('heading', { name: 'Ordner' })).toBeInTheDocument()
  })

  it('plays the confirm sound when deleting a list', async () => {
    renderHearing()
    await openTheListDeletion()

    expect(await soundsOfTapping(button('Löschen'))).toEqual(['confirm'])
  })

  it('plays the refuse sound when cancelling a deletion', async () => {
    renderHearing()
    await openTheListDeletion()

    expect(await soundsOfTapping(button('Abbrechen'))).toEqual(['refuse'])
  })

  it('plays the page turn when leaving a confirmation with Zurück', async () => {
    renderHearing()
    await openTheFolderDeletion()

    expect(await soundsOfTapping(button('Zurück'))).toEqual(['pageTurn'])
  })

  it('plays the confirm sound when confirming the completion of a task', async () => {
    renderHearing()
    await openTheList()

    expect(await soundsOfTapping(button('Keller aufräumen erledigen'))).toEqual(
      ['pageTurn'],
    )
    expect(await soundsOfTapping(button('Erledigen'))).toEqual(['confirm'])
  })

  it('plays the confirm sound when deleting a task', async () => {
    renderHearing()
    await openTheTask()
    await tap(button('Löschen'))

    expect(await soundsOfTapping(button('Löschen'))).toEqual(['confirm'])
  })

  it('plays the refuse sound when cancelling the completion of a task', async () => {
    renderHearing()
    await openTheTask()
    await tap(button('Erledigen'))

    expect(await soundsOfTapping(button('Abbrechen'))).toEqual(['refuse'])
  })

  it('plays the confirm sound when reopening a task', async () => {
    renderHearing([KELLER_COMPLETED])
    await tap(buttonNamedFirst('Familie'))
    await tap(filterButtonNamed('erledigt'))
    await tap(buttonNamedFirst('Haushalt'))
    await tap(filterButtonNamed('erledigt'))
    await tap(buttonNamedFirst('Keller aufräumen'))
    const directionsBefore = viewTransitions.directions()

    expect(await soundsOfTapping(button('Wieder öffnen'))).toEqual(['confirm'])
    expect(viewTransitions.directions()).toEqual(directionsBefore)
  })

  it('plays the confirm and refuse sounds while animations are turned off', async () => {
    renderHearing([keller], false)
    await openTheListDeletion()

    expect(await soundsOfTapping(button('Abbrechen'))).toEqual(['refuse'])
    await tap(button('Löschen'))
    expect(await soundsOfTapping(button('Löschen'))).toEqual(['confirm'])
    expect(viewTransitions.directions()).toEqual([])
  })

  it('keeps the page turn for filters and opening', async () => {
    renderHearing()

    expect(await soundsOfTapping(buttonNamedFirst('Familie'))).toEqual([
      'pageTurn',
    ])
    expect(await soundsOfTapping(filterButtonNamed('erledigt'))).toEqual([
      'pageTurn',
    ])
  })

  async function typeName(name: string) {
    await userEvent.clear(screen.getByLabelText('Name'))
    if (name !== '') await userEvent.type(screen.getByLabelText('Name'), name)
  }

  it('plays the confirm sound instead of the page turn when saving a folder', async () => {
    renderHearing()
    await tap(button('Ordner anlegen'))
    await typeName('Garten')

    expect(await soundsOfTapping(button('Speichern'))).toEqual(['confirm'])
    expect(buttonNamedFirst('Garten')).toHaveFocus()
  })

  it('plays the confirm sound when saving a list, a new task and an edited task', async () => {
    renderHearing()
    await openTheList()

    await tap(button('Liste bearbeiten'))
    expect(await soundsOfTapping(button('Speichern'))).toEqual(['confirm'])

    await tap(button('Aufgabe anlegen'))
    await typeName('Fenster putzen')
    expect(await soundsOfTapping(button('Speichern'))).toEqual(['confirm'])

    await tap(buttonNamedFirst('Keller aufräumen'))
    await tap(button('Bearbeiten'))
    expect(await soundsOfTapping(button('Speichern'))).toEqual(['confirm'])
  })

  it('plays the refuse sound when saving an empty name', async () => {
    renderHearing()
    await tap(button('Ordner anlegen'))
    const directionsBefore = viewTransitions.directions()

    expect(await soundsOfTapping(button('Speichern'))).toEqual(['refuse'])
    expect(viewTransitions.directions()).toEqual(directionsBefore)
  })

  it('plays the refuse sound when saving a too long description', async () => {
    renderHearing()
    await openTheTask()
    await tap(button('Bearbeiten'))
    await userEvent.click(screen.getByLabelText('Beschreibung'))
    await userEvent.paste('x'.repeat(MAXIMUM_DESCRIPTION_LENGTH + 1))

    expect(await soundsOfTapping(button('Speichern'))).toEqual(['refuse'])
  })

  it('plays the confirm and refuse sounds on save while animations are turned off', async () => {
    renderHearing([keller], false)
    await tap(button('Ordner anlegen'))

    expect(await soundsOfTapping(button('Speichern'))).toEqual(['refuse'])
    await typeName('Garten')
    expect(await soundsOfTapping(button('Speichern'))).toEqual(['confirm'])
    expect(viewTransitions.directions()).toEqual([])
  })

  it('keeps the page turn when leaving a form with Zurück', async () => {
    renderHearing()
    await tap(button('Ordner anlegen'))

    expect(await soundsOfTapping(button('Zurück'))).toEqual(['pageTurn'])
  })

  async function soundsOfPressing(
    element: HTMLElement,
    key: string,
  ): Promise<readonly SoundEffect[]> {
    const playedBefore = soundEffects.played().length
    element.focus()
    await userEvent.keyboard(`{${key}}`)
    return soundEffects.played().slice(playedBefore)
  }

  async function openTheTaskForm() {
    await openTheList()
    await tap(button('Aufgabe anlegen'))
  }

  it('plays the activate sound when choosing another due kind', async () => {
    renderHearing()
    await openTheTaskForm()

    expect(await soundsOfTapping(radio('Stichtag'))).toEqual(['activate'])
    expect(await soundsOfTapping(radio('Irgendwann'))).toEqual(['activate'])
  })

  it('stays silent when tapping the due kind already chosen', async () => {
    renderHearing()
    await openTheTaskForm()

    expect(await soundsOfTapping(radio('Irgendwann'))).toEqual([])
  })

  it('plays the activate and deactivate sounds for Wiederkehrend', async () => {
    renderHearing()
    await openTheTaskForm()
    await tap(radio('Stichtag'))
    const repeats = screen.getByRole('checkbox', { name: 'Wiederkehrend' })

    expect(await soundsOfTapping(repeats)).toEqual(['activate'])
    expect(await soundsOfTapping(repeats)).toEqual(['deactivate'])
  })

  it('plays the arrow sound for each step button', async () => {
    renderHearing()
    await openTheTaskForm()
    await tap(radio('Stichtag'))

    expect(await soundsOfTapping(stepButtonOf('Tag', '▲'))).toEqual(['arrow'])
    expect(await soundsOfTapping(stepButtonOf('Monat', '▼'))).toEqual(['arrow'])
  })

  it('plays the arrow sound for each arrow key', async () => {
    renderHearing()
    await openTheTaskForm()
    await tap(radio('Stichtag'))

    expect(await soundsOfPressing(spinButton('Jahr'), 'ArrowUp')).toEqual([
      'arrow',
    ])
    expect(await soundsOfPressing(spinButton('Jahr'), 'ArrowDown')).toEqual([
      'arrow',
    ])
    expect(await soundsOfPressing(spinButton('Jahr'), 'ArrowLeft')).toEqual([])
  })

  it('plays the arrow sound even at the last year', async () => {
    renderHearing([KELLER_IN_THE_LAST_YEAR])
    await openTheTask()
    await tap(button('Bearbeiten'))

    expect(await soundsOfTapping(stepButtonOf('Jahr', '▲'))).toEqual(['arrow'])
    expect(spinButton('Jahr')).toHaveAttribute('aria-valuenow', '2099')
  })

  it('plays the form sounds while animations are turned off', async () => {
    renderHearing([keller], false)
    await openTheTaskForm()

    expect(await soundsOfTapping(radio('Stichtag'))).toEqual(['activate'])
    expect(
      await soundsOfTapping(
        screen.getByRole('checkbox', { name: 'Wiederkehrend' }),
      ),
    ).toEqual(['activate'])
    expect(await soundsOfTapping(stepButtonOf('Tag', '▲'))).toEqual(['arrow'])
  })
})
