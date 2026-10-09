import { useEffect, useState } from 'react'
import type { AppearanceClient } from './appearanceClient'

export type Appearance = {
  darkMode: boolean
  toggleDarkMode: () => void
}

function applySurfaceToTheSystemBar() {
  const systemBar = document.querySelector('meta[name="theme-color"]')
  const surface = getComputedStyle(document.documentElement)
    .getPropertyValue('--surface')
    .trim()
  if (systemBar && surface) systemBar.setAttribute('content', surface)
}

export function useAppearance(appearanceClient: AppearanceClient): Appearance {
  const [darkMode, setDarkMode] = useState(() =>
    appearanceClient.readDarkMode(),
  )

  useEffect(() => {
    document.documentElement.dataset.darkMode = String(darkMode)
    applySurfaceToTheSystemBar()
  }, [darkMode])

  return {
    darkMode,
    toggleDarkMode() {
      const wanted = !darkMode
      appearanceClient.writeDarkMode(wanted)
      setDarkMode(wanted)
    },
  }
}
