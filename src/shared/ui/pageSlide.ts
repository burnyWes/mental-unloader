import { flushSync } from 'react-dom'

export type SlideDirection = 'forward' | 'back'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function supportsTypedViewTransitions(): boolean {
  return (
    typeof ViewTransition !== 'undefined' && 'types' in ViewTransition.prototype
  )
}

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export function slidePage(direction: SlideDirection, action: () => void) {
  if (!supportsTypedViewTransitions() || prefersReducedMotion()) {
    action()
    return
  }
  document.startViewTransition({
    update: () => flushSync(action),
    types: [direction],
  })
}

export function slideForward(action: () => void) {
  slidePage('forward', action)
}

export function slideBack(action: () => void) {
  slidePage('back', action)
}
