import type { ReactNode } from 'react'
import { useHeadingFocus } from './useHeadingFocus'

export type SettingsEntry = {
  kind: 'toggle'
  id: string
  label: string
  enabled: boolean
  onToggle: () => void
}

type SettingsPageProps = {
  navigation: ReactNode
  entries: readonly SettingsEntry[]
  onRequestSignOut: () => void
}

export function SettingsPage({
  navigation,
  entries,
  onRequestSignOut,
}: SettingsPageProps) {
  const heading = useHeadingFocus()

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            Einstellungen
          </h1>
        </div>
        {entries.length > 0 && (
          <ul className="itemList">
            {entries.map((entry) => (
              <li key={entry.id}>
                <label className="settingsToggle">
                  <span>{entry.label}</span>
                  <input
                    type="checkbox"
                    role="switch"
                    className="checkboxLook"
                    checked={entry.enabled}
                    onChange={entry.onToggle}
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="signOutButton"
          onClick={onRequestSignOut}
        >
          Abmelden
        </button>
      </main>
    </>
  )
}
