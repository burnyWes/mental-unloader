import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import type { CalendarDay } from '../domain/calendarDay'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import type { RepeatRhythm } from '../domain/repetition'
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

const haushalt: List = {
  id: 'stored-list-1',
  name: 'Haushalt',
  folderId: familie.id,
}

function recurringOn(
  deadline: CalendarDay,
  rhythm: RepeatRhythm = 'monthly',
  anchorDay = Number(deadline.slice(8)),
): Due {
  return {
    kind: 'deadline',
    deadline,
    urgentFrom: 'oneWeek',
    repetition: { rhythm, anchorDay },
  }
}

function task(
  id: string,
  name: string,
  due: Due,
  completions: readonly number[] = [],
  createdAt = 0,
): Task {
  return {
    id,
    listId: haushalt.id,
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
  recurringOn('2026-10-20'),
)

function renderTasks(tasks: readonly Task[] = [muell]) {
  return renderFoldersArea([familie], [haushalt], tasks)
}

function radio(name: string) {
  return screen.getByRole('radio', { name })
}

function repeatsField() {
  return screen.queryByRole('checkbox', { name: 'Wiederkehrend' })
}

function rhythmField() {
  return screen.queryByRole('combobox', { name: 'Rhythmus' })
}

function chosenRhythm() {
  return (rhythmField() as HTMLSelectElement).selectedOptions[0].textContent
}

function storedDue(client: ReturnType<typeof renderTasks>['client']) {
  return client.storedTasks()[0].due
}

async function startCreatingTask(name = 'Müll rausbringen') {
  await openList('Familie', 'Haushalt')
  await userEvent.click(button('Aufgabe anlegen'))
  await userEvent.type(screen.getByLabelText('Name'), name)
}

async function save() {
  await userEvent.click(button('Speichern'))
}

async function openTask(name: string) {
  await openList('Familie', 'Haushalt')
  await userEvent.click(buttonNamedFirst(name))
}

async function startEditingTask(name: string) {
  await openTask(name)
  await userEvent.click(button('Bearbeiten'))
}

describe('FoldersArea creating a recurring task', () => {
  it('offers the repetition only for a deadline, unchecked', async () => {
    renderTasks([])
    await startCreatingTask()

    expect(repeatsField()).toBeNull()
    await userEvent.click(radio('Stichtag'))
    expect(repeatsField()).not.toBeChecked()
    expect(rhythmField()).toBeNull()
    await userEvent.click(radio('Dringend'))
    expect(repeatsField()).toBeNull()
  })

  it('offers the rhythms once checked, monthly chosen', async () => {
    renderTasks([])
    await startCreatingTask()
    await userEvent.click(radio('Stichtag'))

    await userEvent.click(repeatsField() as HTMLElement)

    const field = rhythmField() as HTMLSelectElement
    expect([...field.options].map((option) => option.textContent)).toEqual([
      'wöchentlich',
      'monatlich',
      'vierteljährlich',
      'halbjährlich',
      'jährlich',
    ])
    expect(chosenRhythm()).toBe('monatlich')
  })

  it('saves the repetition anchored on the deadline and names the rhythm in the row', async () => {
    const { client } = renderTasks([])
    await startCreatingTask()
    await userEvent.click(radio('Stichtag'))
    await userEvent.click(repeatsField() as HTMLElement)
    await userEvent.selectOptions(rhythmField() as HTMLElement, 'wöchentlich')

    await save()

    expect(storedDue(client)).toEqual(recurringOn('2026-10-17', 'weekly', 17))
    const row = button(
      'Müll rausbringen, Stichtag 17. Oktober, wöchentlich, dringend',
    )
    expect(row).toHaveFocus()
    expect(row.querySelectorAll('.taskRowDetail svg')).toHaveLength(3)
  })

  it('shows the form with a rhythm without accessibility violations', async () => {
    const { container } = renderTasks([])
    await startCreatingTask()
    await userEvent.click(radio('Stichtag'))

    await userEvent.click(repeatsField() as HTMLElement)

    expect(await accessibilityViolations(container)).toEqual([])
  })
})

describe('FoldersArea showing a recurring task', () => {
  it('names the rhythm before the urgency in the row', async () => {
    renderTasks([
      task('t-1', 'Müll rausbringen', recurringOn('2026-10-15', 'weekly')),
    ])

    await openList('Familie', 'Haushalt')

    expect(
      button('Müll rausbringen, Stichtag 15. Oktober, wöchentlich, dringend'),
    ).toBeInTheDocument()
  })

  it('names the rhythm behind an overdue deadline', async () => {
    renderTasks([task('t-1', 'Müll rausbringen', recurringOn('2026-10-08'))])

    await openList('Familie', 'Haushalt')

    expect(
      button('Müll rausbringen, überfällig seit 8. Oktober, monatlich'),
    ).toBeInTheDocument()
  })

  it('shows the repetition on the overview', async () => {
    renderTasks()

    await openTask('Müll rausbringen')

    expect(heading('Müll rausbringen')).toHaveFocus()
    expect(screen.getByText('Wiederholung')).toBeInTheDocument()
    expect(screen.getByText('monatlich')).toBeInTheDocument()
  })

  it('shows the overview of a recurring task without accessibility violations', async () => {
    const { container } = renderTasks()

    await openTask('Müll rausbringen')

    expect(await accessibilityViolations(container)).toEqual([])
  })
})

describe('FoldersArea editing a recurring task', () => {
  it('fills in the repetition and its rhythm', async () => {
    renderTasks([
      task('t-1', 'Müll rausbringen', recurringOn('2026-10-20', 'quarterly')),
    ])

    await startEditingTask('Müll rausbringen')

    expect(repeatsField()).toBeChecked()
    expect(chosenRhythm()).toBe('vierteljährlich')
  })

  it('keeps the anchor while the deadline stays the same', async () => {
    const { client } = renderTasks([
      task('t-1', 'Müll rausbringen', recurringOn('2027-02-28', 'monthly', 31)),
    ])
    await startEditingTask('Müll rausbringen')

    await userEvent.type(screen.getByLabelText('Name'), '!')
    await save()

    expect(storedDue(client)).toEqual(recurringOn('2027-02-28', 'monthly', 31))
  })
})

const DAY = 24 * 60 * 60 * 1000
const NOW = TENTH_OF_OCTOBER_MORNING.getTime()

function onceOn(deadline: CalendarDay): Due {
  return { kind: 'deadline', deadline, urgentFrom: 'oneWeek', repetition: null }
}

const weeklyMuell = task(
  'stored-task-1',
  'Müll rausbringen',
  recurringOn('2026-10-15', 'weekly'),
  [],
  1,
)
const blumen = task(
  'stored-task-2',
  'Blumen gießen',
  onceOn('2026-10-18'),
  [],
  2,
)
const steuer = task('stored-task-3', 'Steuer', onceOn('2026-10-30'), [], 3)

const MUELL_ROW =
  'Müll rausbringen, Stichtag 15. Oktober, wöchentlich, dringend'
const MOVED_MUELL_ROW = 'Müll rausbringen, Stichtag 22. Oktober, wöchentlich'
const BLUMEN_ROW = 'Blumen gießen, Stichtag 18. Oktober'

function rowNames() {
  return screen
    .getAllByRole('listitem')
    .map((item) =>
      item.querySelector('.taskRowTitle')?.textContent?.replace(/,.*/, ''),
    )
}

function filterButton(name: string) {
  return screen.getByRole('button', { name: new RegExp(`^${name} \\(`) })
}

async function completeFromRow(rowOwner: string) {
  await openList('Familie', 'Haushalt')
  await userEvent.click(button(`${rowOwner} erledigen`))
}

function storedTask(
  client: ReturnType<typeof renderTasks>['client'],
  id: string,
) {
  return client.storedTasks().find((each) => each.id === id)
}

describe('FoldersArea completing a recurring task', () => {
  it('names the next deadline before completing', async () => {
    renderTasks([weeklyMuell, blumen, steuer])

    await completeFromRow('Müll rausbringen')

    expect(heading('Müll rausbringen erledigen?')).toBeInTheDocument()
    expect(
      screen.getByText('Der nächste Stichtag ist der 22. Oktober.'),
    ).toBeInTheDocument()
  })

  it('moves the deadline, keeps the task open and focuses the row now at its place', async () => {
    const { client } = renderTasks([weeklyMuell, blumen, steuer])
    await completeFromRow('Müll rausbringen')

    await userEvent.click(button('Erledigen'))

    expect(storedTask(client, weeklyMuell.id)).toMatchObject({
      due: recurringOn('2026-10-22', 'weekly', 15),
      completions: [NOW],
    })
    expect(rowNames()).toEqual(['Blumen gießen', 'Müll rausbringen', 'Steuer'])
    expect(button(BLUMEN_ROW)).toHaveFocus()
    expect(button(MOVED_MUELL_ROW)).toBeInTheDocument()
    expect(announced()).toHaveTextContent(
      'Müll rausbringen erledigt, nächster Stichtag 22. Oktober.',
    )
    expect(filterButton('offen')).toHaveTextContent('offen (3)')
    expect(filterButton('erledigt')).toHaveTextContent('erledigt (1)')
  })

  it('focuses the following row also when the snapshot arrives later', async () => {
    const { client } = renderTasks([weeklyMuell, blumen, steuer])
    await completeFromRow('Müll rausbringen')
    client.holdBackSnapshots()

    await userEvent.click(button('Erledigen'))

    expect(button(BLUMEN_ROW)).toHaveFocus()
    expect(button(MUELL_ROW)).toBeInTheDocument()
    act(() => client.releaseSnapshots())
    expect(button(BLUMEN_ROW)).toHaveFocus()
    expect(button(MOVED_MUELL_ROW)).toBeInTheDocument()
  })

  it('focuses the heading when it is the only open task', async () => {
    renderTasks([weeklyMuell])
    await completeFromRow('Müll rausbringen')

    await userEvent.click(button('Erledigen'))

    expect(heading('Haushalt')).toHaveFocus()
    expect(button(MOVED_MUELL_ROW)).toBeInTheDocument()
  })

  it('returns to the completed tasks when completed from there', async () => {
    const fenster = task(
      'stored-task-4',
      'Fenster putzen',
      { kind: 'someday' },
      [NOW - DAY],
      4,
    )
    renderTasks([{ ...weeklyMuell, completions: [NOW - 3 * DAY] }, fenster])
    await openList('Familie', 'Haushalt')
    await userEvent.click(filterButton('erledigt'))
    await userEvent.click(buttonNamedFirst('Müll rausbringen'))

    await userEvent.click(button('Erledigen'))
    await userEvent.click(button('Erledigen'))

    expect(filterButton('erledigt')).toHaveAttribute('aria-pressed', 'true')
    expect(
      button('Müll rausbringen, 2 mal erledigt, zuletzt am 10. Oktober'),
    ).toHaveFocus()
    expect(rowNames()).toEqual(['Müll rausbringen', 'Fenster putzen'])
  })
})

describe('FoldersArea showing the history of a recurring task', () => {
  const doneThrice = {
    ...weeklyMuell,
    completions: [NOW - 14 * DAY, NOW, NOW - 7 * DAY],
  }

  it('shows the task once among the completed ones with its count', async () => {
    renderTasks([doneThrice])
    await openList('Familie', 'Haushalt')

    await userEvent.click(filterButton('erledigt'))

    const row = button(
      'Müll rausbringen, 3 mal erledigt, zuletzt am 10. Oktober',
    )
    expect(row.querySelector('.taskRowDetail')?.textContent).toBe(
      '3× erledigt, zuletzt 10.10.',
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(filterButton('erledigt')).toHaveTextContent('erledigt (1)')
    expect(filterButton('offen')).toHaveTextContent('offen (1)')
  })

  it('lists every completion on the overview, the newest first, without reopening', async () => {
    renderTasks([doneThrice])

    await openTask('Müll rausbringen')

    expect(screen.getByText('Verlauf')).toBeInTheDocument()
    expect(screen.getByText('3× erledigt')).toBeInTheDocument()
    const history = screen.getByRole('list')
    expect(
      within(history)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['10. Oktober 2026', '3. Oktober 2026', '26. September 2026'])
    expect(screen.queryByText('Erledigt')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Wieder öffnen' })).toBeNull()
    expect(button('Erledigen')).toBeInTheDocument()
  })

  it('shows the overview with a history without accessibility violations', async () => {
    const { container } = renderTasks([doneThrice])

    await openTask('Müll rausbringen')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows the completed tasks without accessibility violations', async () => {
    const { container } = renderTasks([doneThrice])
    await openList('Familie', 'Haushalt')

    await userEvent.click(filterButton('erledigt'))

    expect(await accessibilityViolations(container)).toEqual([])
  })
})

describe('FoldersArea ending or starting a repetition', () => {
  const doneTwice = { ...weeklyMuell, completions: [NOW - 7 * DAY, NOW] }

  it('clears the history once the repetition is unchecked', async () => {
    const { client } = renderTasks([doneTwice])
    await startEditingTask('Müll rausbringen')

    await userEvent.click(repeatsField() as HTMLElement)
    await save()

    expect(storedTask(client, doneTwice.id)).toMatchObject({
      due: onceOn('2026-10-15'),
      completions: [],
    })
    await userEvent.click(button('Zurück'))
    expect(filterButton('offen')).toHaveTextContent('offen (1)')
    expect(filterButton('erledigt')).toHaveTextContent('erledigt (0)')
  })

  it('clears the history once the task turns someday', async () => {
    const { client } = renderTasks([doneTwice])
    await startEditingTask('Müll rausbringen')

    await userEvent.click(radio('Irgendwann'))
    await save()

    expect(storedTask(client, doneTwice.id)).toMatchObject({
      due: { kind: 'someday' },
      completions: [],
    })
  })

  it('keeps the history and anchors anew when the deadline changes', async () => {
    const { client } = renderTasks([doneTwice])
    await startEditingTask('Müll rausbringen')

    screen.getByRole('spinbutton', { name: 'Tag' }).focus()
    await userEvent.keyboard('{ArrowUp}')
    await save()

    expect(storedTask(client, doneTwice.id)).toMatchObject({
      due: recurringOn('2026-10-16', 'weekly', 16),
      completions: doneTwice.completions,
    })
  })

  it('opens a completed task once it turns recurring', async () => {
    renderTasks([
      task('stored-task-1', 'Müll rausbringen', onceOn('2026-10-20'), [NOW], 1),
    ])
    await openList('Familie', 'Haushalt')
    await userEvent.click(filterButton('erledigt'))
    await userEvent.click(buttonNamedFirst('Müll rausbringen'))
    await userEvent.click(button('Bearbeiten'))

    await userEvent.click(repeatsField() as HTMLElement)
    await save()
    await userEvent.click(button('Zurück'))

    expect(
      button('Müll rausbringen, 1 mal erledigt, zuletzt am 10. Oktober'),
    ).toHaveFocus()
    expect(filterButton('offen')).toHaveTextContent('offen (1)')
  })
})
