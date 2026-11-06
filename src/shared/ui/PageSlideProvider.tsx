import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { SoundEffects } from '../sound/soundEffects'
import { createPageSlide, type PageSlide } from './pageSlide'

const PageSlideContext = createContext<PageSlide>(createPageSlide())

type PageSlideProviderProps = {
  animations: boolean
  sounds: boolean
  soundEffects: SoundEffects
  children: ReactNode
}

export function PageSlideProvider({
  animations,
  sounds,
  soundEffects,
  children,
}: PageSlideProviderProps) {
  const pageSlide = useMemo(
    () =>
      createPageSlide({
        animations,
        play: (effect) => {
          if (sounds) soundEffects.play(effect)
        },
      }),
    [animations, sounds, soundEffects],
  )

  return <PageSlideContext value={pageSlide}>{children}</PageSlideContext>
}

export function usePageSlide(): PageSlide {
  return useContext(PageSlideContext)
}
