import { useEffect } from 'react'
import { SignedInApp } from './SignedInApp'
import type { AppearanceClient } from './shared/appearance/appearanceClient'
import { useAppearance } from './shared/appearance/useAppearance'
import { AppUpdateOffer } from './shared/appUpdate/AppUpdateOffer'
import type { AppUpdateClient } from './shared/appUpdate/appUpdateClient'
import { useAppUpdate } from './shared/appUpdate/useAppUpdate'
import type { AuthClient } from './shared/auth/authClient'
import { SignInPage } from './shared/auth/SignInPage'
import { useSession } from './shared/auth/useSession'
import { Announcer } from './shared/ui/Announcer'
import { useAnnouncer } from './shared/ui/useAnnouncer'
import { useConnectionAnnouncements } from './shared/ui/useConnectionAnnouncements'
import type { OrganizerClient } from './tasks/api/organizerClient'

type AppProps = {
  appearanceClient: AppearanceClient
  appUpdateClient: AppUpdateClient
  authClient: AuthClient
  createOrganizerClient: (
    onFailure: (message: string) => void,
  ) => OrganizerClient
  storageWarning?: string
  now: () => Date
}

export function App({
  appearanceClient,
  appUpdateClient,
  authClient,
  createOrganizerClient,
  storageWarning = '',
  now,
}: AppProps) {
  const { spokenText, announce } = useAnnouncer()
  const session = useSession(authClient)
  const installUpdate = useAppUpdate(appUpdateClient, announce)
  const appearance = useAppearance(appearanceClient)

  useConnectionAnnouncements(announce)

  useEffect(() => {
    if (storageWarning !== '') announce(storageWarning)
  }, [storageWarning, announce])

  async function signOut() {
    try {
      await authClient.signOut()
      announce('Abgemeldet.')
    } catch {
      announce('Abmelden fehlgeschlagen.')
    }
  }

  return (
    <>
      {session.status === 'loading' && <p className="page">Wird geladen.</p>}
      {session.status === 'signedOut' && (
        <SignInPage authClient={authClient} announce={announce} />
      )}
      {session.status === 'signedIn' && (
        <SignedInApp
          createOrganizerClient={createOrganizerClient}
          appearance={appearance}
          announce={announce}
          now={now}
          onSignOut={signOut}
        />
      )}
      {installUpdate !== null && (
        <AppUpdateOffer installUpdate={installUpdate} />
      )}
      <Announcer text={spokenText} />
    </>
  )
}
