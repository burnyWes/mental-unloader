import type { AppearanceClient, DeviceStorage } from './appearanceClient'

export const DARK_MODE_KEY = 'darkMode'

export const ANIMATIONS_KEY = 'animations'

export const SOUNDS_KEY = 'sounds'

function deviceStorage(): DeviceStorage | null {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function storedValue(
  storage: DeviceStorage | null,
  key: string,
): string | null {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function isTurnedOn(storage: DeviceStorage | null, key: string): boolean {
  return storedValue(storage, key) !== 'false'
}

function store(storage: DeviceStorage | null, key: string, turnedOn: boolean) {
  try {
    storage?.setItem(key, String(turnedOn))
  } catch {
    return
  }
}

export function createLocalStorageAppearanceClient(
  storage: DeviceStorage | null = deviceStorage(),
): AppearanceClient {
  return {
    readDarkMode: () => isTurnedOn(storage, DARK_MODE_KEY),
    writeDarkMode: (darkMode) => store(storage, DARK_MODE_KEY, darkMode),
    readAnimations: () => isTurnedOn(storage, ANIMATIONS_KEY),
    writeAnimations: (animations) => store(storage, ANIMATIONS_KEY, animations),
    readSounds: () => isTurnedOn(storage, SOUNDS_KEY),
    writeSounds: (sounds) => store(storage, SOUNDS_KEY, sounds),
  }
}
