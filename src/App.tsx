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
import type { FoldersClient } from './tasks/api/foldersClient'

type AppProps = {
  appearanceClient: AppearanceClient
  appUpdateClient: AppUpdateClient
  authClient: AuthClient
  createFoldersClient: (onFailure: (message: string) => void) => FoldersClient
  storageWarning?: string
}

export function App({
  appearanceClient,
  appUpdateClient,
  authClient,
  createFoldersClient,
  storageWarning = '',
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
          createFoldersClient={createFoldersClient}
          appearance={appearance}
          announce={announce}
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
