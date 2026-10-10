import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { createLocalStorageAppearanceClient } from './shared/appearance/localStorageAppearanceClient.ts'
import { createServiceWorkerAppUpdateClient } from './shared/appUpdate/serviceWorkerAppUpdateClient.ts'
import { auth, firestore, storageWarning } from './shared/auth/firebase.ts'
import { createFirebaseAuthClient } from './shared/auth/firebaseAuthClient.ts'
import { createFirestoreFoldersClient } from './tasks/api/firestoreFoldersClient.ts'
import './index.css'

const appearanceClient = createLocalStorageAppearanceClient()

const appUpdateClient = createServiceWorkerAppUpdateClient()

const authClient = createFirebaseAuthClient(auth)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      appearanceClient={appearanceClient}
      appUpdateClient={appUpdateClient}
      authClient={authClient}
      createFoldersClient={(onFailure) =>
        createFirestoreFoldersClient(firestore, onFailure)
      }
      storageWarning={storageWarning}
    />
  </StrictMode>,
)
