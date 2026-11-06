import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactNode } from 'react'
import type { SoundEffects } from '../../shared/sound/soundEffects'
import { Announcer } from '../../shared/ui/Announcer'
import { PageSlideProvider } from '../../shared/ui/PageSlideProvider'
import { useAnnouncer } from '../../shared/ui/useAnnouncer'
import {
  createInMemoryOrganizerClient,
  type InMemoryOrganizerClient,
} from '../api/inMemoryOrganizerClient'
import { calendarDayOf } from '../domain/calendarDay'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import type { Task } from '../domain/task'
import { FoldersArea } from './FoldersArea'
import { useOrganizer } from './useOrganizer'

export const TENTH_OF_OCTOBER_MORNING = new Date(2026, 9, 10, 9, 0)

export type Hearing = {
  soundEffects: SoundEffects
  animations?: boolean
}

function withHearing(hearing: Hearing | undefined, area: ReactNode) {
  if (hearing === undefined) return area
  return (
    <PageSlideProvider
      animations={hearing.animations ?? true}
      sounds
      soundEffects={hearing.soundEffects}
    >
      {area}
    </PageSlideProvider>
  )
}

export function FoldersAreaHarness({
  client,
  hearing,
}: {
  client: InMemoryOrganizerClient
  hearing?: Hearing
}) {
  const [organizerClient] = useState(() => client)
  const organizer = useOrganizer(organizerClient)
  const { spokenText, announce } = useAnnouncer()

  return (
    <>
      {withHearing(
        hearing,
        <FoldersArea
          organizer={organizer}
          navigation={
            <nav aria-label="Bereiche">
              <button type="button">Ordner</button>
            </nav>
          }
          announce={announce}
          today={calendarDayOf(TENTH_OF_OCTOBER_MORNING)}
          now={() => TENTH_OF_OCTOBER_MORNING}
        />,
      )}
      <Announcer text={spokenText} />
    </>
  )
}

export function renderFoldersArea(
  folders: readonly Folder[] = [],
  lists: readonly List[] = [],
  tasks: readonly Task[] = [],
  hearing?: Hearing,
) {
  const client = createInMemoryOrganizerClient({ folders, lists, tasks })
  const rendered = render(
    <FoldersAreaHarness client={client} hearing={hearing} />,
  )
  return { client, container: rendered.container }
}

export function heading(name: string) {
  return screen.getByRole('heading', { level: 1, name })
}

export function button(name: string) {
  return screen.getByRole('button', { name })
}

export function buttonNamedFirst(name: string) {
  return screen.getByRole('button', { name: new RegExp(`^${name}(,|$)`) })
}

export function announced() {
  return screen.getByRole('status')
}

export async function openFolder(name: string) {
  await userEvent.click(buttonNamedFirst(name))
}

export async function openList(folderName: string, name: string) {
  await openFolder(folderName)
  await userEvent.click(buttonNamedFirst(name))
}

export function filterButtonNamed(name: string) {
  return screen.getByRole('button', { name: new RegExp(`^${name} \\(`) })
}

export async function openCompletedList(folderName: string, name: string) {
  await openFolder(folderName)
  await userEvent.click(filterButtonNamed('erledigt'))
  await userEvent.click(buttonNamedFirst(name))
}
