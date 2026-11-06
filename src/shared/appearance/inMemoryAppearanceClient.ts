import type { AppearanceClient } from './appearanceClient'

export type StoringAppearanceClient = AppearanceClient & {
  storedDarkMode(): boolean
  storedAnimations(): boolean
  storedSounds(): boolean
}

type StoredAppearance = {
  darkMode?: boolean
  animations?: boolean
  sounds?: boolean
}

export function createInMemoryAppearanceClient({
  darkMode = true,
  animations = true,
  sounds = true,
}: StoredAppearance = {}): StoringAppearanceClient {
  let storedDarkMode = darkMode
  let storedAnimations = animations
  let storedSounds = sounds

  return {
    readDarkMode: () => storedDarkMode,
    writeDarkMode: (wanted) => {
      storedDarkMode = wanted
    },
    readAnimations: () => storedAnimations,
    writeAnimations: (wanted) => {
      storedAnimations = wanted
    },
    readSounds: () => storedSounds,
    writeSounds: (wanted) => {
      storedSounds = wanted
    },
    storedDarkMode: () => storedDarkMode,
    storedAnimations: () => storedAnimations,
    storedSounds: () => storedSounds,
  }
}
