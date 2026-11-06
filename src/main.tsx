import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { createLocalStorageAppearanceClient } from './shared/appearance/localStorageAppearanceClient.ts'
import { createServiceWorkerAppUpdateClient } from './shared/appUpdate/serviceWorkerAppUpdateClient.ts'
import { auth, firestore, storageWarning } from './shared/auth/firebase.ts'
import { createFirebaseAuthClient } from './shared/auth/firebaseAuthClient.ts'
import { createWebAudioPageTurnSound } from './shared/sound/webAudioPageTurnSound.ts'
import { createFirestoreOrganizerClient } from './tasks/api/firestoreOrganizerClient.ts'
import './index.css'

const appearanceClient = createLocalStorageAppearanceClient()

const appUpdateClient = createServiceWorkerAppUpdateClient()

const authClient = createFirebaseAuthClient(auth)

const pageTurnSound = createWebAudioPageTurnSound(
  `${import.meta.env.BASE_URL}sounds/page-turn.wav`,
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      appearanceClient={appearanceClient}
      appUpdateClient={appUpdateClient}
      authClient={authClient}
      createOrganizerClient={(onFailure) =>
        createFirestoreOrganizerClient(firestore, onFailure)
      }
      storageWarning={storageWarning}
      now={() => new Date()}
      pageTurnSound={pageTurnSound}
    />
  </StrictMode>,
)
