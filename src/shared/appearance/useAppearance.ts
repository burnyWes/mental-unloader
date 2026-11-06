import { useEffect, useState } from 'react'
import type { AppearanceClient } from './appearanceClient'

export type Appearance = {
  darkMode: boolean
  toggleDarkMode: () => void
  animations: boolean
  toggleAnimations: () => void
  sounds: boolean
  toggleSounds: () => void
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
  const [animations, setAnimations] = useState(() =>
    appearanceClient.readAnimations(),
  )
  const [sounds, setSounds] = useState(() => appearanceClient.readSounds())

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
    animations,
    toggleAnimations() {
      const wanted = !animations
      appearanceClient.writeAnimations(wanted)
      setAnimations(wanted)
    },
    sounds,
    toggleSounds() {
      const wanted = !sounds
      appearanceClient.writeSounds(wanted)
      setSounds(wanted)
    },
  }
}
