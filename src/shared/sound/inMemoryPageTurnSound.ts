import type { PageTurnSound } from './pageTurnSound'

export type CountingPageTurnSound = PageTurnSound & {
  plays(): number
}

export function createInMemoryPageTurnSound(): CountingPageTurnSound {
  let plays = 0

  return {
    play: () => {
      plays++
    },
    plays: () => plays,
  }
}
