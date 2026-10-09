import type { AppearanceClient, DeviceStorage } from './appearanceClient'

export const DARK_MODE_KEY = 'darkMode'

function deviceStorage(): DeviceStorage | null {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function storedValue(storage: DeviceStorage | null): string | null {
  try {
    return storage?.getItem(DARK_MODE_KEY) ?? null
  } catch {
    return null
  }
}

function store(storage: DeviceStorage | null, darkMode: boolean): void {
  try {
    storage?.setItem(DARK_MODE_KEY, String(darkMode))
  } catch {
    return
  }
}

export function createLocalStorageAppearanceClient(
  storage: DeviceStorage | null = deviceStorage(),
): AppearanceClient {
  return {
    readDarkMode: () => storedValue(storage) !== 'false',
    writeDarkMode: (darkMode) => store(storage, darkMode),
  }
}
