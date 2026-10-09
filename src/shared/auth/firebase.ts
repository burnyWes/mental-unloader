import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { firebaseConfig } from './firebaseConfig'

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
}
