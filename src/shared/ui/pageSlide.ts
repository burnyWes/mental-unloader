import { flushSync } from 'react-dom'

export type SlideDirection = 'forward' | 'back'

type SlideTransitionType = SlideDirection | 'itemsForward' | 'itemsBack'

const ITEMS_TRANSITION_TYPES: Record<SlideDirection, SlideTransitionType> = {
  forward: 'itemsForward',
  back: 'itemsBack',
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function supportsTypedViewTransitions(): boolean {
  return (
    typeof ViewTransition !== 'undefined' && 'types' in ViewTransition.prototype
  )
}

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function slide(type: SlideTransitionType, action: () => void) {
  if (!supportsTypedViewTransitions() || prefersReducedMotion()) {
    action()
    return
  }
  document.startViewTransition({
    update: () => flushSync(action),
    types: [type],
  })
}

export function directionBetween(
  fromPosition: number,
  toPosition: number,
): SlideDirection | null {
  if (toPosition === fromPosition) return null
  return toPosition > fromPosition ? 'forward' : 'back'
}

export function slidePage(direction: SlideDirection, action: () => void) {
  slide(direction, action)
}

export function slideForward(action: () => void) {
  slidePage('forward', action)
}

export function slideBack(action: () => void) {
  slidePage('back', action)
}

export function slideItems(direction: SlideDirection, action: () => void) {
  slide(ITEMS_TRANSITION_TYPES[direction], action)
}
