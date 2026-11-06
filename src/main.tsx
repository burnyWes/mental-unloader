import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { createLocalStorageAppearanceClient } from './shared/appearance/localStorageAppearanceClient.ts'
import { createServiceWorkerAppUpdateClient } from './shared/appUpdate/serviceWorkerAppUpdateClient.ts'
import { auth, firestore, storageWarning } from './shared/auth/firebase.ts'
import { createFirebaseAuthClient } from './shared/auth/firebaseAuthClient.ts'
import { createWebAudioSoundEffects } from './shared/sound/webAudioSoundEffects.ts'
import { createFirestoreOrganizerClient } from './tasks/api/firestoreOrganizerClient.ts'
import './index.css'

const appearanceClient = createLocalStorageAppearanceClient()

const appUpdateClient = createServiceWorkerAppUpdateClient()

const authClient = createFirebaseAuthClient(auth)

const soundsPath = `${import.meta.env.BASE_URL}sounds`

const soundEffects = createWebAudioSoundEffects({
  pageTurn: `${soundsPath}/page-turn.wav`,
  confirm: `${soundsPath}/confirm.wav`,
  refuse: `${soundsPath}/refuse.wav`,
  activate: `${soundsPath}/activate.wav`,
  deactivate: `${soundsPath}/deactivate.wav`,
  arrow: `${soundsPath}/arrow.wav`,
})

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
      soundEffects={soundEffects}
    />
  </StrictMode>,
)
