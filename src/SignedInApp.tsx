import { useState } from 'react'
import type { Appearance } from './shared/appearance/useAppearance'
import { ChecklistIcon } from './shared/ui/ChecklistIcon'
import { ConfirmationPage } from './shared/ui/ConfirmationPage'
import { NavigationBar, type Area } from './shared/ui/NavigationBar'
import { SettingsIcon } from './shared/ui/SettingsIcon'
import { SettingsPage, type SettingsEntry } from './shared/ui/SettingsPage'
import type { OrganizerClient } from './tasks/api/organizerClient'
import { FolderIcon } from './tasks/ui/FolderIcon'
import { FoldersArea } from './tasks/ui/FoldersArea'
import { UrgentPage } from './tasks/ui/UrgentPage'
import { useOrganizer } from './tasks/ui/useOrganizer'

const AREAS = [
  { id: 'urgent', label: 'Dringend', icon: <ChecklistIcon /> },
  { id: 'folders', label: 'Ordner', icon: <FolderIcon /> },
  { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon /> },
] as const satisfies readonly Area<string>[]

type AreaId = (typeof AREAS)[number]['id']

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
  const [activeArea, setActiveArea] = useState<AreaId>('urgent')
  const [areaVisit, setAreaVisit] = useState(0)
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const [organizerClient] = useState(() => createOrganizerClient(announce))
  const organizer = useOrganizer(organizerClient)

  const settingsEntries: readonly SettingsEntry[] = [
    {
      kind: 'toggle',
      id: 'darkMode',
      label: 'Dunkelmodus',
      enabled: appearance.darkMode,
      onToggle: appearance.toggleDarkMode,
    },
  ]

  function selectArea(area: AreaId) {
    setActiveArea(area)
    setAreaVisit((visit) => visit + 1)
  }

  const navigation = (
    <NavigationBar
      areas={AREAS}
      activeArea={activeArea}
      onSelectArea={selectArea}
    />
  )

  const areaKey = `${activeArea}-${areaVisit}`

  function areaPage() {
    switch (activeArea) {
      case 'urgent':
        return <UrgentPage key={areaKey} navigation={navigation} />
      case 'folders':
        return (
          <FoldersArea
            key={areaKey}
            organizer={organizer}
            navigation={navigation}
            announce={announce}
            now={now}
          />
        )
      case 'settings':
        return (
          <SettingsPage
            key={areaKey}
            navigation={navigation}
            entries={settingsEntries}
            onRequestSignOut={() => setConfirmingSignOut(true)}
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
        onConfirm={onSignOut}
        onCancel={() => setConfirmingSignOut(false)}
      />
    )

  return areaPage()
}
