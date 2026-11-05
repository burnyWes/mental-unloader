import { afterEach, describe, expect, it } from 'vitest'
import {
  installFakeViewTransitions,
  type FakeViewTransitions,
} from '../../testSupport/fakeViewTransitions'
import { slideBack, slideForward } from './pageSlide'

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
})
