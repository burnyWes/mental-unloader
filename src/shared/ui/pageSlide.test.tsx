import { afterEach, describe, expect, it } from 'vitest'
import {
  installFakeViewTransitions,
  type FakeViewTransitions,
} from '../../testSupport/fakeViewTransitions'
import {
  directionBetween,
  slideBack,
  slideForward,
  slideItems,
} from './pageSlide'

describe('page slide', () => {
  let viewTransitions: FakeViewTransitions | null = null

  afterEach(() => {
    viewTransitions?.uninstall()
    viewTransitions = null
  })

  it('runs the action at once when view transitions are unsupported', () => {
    let runs = 0

    slideForward(() => runs++)

    expect(runs).toBe(1)
  })

  it('runs the action at once when reduced motion is preferred', () => {
    viewTransitions = installFakeViewTransitions({ reducedMotion: true })
    let runs = 0

    slideForward(() => runs++)

    expect(runs).toBe(1)
    expect(viewTransitions.directions()).toEqual([])
  })

  it('slides forward by running the action inside the transition update', () => {
    viewTransitions = installFakeViewTransitions()
    let runs = 0

    slideForward(() => runs++)

    expect(runs).toBe(0)
    viewTransitions.finishPendingUpdates()
    expect(runs).toBe(1)
    expect(viewTransitions.directions()).toEqual(['forward'])
  })

  it('slides back with the back transition type', () => {
    viewTransitions = installFakeViewTransitions()
    let runs = 0

    slideBack(() => runs++)
    viewTransitions.finishPendingUpdates()

    expect(runs).toBe(1)
    expect(viewTransitions.directions()).toEqual(['back'])
  })

  it('tells the direction between two positions', () => {
    expect(directionBetween(0, 2)).toBe('forward')
    expect(directionBetween(2, 1)).toBe('back')
    expect(directionBetween(1, 1)).toBeNull()
  })

  it('slides the items with their own transition type', () => {
    viewTransitions = installFakeViewTransitions()
    let runs = 0

    slideItems('forward', () => runs++)
    slideItems('back', () => runs++)
    viewTransitions.finishPendingUpdates()

    expect(runs).toBe(2)
    expect(viewTransitions.directions()).toEqual(['itemsForward', 'itemsBack'])
  })
})
