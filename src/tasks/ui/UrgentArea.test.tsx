import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Announcer } from '../../shared/ui/Announcer'
import { useAnnouncer } from '../../shared/ui/useAnnouncer'
import { accessibilityViolations } from '../../testSupport/accessibility'
import {
  createInMemoryOrganizerClient,
  type InMemoryOrganizerClient,
} from '../api/inMemoryOrganizerClient'
import { calendarDayOf, type CalendarDay } from '../domain/calendarDay'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import { urgentTasksOf } from '../domain/organizer'
import type { Due, Task } from '../domain/task'
import {
  announced,
  button,
  heading,
  TENTH_OF_OCTOBER_MORNING,
} from './foldersAreaHarness'
import { UrgentArea } from './UrgentArea'
import { useOrganizer } from './useOrganizer'

const familie: Folder = { id: 'stored-1', name: 'Familie' }
const auto: Folder = { id: 'stored-2', name: 'Auto' }

const haushalt: List = {
  id: 'stored-list-1',
  name: 'Haushalt',
  folderId: familie.id,
}
const wartung: List = {
  id: 'stored-list-2',
  name: 'Wartung',
  folderId: auto.id,
}

function deadlineOn(deadline: CalendarDay): Due {
  return { kind: 'deadline', deadline, urgentFrom: 'oneWeek' }
}

function task(
  id: string,
  name: string,
  list: List,
  due: Due,
  createdAt: number,
): Task {
  return {
    id,
    listId: list.id,
    name,
    description: '',
    due,
    createdAt,
    completions: [],
  }
}

const muell = task(
  'stored-task-1',
  'Müll rausbringen',
  haushalt,
  { kind: 'urgent', since: '2026-10-01' },
  1,
)
const keller = task(
  'stored-task-2',
  'Keller aufräumen',
  haushalt,
  { kind: 'someday' },
  2,
)
const reifen = task(
  'stored-task-3',
  'Reifen wechseln',
  wartung,
  deadlineOn('2026-10-08'),
  3,
)
const oelwechsel = task(
  'stored-task-4',
  'Ölwechsel',
  wartung,
  deadlineOn('2026-10-15'),
  4,
)
const zahnriemen = task(
  'stored-task-5',
  'Zahnriemen',
  wartung,
  deadlineOn('2026-10-20'),
  5,
)

const TENTH_OF_OCTOBER = calendarDayOf(TENTH_OF_OCTOBER_MORNING)

const ALL_TASKS = [zahnriemen, oelwechsel, keller, reifen, muell]

const MUELL_ROW = 'Müll rausbringen, dringend, Familie, Haushalt'
const REIFEN_ROW = 'Reifen wechseln, überfällig seit 8. Oktober, Auto, Wartung'
const OELWECHSEL_ROW =
  'Ölwechsel, Stichtag 15. Oktober, dringend, Auto, Wartung'

function UrgentAreaHarness({ client }: { client: InMemoryOrganizerClient }) {
  const [organizerClient] = useState(() => client)
  const organizer = useOrganizer(organizerClient)
  const { spokenText, announce } = useAnnouncer()

  return (
    <>
      <UrgentArea
        organizer={organizer}
        urgentTasks={urgentTasksOf(organizer, TENTH_OF_OCTOBER)}
        navigation={
          <nav aria-label="Bereiche">
            <button type="button">Dringend</button>
          </nav>
        }
        announce={announce}
        today={TENTH_OF_OCTOBER}
        now={() => TENTH_OF_OCTOBER_MORNING}
      />
      <Announcer text={spokenText} />
    </>
  )
}

function renderUrgentArea(tasks: readonly Task[] = ALL_TASKS) {
  const client = createInMemoryOrganizerClient({
    folders: [familie, auto],
    lists: [haushalt, wartung],
    tasks,
  })
  const rendered = render(<UrgentAreaHarness client={client} />)
  return { client, container: rendered.container }
}

function rowNames() {
  return screen
    .getAllByRole('listitem')
    .map((item) => item.querySelector('.taskRowName'))
    .map((name) => name?.textContent?.replace(/\s+/g, ' ').trim())
}

function storedTask(client: InMemoryOrganizerClient, id: string) {
  return client.storedTasks().find((each) => each.id === id)
}

async function pressDayDown(times: number) {
  screen.getByRole('spinbutton', { name: 'Tag' }).focus()
  for (let pressed = 0; pressed < times; pressed += 1)
    await userEvent.keyboard('{ArrowDown}')
}

describe('UrgentArea urgent page', () => {
  it('tells that nothing is urgent with the heading focused', () => {
    renderUrgentArea([keller, zahnriemen])

    expect(heading('Dringend')).toHaveFocus()
    expect(screen.getByText('Nichts Dringendes.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Filter' })).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Liste bearbeiten' }),
    ).toBeNull()
    expect(screen.queryByRole('button', { name: 'Aufgabe anlegen' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Zurück/ })).toBeNull()
  })

  it('gathers the urgent tasks of all lists in order, named with their origin', () => {
    renderUrgentArea()

    expect(rowNames().map((name) => name?.replace(/,.*/, ''))).toEqual([
      'Müll rausbringen',
      'Reifen wechseln',
      'Ölwechsel',
    ])
    for (const name of [MUELL_ROW, REIFEN_ROW, OELWECHSEL_ROW])
      expect(button(name)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Keller/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Zahnriemen/ })).toBeNull()
  })

  it('shows the origin as a third line with the arrow hidden from assistive technology', () => {
    renderUrgentArea()

    const origin = button(MUELL_ROW).querySelector('.taskRowOrigin')
    expect(origin?.textContent).toBe('Familie ›, Haushalt')
    expect(screen.getAllByText('›')[0]).toHaveAttribute('aria-hidden', 'true')
  })

  it('opens the overview and returns to the name of the task', async () => {
    renderUrgentArea()

    await userEvent.click(button(MUELL_ROW))
    expect(heading('Müll rausbringen')).toHaveFocus()

    await userEvent.click(button('Zurück'))
    expect(heading('Dringend')).toBeInTheDocument()
    expect(button(MUELL_ROW)).toHaveFocus()
  })

  it('completes a task, focuses the following row and announces it', async () => {
    const { client } = renderUrgentArea()

    await userEvent.click(button('Müll rausbringen erledigen'))
    await userEvent.click(button('Erledigen'))

    expect(storedTask(client, muell.id)?.completions).toEqual([
      TENTH_OF_OCTOBER_MORNING.getTime(),
    ])
    expect(announced()).toHaveTextContent('Müll rausbringen erledigt.')
    expect(button(REIFEN_ROW)).toHaveFocus()
    expect(screen.queryByRole('button', { name: MUELL_ROW })).toBeNull()
  })

  it('returns to the check box when the completion is cancelled', async () => {
    renderUrgentArea()

    await userEvent.click(button('Müll rausbringen erledigen'))
    await userEvent.click(button('Abbrechen'))

    expect(button('Müll rausbringen erledigen')).toHaveFocus()
  })

  it('focuses the new last row after completing the last one', async () => {
    renderUrgentArea()

    await userEvent.click(button('Ölwechsel erledigen'))
    await userEvent.click(button('Erledigen'))

    expect(button(REIFEN_ROW)).toHaveFocus()
  })

  it('focuses the heading after completing the only urgent task', async () => {
    renderUrgentArea([muell, keller])

    await userEvent.click(button('Müll rausbringen erledigen'))
    await userEvent.click(button('Erledigen'))

    expect(heading('Dringend')).toHaveFocus()
    expect(screen.getByText('Nichts Dringendes.')).toBeInTheDocument()
  })

  it('announces a task no longer urgent and focuses the row at its place', async () => {
    renderUrgentArea()
    await userEvent.click(button(MUELL_ROW))
    await userEvent.click(button('Bearbeiten'))

    await userEvent.click(screen.getByRole('radio', { name: 'Irgendwann' }))
    await userEvent.click(button('Speichern'))
    await userEvent.click(button('Zurück'))

    expect(announced()).toHaveTextContent(
      'Müll rausbringen ist nicht mehr dringend.',
    )
    expect(button(REIFEN_ROW)).toHaveFocus()
  })

  it('follows a task still urgent to its new place', async () => {
    renderUrgentArea()
    await userEvent.click(button(OELWECHSEL_ROW))
    await userEvent.click(button('Bearbeiten'))

    await pressDayDown(8)
    await userEvent.click(button('Speichern'))
    await userEvent.click(button('Zurück'))

    const movedRow = 'Ölwechsel, überfällig seit 7. Oktober, Auto, Wartung'
    expect(button(movedRow)).toHaveFocus()
    expect(rowNames()[1]).toMatch(/^Ölwechsel/)
    expect(announced()).not.toHaveTextContent('nicht mehr dringend')
  })

  it('deletes a task and announces it', async () => {
    const { client } = renderUrgentArea()
    await userEvent.click(button(MUELL_ROW))

    await userEvent.click(button('Löschen'))
    await userEvent.click(button('Löschen'))

    expect(storedTask(client, muell.id)).toBeUndefined()
    expect(announced()).toHaveTextContent('Aufgabe Müll rausbringen gelöscht.')
    expect(button(REIFEN_ROW)).toHaveFocus()
  })

  it('stays on the overview of a task moved to another list', async () => {
    renderUrgentArea()
    await userEvent.click(button(MUELL_ROW))
    await userEvent.click(button('Bearbeiten'))

    await userEvent.selectOptions(screen.getByLabelText('Liste'), 'Wartung')
    await userEvent.click(button('Speichern'))

    expect(heading('Müll rausbringen')).toHaveFocus()
    await userEvent.click(button('Zurück'))
    expect(button('Müll rausbringen, dringend, Auto, Wartung')).toHaveFocus()
  })

  it.each([
    ['the task', { tasks: [reifen, oelwechsel] }],
    ['its list', { lists: [wartung] }],
  ])(
    'returns to the urgent page when %s is deleted elsewhere',
    async (_deleted, arriving) => {
      const { client } = renderUrgentArea()
      await userEvent.click(button(MUELL_ROW))

      act(() => client.arrivesFromElsewhere(arriving))

      expect(heading('Dringend')).toHaveFocus()
      expect(announced()).toHaveTextContent(
        'Aufgabe Müll rausbringen wurde gelöscht.',
      )
    },
  )

  it('shows an empty urgent page without accessibility violations', async () => {
    const { container } = renderUrgentArea([keller])

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows urgent, deadline and overdue rows without accessibility violations', async () => {
    const { container } = renderUrgentArea()

    expect(await accessibilityViolations(container)).toEqual([])
  })
})
