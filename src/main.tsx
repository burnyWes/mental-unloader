import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { createLocalStorageAppearanceClient } from './shared/appearance/localStorageAppearanceClient.ts'
import { createServiceWorkerAppUpdateClient } from './shared/appUpdate/serviceWorkerAppUpdateClient.ts'
import { auth } from './shared/auth/firebase.ts'
import { createFirebaseAuthClient } from './shared/auth/firebaseAuthClient.ts'
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
    />
  </StrictMode>,
)
