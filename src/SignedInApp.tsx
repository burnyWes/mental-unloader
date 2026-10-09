import { useState } from 'react'
import type { Appearance } from './shared/appearance/useAppearance'
import { ChecklistIcon } from './shared/ui/ChecklistIcon'
import { ConfirmationPage } from './shared/ui/ConfirmationPage'
import { NavigationBar, type Area } from './shared/ui/NavigationBar'
import { SettingsIcon } from './shared/ui/SettingsIcon'
import { SettingsPage, type SettingsEntry } from './shared/ui/SettingsPage'
import { FolderIcon } from './tasks/ui/FolderIcon'
import { FoldersPage } from './tasks/ui/FoldersPage'
import { UrgentPage } from './tasks/ui/UrgentPage'

const AREAS = [
  { id: 'urgent', label: 'Dringend', icon: <ChecklistIcon /> },
  { id: 'folders', label: 'Ordner', icon: <FolderIcon /> },
  { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon /> },
] as const satisfies readonly Area<string>[]

type AreaId = (typeof AREAS)[number]['id']

type SignedInAppProps = {
  appearance: Appearance
  onSignOut: () => void
}

export function SignedInApp({ appearance, onSignOut }: SignedInAppProps) {
  const [activeArea, setActiveArea] = useState<AreaId>('urgent')
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)

  const settingsEntries: readonly SettingsEntry[] = [
    {
      kind: 'toggle',
      id: 'darkMode',
      label: 'Dunkelmodus',
      enabled: appearance.darkMode,
      onToggle: appearance.toggleDarkMode,
    },
  ]

  const navigation = (
    <NavigationBar
      areas={AREAS}
      activeArea={activeArea}
      onSelectArea={setActiveArea}
    />
  )

  function areaPage() {
    switch (activeArea) {
      case 'urgent':
        return <UrgentPage key={activeArea} navigation={navigation} />
      case 'folders':
        return <FoldersPage key={activeArea} navigation={navigation} />
      case 'settings':
        return (
          <SettingsPage
            key={activeArea}
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
