import { useState } from 'react'
import type { AppearanceClient } from './shared/appearance/appearanceClient'
import { useAppearance } from './shared/appearance/useAppearance'
import { AppUpdateOffer } from './shared/appUpdate/AppUpdateOffer'
import type { AppUpdateClient } from './shared/appUpdate/appUpdateClient'
import { useAppUpdate } from './shared/appUpdate/useAppUpdate'
import { Announcer } from './shared/ui/Announcer'
import { ChecklistIcon } from './shared/ui/ChecklistIcon'
import { NavigationBar, type Area } from './shared/ui/NavigationBar'
import { SettingsIcon } from './shared/ui/SettingsIcon'
import { SettingsPage, type SettingsEntry } from './shared/ui/SettingsPage'
import { useAnnouncer } from './shared/ui/useAnnouncer'
import { FolderIcon } from './tasks/ui/FolderIcon'
import { FoldersPage } from './tasks/ui/FoldersPage'
import { UrgentPage } from './tasks/ui/UrgentPage'

const AREAS = [
  { id: 'urgent', label: 'Dringend', icon: <ChecklistIcon /> },
  { id: 'folders', label: 'Ordner', icon: <FolderIcon /> },
  { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon /> },
] as const satisfies readonly Area<string>[]

type AreaId = (typeof AREAS)[number]['id']

type AppProps = {
  appearanceClient: AppearanceClient
  appUpdateClient: AppUpdateClient
}

export function App({ appearanceClient, appUpdateClient }: AppProps) {
  const { spokenText, announce } = useAnnouncer()
  const installUpdate = useAppUpdate(appUpdateClient, announce)
  const appearance = useAppearance(appearanceClient)
  const [activeArea, setActiveArea] = useState<AreaId>('urgent')

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
          />
        )
    }
  }

  return (
    <>
      {areaPage()}
      {installUpdate !== null && (
        <AppUpdateOffer installUpdate={installUpdate} />
      )}
      <Announcer text={spokenText} />
    </>
  )
}
