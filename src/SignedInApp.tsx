import { useState } from 'react'
import type { Appearance } from './shared/appearance/useAppearance'
import { ChecklistIcon } from './shared/ui/ChecklistIcon'
import { ConfirmationPage } from './shared/ui/ConfirmationPage'
import { NavigationBar, type Area } from './shared/ui/NavigationBar'
import { directionBetween } from './shared/ui/pageSlide'
import { usePageSlide } from './shared/ui/PageSlideProvider'
import { SettingsIcon } from './shared/ui/SettingsIcon'
import { SettingsPage, type SettingsEntry } from './shared/ui/SettingsPage'
import type { OrganizerClient } from './tasks/api/organizerClient'
import { URGENT_AREA_NAME, urgentAreaLabel } from './tasks/domain/announcements'
import { urgentTasksOf } from './tasks/domain/organizer'
import { FolderIcon } from './tasks/ui/FolderIcon'
import { FoldersArea } from './tasks/ui/FoldersArea'
import { UrgentArea } from './tasks/ui/UrgentArea'
import { useOrganizer } from './tasks/ui/useOrganizer'
import { useToday } from './tasks/ui/useToday'

type AreaId = 'urgent' | 'folders' | 'settings'

function areasWithUrgentCount(
  urgentTaskCount: number,
): readonly Area<AreaId>[] {
  return [
    {
      id: 'urgent',
      label: URGENT_AREA_NAME,
      icon: <ChecklistIcon />,
      badge: {
        count: urgentTaskCount,
        label: urgentAreaLabel(urgentTaskCount),
      },
    },
    { id: 'folders', label: 'Ordner', icon: <FolderIcon /> },
    { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon /> },
  ]
}

type SignedInAppProps = {
  createOrganizerClient: (
    onFailure: (message: string) => void,
  ) => OrganizerClient
  appearance: Appearance
  announce: (text: string) => void
  now: () => Date
  onSignOut: () => void
}

export function SignedInApp({
  createOrganizerClient,
  appearance,
  announce,
  now,
  onSignOut,
}: SignedInAppProps) {
  const { slideBack, slideForward, slidePage, playSound } = usePageSlide()
  const [activeArea, setActiveArea] = useState<AreaId>('urgent')
  const [areaVisit, setAreaVisit] = useState(0)
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const [organizerClient] = useState(() => createOrganizerClient(announce))
  const organizer = useOrganizer(organizerClient)
  const today = useToday(now)
  const urgentTasks = urgentTasksOf(organizer, today)

  const settingsEntries: readonly SettingsEntry[] = [
    {
      kind: 'toggle',
      id: 'darkMode',
      label: 'Dunkelmodus',
      enabled: appearance.darkMode,
      onToggle: appearance.toggleDarkMode,
    },
    {
      kind: 'toggle',
      id: 'animations',
      label: 'Animationen',
      enabled: appearance.animations,
      onToggle: appearance.toggleAnimations,
    },
    {
      kind: 'toggle',
      id: 'sounds',
      label: 'Sounds',
      enabled: appearance.sounds,
      onToggle: appearance.toggleSounds,
      audibleWhenMuted: true,
    },
  ]

  const areas = areasWithUrgentCount(urgentTasks.length)

  function positionOf(area: AreaId): number {
    return areas.findIndex((each) => each.id === area)
  }

  function showArea(area: AreaId) {
    setActiveArea(area)
    setAreaVisit((visit) => visit + 1)
  }

  function selectArea(area: AreaId) {
    const direction = directionBetween(positionOf(activeArea), positionOf(area))
    if (direction === null) showArea(area)
    else slidePage(direction, () => showArea(area))
  }

  const navigation = (
    <NavigationBar
      areas={areas}
      activeArea={activeArea}
      onSelectArea={selectArea}
    />
  )

  const areaKey = `${activeArea}-${areaVisit}`

  function areaPage() {
    switch (activeArea) {
      case 'urgent':
        return (
          <UrgentArea
            key={areaKey}
            organizer={organizer}
            urgentTasks={urgentTasks}
            navigation={navigation}
            announce={announce}
            today={today}
            now={now}
          />
        )
      case 'folders':
        return (
          <FoldersArea
            key={areaKey}
            organizer={organizer}
            navigation={navigation}
            announce={announce}
            today={today}
            now={now}
          />
        )
      case 'settings':
        return (
          <SettingsPage
            key={areaKey}
            navigation={navigation}
            entries={settingsEntries}
            onRequestSignOut={() =>
              slideForward(() => setConfirmingSignOut(true))
            }
          />
        )
    }
  }

  if (confirmingSignOut)
    return (
      <ConfirmationPage
        heading="Abmelden?"
        explanation="Auf diesem Gerät musst du dich danach mit E-Mail und Passwort neu anmelden."
        confirmLabel="Abmelden"
        onConfirm={() => {
          playSound('confirm')
          onSignOut()
        }}
        onCancel={(sound) =>
          slideBack(() => setConfirmingSignOut(false), sound)
        }
      />
    )

  return areaPage()
}
