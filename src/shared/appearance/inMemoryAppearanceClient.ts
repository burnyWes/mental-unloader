import type { AppearanceClient } from './appearanceClient'

export type StoringAppearanceClient = AppearanceClient & {
  storedDarkMode(): boolean
}

export function createInMemoryAppearanceClient(
  darkMode = true,
): StoringAppearanceClient {
  let storedDarkMode = darkMode

  return {
    readDarkMode: () => storedDarkMode,
    writeDarkMode: (wanted) => {
      storedDarkMode = wanted
    },
    storedDarkMode: () => storedDarkMode,
  }
}
