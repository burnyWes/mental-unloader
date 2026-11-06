import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { PageTurnSound } from '../sound/pageTurnSound'
import { createPageSlide, type PageSlide } from './pageSlide'

const PageSlideContext = createContext<PageSlide>(createPageSlide())

type PageSlideProviderProps = {
  animations: boolean
  sounds: boolean
  pageTurnSound: PageTurnSound
  children: ReactNode
}

export function PageSlideProvider({
  animations,
  sounds,
  pageTurnSound,
  children,
}: PageSlideProviderProps) {
  const pageSlide = useMemo(
    () =>
      createPageSlide({
        animations,
        onSlide: () => {
          if (sounds) pageTurnSound.play()
        },
      }),
    [animations, sounds, pageTurnSound],
  )

  return <PageSlideContext value={pageSlide}>{children}</PageSlideContext>
}

export function usePageSlide(): PageSlide {
  return useContext(PageSlideContext)
}
