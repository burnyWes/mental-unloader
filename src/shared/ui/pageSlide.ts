import { flushSync } from 'react-dom'
import type { ActionSound, SoundEffect } from '../sound/soundEffects'

export type SlideDirection = 'forward' | 'back'

type SlideTransitionType = SlideDirection | 'itemsForward' | 'itemsBack'

type SlideAction = () => void

export type PageSlideSettings = {
  animations: boolean
  play: (effect: SoundEffect) => void
  playEvenWhenMuted: (effect: SoundEffect) => void
}

export type PageSlide = {
  slidePage: (direction: SlideDirection, action: SlideAction) => void
  slideForward: (action: SlideAction) => void
  slideBack: (action: SlideAction, sound?: SoundEffect) => void
  slideItems: (direction: SlideDirection, action: SlideAction) => void
  playSound: (sound: ActionSound) => void
  playSoundEvenWhenMuted: (sound: ActionSound) => void
}

const ITEMS_TRANSITION_TYPES: Record<SlideDirection, SlideTransitionType> = {
  forward: 'itemsForward',
  back: 'itemsBack',
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const ANIMATED_WITHOUT_SOUND: PageSlideSettings = {
  animations: true,
  play: () => {},
  playEvenWhenMuted: () => {},
}

function supportsTypedViewTransitions(): boolean {
  return (
    typeof ViewTransition !== 'undefined' && 'types' in ViewTransition.prototype
  )
}

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export function directionBetween(
  fromPosition: number,
  toPosition: number,
): SlideDirection | null {
  if (toPosition === fromPosition) return null
  return toPosition > fromPosition ? 'forward' : 'back'
}

export function createPageSlide(
  settings: PageSlideSettings = ANIMATED_WITHOUT_SOUND,
): PageSlide {
  function animates(): boolean {
    return (
      settings.animations &&
      supportsTypedViewTransitions() &&
      !prefersReducedMotion()
    )
  }

  function slide(
    type: SlideTransitionType,
    action: SlideAction,
    sound: SoundEffect = 'pageTurn',
  ) {
    const playsPageTurn = sound === 'pageTurn'
    if (!playsPageTurn) settings.play(sound)
    if (!animates()) {
      action()
      return
    }
    if (playsPageTurn) settings.play(sound)
    document.startViewTransition({
      update: () => flushSync(action),
      types: [type],
    })
  }

  function slidePage(direction: SlideDirection, action: SlideAction) {
    slide(direction, action)
  }

  return {
    slidePage,
    slideForward: (action) => slidePage('forward', action),
    slideBack: (action, sound) => slide('back', action, sound),
    slideItems: (direction, action) =>
      slide(ITEMS_TRANSITION_TYPES[direction], action),
    playSound: (sound) => settings.play(sound),
    playSoundEvenWhenMuted: (sound) => settings.playEvenWhenMuted(sound),
  }
}
