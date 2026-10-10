import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import type { CalendarDay } from '../domain/calendarDay'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import type { Due, Task, UrgencyLead } from '../domain/task'
import {
  announced,
  button,
  buttonNamedFirst,
  heading,
  openFolder,
  openList,
  renderFoldersArea,
} from './foldersAreaHarness'

const familie: Folder = { id: 'stored-1', name: 'Familie' }

const haushalt: List = {
  id: 'stored-list-1',
  name: 'Haushalt',
  folderId: familie.id,
}

const SOMEDAY: Due = { kind: 'someday' }

function deadlineOn(
  deadline: CalendarDay,
  urgentFrom: UrgencyLead = 'onDeadline',
): Due {
  return { kind: 'deadline', deadline, urgentFrom }
}

function task(id: string, name: string, due: Due, createdAt = 0): Task {
  return {
    id,
    listId: haushalt.id,
    name,
    description: '',
    due,
    createdAt,
    completions: [],
  }
}

const reifen = task(
  'stored-task-1',
  'Reifen wechseln',
  deadlineOn('2026-10-20'),
)

function renderTasks(tasks: readonly Task[] = [reifen]) {
  return renderFoldersArea([familie], [haushalt], tasks)
}

function radio(name: string) {
  return screen.getByRole('radio', { name })
}

function spinButton(name: string) {
  return screen.getByRole('spinbutton', { name })
}

function stepButtonOf(field: HTMLElement, arrow: '▲' | '▼') {
  const column = field.closest('.deadlineField') as HTMLElement
  return within(column).getByText(arrow)
}

function deadlineGroup() {
  return screen.queryByRole('group', { name: 'Stichtag' })
}

function rowDetailOf(rowName: string) {
  return button(rowName).querySelector('.taskRowDetail')?.textContent?.trim()
}

function rowNames() {
  return screen
    .getAllByRole('listitem')
    .map((item) =>
      item.querySelector('.taskRowTitle')?.textContent?.replace(/,.*/, ''),
    )
}

async function startCreatingTask(name = 'Reifen wechseln') {
  await openList('Familie', 'Haushalt')
  await userEvent.click(button('Aufgabe anlegen'))
  await userEvent.type(screen.getByLabelText('Name'), name)
}

async function chooseDeadline() {
  await userEvent.click(radio('Stichtag'))
}

async function pressOn(field: HTMLElement, key: string) {
  field.focus()
  await userEvent.keyboard(`{${key}}`)
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

describe('FoldersArea creating a task with a deadline', () => {
  it('offers urgent, deadline and someday, someday chosen, no deadline yet', async () => {
    renderTasks([])

    await startCreatingTask()

    const dueGroup = screen.getByRole('group', { name: 'Fälligkeit' })
    expect(
      within(dueGroup)
        .getAllByRole('radio')
        .map((choice) => choice.getAttribute('value')),
    ).toEqual(['urgent', 'deadline', 'someday'])
    expect(radio('Stichtag')).toBeInTheDocument()
    expect(radio('Irgendwann')).toBeChecked()
    expect(deadlineGroup()).toBeNull()
  })

  it('shows day, month and year a week ahead once the deadline is chosen', async () => {
    renderTasks([])
    await startCreatingTask()

    await chooseDeadline()

    expect(deadlineGroup()).toBeInTheDocument()
    const day = spinButton('Tag')
    expect(day).toHaveAttribute('aria-valuenow', '17')
    expect(day).toHaveAttribute('aria-valuemin', '1')
    expect(day).toHaveAttribute('aria-valuemax', '31')
    const month = spinButton('Monat')
    expect(month).toHaveAttribute('aria-valuenow', '10')
    expect(month).toHaveAttribute('aria-valuetext', 'Oktober')
    expect(month).toHaveTextContent('Oktober')
    expect(month).toHaveAttribute('aria-valuemin', '1')
    expect(month).toHaveAttribute('aria-valuemax', '12')
    const year = spinButton('Jahr')
    expect(year).toHaveAttribute('aria-valuenow', '2026')
    expect(year).toHaveAttribute('aria-valuemin', '2000')
    expect(year).toHaveAttribute('aria-valuemax', '2099')
  })

  it('steps the fields with the arrow keys and the arrow buttons', async () => {
    renderTasks([])
    await startCreatingTask()
    await chooseDeadline()

    await pressOn(spinButton('Tag'), 'ArrowUp')
    await pressOn(spinButton('Monat'), 'ArrowDown')
    await userEvent.click(stepButtonOf(spinButton('Jahr'), '▲'))

    expect(spinButton('Tag')).toHaveAttribute('aria-valuenow', '18')
    expect(spinButton('Monat')).toHaveAttribute('aria-valuetext', 'September')
    expect(spinButton('Jahr')).toHaveAttribute('aria-valuenow', '2027')
  })

  it('hides the arrow buttons from assistive technology', async () => {
    renderTasks([])
    await startCreatingTask()
    await chooseDeadline()

    expect(screen.queryByRole('button', { name: '▲' })).toBeNull()
    expect(screen.queryByRole('button', { name: '▼' })).toBeNull()
    expect(stepButtonOf(spinButton('Tag'), '▲')).toHaveAttribute(
      'tabindex',
      '-1',
    )
  })

  it('saves the chosen deadline, focuses its row and announces it', async () => {
    const { client } = renderTasks([])
    await startCreatingTask()
    await chooseDeadline()

    await pressOn(spinButton('Tag'), 'ArrowUp')
    await save()

    expect(client.storedTasks()[0].due).toEqual({
      kind: 'deadline',
      deadline: '2026-10-18',
      urgentFrom: 'oneWeek',
    })
    expect(button('Reifen wechseln, Stichtag 18. Oktober')).toHaveFocus()
    expect(rowDetailOf('Reifen wechseln, Stichtag 18. Oktober')).toBe('18.10.')
    expect(announced()).toHaveTextContent('Aufgabe Reifen wechseln angelegt.')
  })

  it('keeps the chosen deadline when switching to someday and back', async () => {
    renderTasks([])
    await startCreatingTask()
    await chooseDeadline()
    await pressOn(spinButton('Tag'), 'ArrowUp')
    await pressOn(spinButton('Tag'), 'ArrowUp')
    await pressOn(spinButton('Tag'), 'ArrowUp')

    await userEvent.click(radio('Irgendwann'))
    expect(deadlineGroup()).toBeNull()
    await chooseDeadline()

    expect(spinButton('Tag')).toHaveAttribute('aria-valuenow', '20')
  })

  it('shows the form with a deadline without accessibility violations', async () => {
    const { container } = renderTasks([])
    await startCreatingTask()

    await chooseDeadline()

    expect(await accessibilityViolations(container)).toEqual([])
  })
})

describe('FoldersArea editing a task with a deadline', () => {
  function storedDue(client: ReturnType<typeof renderTasks>['client']) {
    return client.storedTasks()[0].due
  }

  it('fills in the stored deadline', async () => {
    renderTasks()

    await startEditingTask('Reifen wechseln')

    expect(radio('Stichtag')).toBeChecked()
    expect(spinButton('Tag')).toHaveAttribute('aria-valuenow', '20')
    expect(spinButton('Monat')).toHaveAttribute('aria-valuetext', 'Oktober')
    expect(spinButton('Jahr')).toHaveAttribute('aria-valuenow', '2026')
  })

  it('cuts the day to the end of a shorter month', async () => {
    renderTasks([
      task('stored-task-1', 'Reifen wechseln', deadlineOn('2026-10-31')),
    ])
    await startEditingTask('Reifen wechseln')

    await pressOn(spinButton('Monat'), 'ArrowUp')

    expect(spinButton('Monat')).toHaveAttribute('aria-valuetext', 'November')
    expect(spinButton('Tag')).toHaveAttribute('aria-valuenow', '30')
    expect(spinButton('Tag')).toHaveAttribute('aria-valuemax', '30')
  })

  it('stops the year at its latest value', async () => {
    renderTasks([
      task('stored-task-1', 'Reifen wechseln', deadlineOn('2099-06-15')),
    ])
    await startEditingTask('Reifen wechseln')

    await pressOn(spinButton('Jahr'), 'ArrowUp')
    await pressOn(spinButton('Jahr'), 'ArrowUp')

    expect(spinButton('Jahr')).toHaveAttribute('aria-valuenow', '2099')
  })

  it('makes a deadline task urgent since today', async () => {
    const { client } = renderTasks()
    await startEditingTask('Reifen wechseln')

    await userEvent.click(radio('Dringend'))
    await save()

    expect(storedDue(client)).toEqual({ kind: 'urgent', since: '2026-10-10' })
  })

  it('makes a deadline task someday', async () => {
    const { client } = renderTasks()
    await startEditingTask('Reifen wechseln')

    await userEvent.click(radio('Irgendwann'))
    await save()

    expect(storedDue(client)).toEqual(SOMEDAY)
  })

  it('gives an urgent task a deadline a week ahead', async () => {
    const { client } = renderTasks([
      task('stored-task-1', 'Reifen wechseln', {
        kind: 'urgent',
        since: '2026-10-01',
      }),
    ])
    await startEditingTask('Reifen wechseln')

    await chooseDeadline()
    expect(spinButton('Tag')).toHaveAttribute('aria-valuenow', '17')
    expect(spinButton('Monat')).toHaveAttribute('aria-valuetext', 'Oktober')
    expect(spinButton('Jahr')).toHaveAttribute('aria-valuenow', '2026')
    await save()

    expect(storedDue(client)).toEqual({
      kind: 'deadline',
      deadline: '2026-10-17',
      urgentFrom: 'oneWeek',
    })
  })

  it('shows the form to edit a deadline task without accessibility violations', async () => {
    const { container } = renderTasks()

    await startEditingTask('Reifen wechseln')

    expect(await accessibilityViolations(container)).toEqual([])
  })
})

describe('FoldersArea showing tasks with a deadline', () => {
  it('names the year of a deadline in another year', async () => {
    renderTasks([
      task('stored-task-1', 'Reifen wechseln', deadlineOn('2027-01-17')),
    ])

    await openList('Familie', 'Haushalt')

    expect(rowDetailOf('Reifen wechseln, Stichtag 17. Januar 2027')).toBe(
      '17.01.2027',
    )
  })

  it('shows the deadline with its year on the overview', async () => {
    renderTasks([
      task('stored-task-1', 'Reifen wechseln', deadlineOn('2026-10-17')),
    ])

    await openTask('Reifen wechseln')

    expect(heading('Reifen wechseln')).toHaveFocus()
    expect(screen.getByText('Fälligkeit')).toBeInTheDocument()
    expect(screen.getByText('Stichtag 17. Oktober 2026')).toBeInTheDocument()
  })

  it('puts deadline tasks between urgent and someday tasks, nearest first', async () => {
    renderTasks([
      task('t-1', 'Keller', SOMEDAY, 1),
      task('t-2', 'Fenster', deadlineOn('2026-10-20'), 2),
      task('t-3', 'Reifen', deadlineOn('2026-10-15'), 3),
      task('t-4', 'Müll', { kind: 'urgent', since: '2026-10-10' }, 4),
    ])

    await openList('Familie', 'Haushalt')

    expect(rowNames()).toEqual(['Müll', 'Reifen', 'Fenster', 'Keller'])
  })

  it('shows a list with a deadline task without accessibility violations', async () => {
    const { container } = renderTasks()

    await openList('Familie', 'Haushalt')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows the overview of a deadline task without accessibility violations', async () => {
    const { container } = renderTasks()

    await openTask('Reifen wechseln')

    expect(await accessibilityViolations(container)).toEqual([])
  })
})

describe('FoldersArea urgency lead and overdue deadlines', () => {
  function urgencyLeadField() {
    return screen.queryByRole('combobox', { name: 'Dringend ab' })
  }

  function chosenUrgencyLead() {
    const field = urgencyLeadField() as HTMLSelectElement
    return field.selectedOptions[0].textContent
  }

  it('offers the urgency leads once the deadline is chosen, one week chosen', async () => {
    renderTasks([])
    await startCreatingTask()

    await chooseDeadline()

    const field = urgencyLeadField() as HTMLSelectElement
    expect([...field.options].map((option) => option.textContent)).toEqual([
      'sofort',
      'am Stichtag',
      '1 Tag vorher',
      '1 Woche vorher',
      '1 Monat vorher',
      '¼ Jahr vorher',
      '½ Jahr vorher',
      '1 Jahr vorher',
    ])
    expect(chosenUrgencyLead()).toBe('1 Woche vorher')
    await userEvent.click(radio('Irgendwann'))
    expect(urgencyLeadField()).toBeNull()
  })

  it('saves the chosen urgency lead and fills it in when editing', async () => {
    const { client } = renderTasks([])
    await startCreatingTask()
    await chooseDeadline()

    await userEvent.selectOptions(
      urgencyLeadField() as HTMLSelectElement,
      '1 Monat vorher',
    )
    await save()

    expect(client.storedTasks()[0].due).toEqual({
      kind: 'deadline',
      deadline: '2026-10-17',
      urgentFrom: 'oneMonth',
    })
    await userEvent.click(buttonNamedFirst('Reifen wechseln'))
    await userEvent.click(button('Bearbeiten'))
    expect(chosenUrgencyLead()).toBe('1 Monat vorher')
  })

  it('shows no flame before the lead is reached', async () => {
    renderTasks([
      task('t-1', 'Reifen wechseln', deadlineOn('2026-10-20', 'oneWeek')),
    ])

    await openList('Familie', 'Haushalt')

    const row = button('Reifen wechseln, Stichtag 20. Oktober')
    expect(row.querySelector('.taskRowDetail svg')).not.toBeNull()
    expect(row.querySelectorAll('.taskRowDetail svg')).toHaveLength(1)
  })

  it('shows a flame once the lead is reached', async () => {
    renderTasks([
      task('t-1', 'Reifen wechseln', deadlineOn('2026-10-15', 'oneWeek')),
    ])

    await openList('Familie', 'Haushalt')

    const row = button('Reifen wechseln, Stichtag 15. Oktober, dringend')
    expect(row.querySelectorAll('.taskRowDetail svg')).toHaveLength(2)
    expect(rowDetailOf('Reifen wechseln, Stichtag 15. Oktober, dringend')).toBe(
      '15.10.',
    )
  })

  it('marks an overdue row without a flame', async () => {
    renderTasks([task('t-1', 'Reifen wechseln', deadlineOn('2026-10-08'))])

    await openList('Familie', 'Haushalt')

    const row = button('Reifen wechseln, überfällig seit 8. Oktober')
    const detail = row.querySelector('.taskRowDetail') as HTMLElement
    expect(detail).toHaveClass('overdue')
    expect(detail.textContent?.trim()).toBe('08.10. überfällig')
    expect(detail.querySelectorAll('svg')).toHaveLength(1)
  })

  it('marks an overdue deadline on the overview', async () => {
    renderTasks([task('t-1', 'Reifen wechseln', deadlineOn('2026-10-08'))])

    await openTask('Reifen wechseln')

    const dueFact = screen.getByText(/^Stichtag 8\. Oktober 2026/)
    expect(dueFact.textContent?.trim()).toBe(
      'Stichtag 8. Oktober 2026, überfällig',
    )
    expect(screen.getByText(', überfällig')).toHaveClass('overdue')
  })

  it('shows the urgency lead on the overview', async () => {
    renderTasks([
      task('t-1', 'Reifen wechseln', deadlineOn('2026-10-20', 'oneWeek')),
    ])

    await openTask('Reifen wechseln')

    expect(screen.getByText('Dringend ab')).toBeInTheDocument()
    expect(screen.getByText('1 Woche vorher')).toBeInTheDocument()
  })

  it.each([
    ['urgent', { kind: 'urgent', since: '2026-10-01' }],
    ['someday', SOMEDAY],
  ] as const)('shows no urgency lead for a %s task', async (_kind, due) => {
    renderTasks([task('t-1', 'Reifen wechseln', due)])

    await openTask('Reifen wechseln')

    expect(screen.queryByText('Dringend ab')).toBeNull()
  })

  it('counts deadline tasks with a reached lead as urgent on the list button', async () => {
    renderTasks([
      task('t-1', 'Reifen', deadlineOn('2026-10-15', 'oneWeek')),
      task('t-2', 'Fenster', deadlineOn('2026-10-20', 'oneWeek')),
      task('t-3', 'Müll', { kind: 'urgent', since: '2026-10-10' }),
    ])

    await openFolder('Familie')

    expect(button('Haushalt, 3 offen, 2 dringend')).toBeInTheDocument()
  })

  it('shows the form with an urgency lead without accessibility violations', async () => {
    const { container } = renderTasks([])
    await startCreatingTask()

    await chooseDeadline()

    expect(urgencyLeadField()).not.toBeNull()
    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows a list with overdue and urgent deadlines without accessibility violations', async () => {
    const { container } = renderTasks([
      task('t-1', 'Reifen', deadlineOn('2026-10-08')),
      task('t-2', 'Fenster', deadlineOn('2026-10-15', 'oneWeek')),
    ])

    await openList('Familie', 'Haushalt')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows the overview of an overdue task without accessibility violations', async () => {
    const { container } = renderTasks([
      task('t-1', 'Reifen wechseln', deadlineOn('2026-10-08')),
    ])

    await openTask('Reifen wechseln')

    expect(await accessibilityViolations(container)).toEqual([])
  })
})
