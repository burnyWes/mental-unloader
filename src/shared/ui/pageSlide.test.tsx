import { afterEach, describe, expect, it } from 'vitest'
import {
  installFakeViewTransitions,
  type FakeViewTransitions,
} from '../../testSupport/fakeViewTransitions'
import { createInMemorySoundEffects } from '../sound/inMemorySoundEffects'
import { createPageSlide, directionBetween } from './pageSlide'

function hearingPageSlide(animations = true) {
  const soundEffects = createInMemorySoundEffects()
  const pageSlide = createPageSlide({ animations, play: soundEffects.play })
  return { pageSlide, played: soundEffects.played }
}

describe('page slide', () => {
  let viewTransitions: FakeViewTransitions | null = null

  afterEach(() => {
    viewTransitions?.uninstall()
    viewTransitions = null
  })

  it('runs the action at once when view transitions are unsupported', () => {
    let runs = 0

    createPageSlide().slideForward(() => runs++)

    expect(runs).toBe(1)
  })

  it('runs the action at once when reduced motion is preferred', () => {
    viewTransitions = installFakeViewTransitions({ reducedMotion: true })
    let runs = 0

    createPageSlide().slideForward(() => runs++)

    expect(runs).toBe(1)
    expect(viewTransitions.directions()).toEqual([])
  })

  it('runs the action at once when animations are turned off', () => {
    viewTransitions = installFakeViewTransitions()
    const { pageSlide, played } = hearingPageSlide(false)
    let runs = 0

    pageSlide.slideForward(() => runs++)

    expect(runs).toBe(1)
    expect(viewTransitions.directions()).toEqual([])
    expect(played()).toEqual([])
  })

  it('slides forward by running the action inside the transition update', () => {
    viewTransitions = installFakeViewTransitions()
    let runs = 0

    createPageSlide().slideForward(() => runs++)

    expect(runs).toBe(0)
    viewTransitions.finishPendingUpdates()
    expect(runs).toBe(1)
    expect(viewTransitions.directions()).toEqual(['forward'])
  })

  it('slides back with the back transition type', () => {
    viewTransitions = installFakeViewTransitions()
    let runs = 0

    createPageSlide().slideBack(() => runs++)
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
    const pageSlide = createPageSlide()
    let runs = 0

    pageSlide.slideItems('forward', () => runs++)
    pageSlide.slideItems('back', () => runs++)
    viewTransitions.finishPendingUpdates()

    expect(runs).toBe(2)
    expect(viewTransitions.directions()).toEqual(['itemsForward', 'itemsBack'])
  })

  it('plays the page turn for each slide that animates', () => {
    viewTransitions = installFakeViewTransitions()
    const { pageSlide, played } = hearingPageSlide()

    pageSlide.slideForward(() => {})
    pageSlide.slidePage('back', () => {})
    pageSlide.slideItems('forward', () => {})

    expect(played()).toEqual(['pageTurn', 'pageTurn', 'pageTurn'])
  })

  it('does not play the page turn when reduced motion is preferred', () => {
    viewTransitions = installFakeViewTransitions({ reducedMotion: true })
    const { pageSlide, played } = hearingPageSlide()

    pageSlide.slideBack(() => {})

    expect(played()).toEqual([])
  })

  it('plays the given sound instead of the page turn when sliding back', () => {
    viewTransitions = installFakeViewTransitions()
    const { pageSlide, played } = hearingPageSlide()
    let runs = 0

    pageSlide.slideBack(() => runs++, 'confirm')
    viewTransitions.finishPendingUpdates()

    expect(runs).toBe(1)
    expect(played()).toEqual(['confirm'])
    expect(viewTransitions.directions()).toEqual(['back'])
  })

  it('plays the given sound even when animations are turned off', () => {
    viewTransitions = installFakeViewTransitions()
    const { pageSlide, played } = hearingPageSlide(false)
    let runs = 0

    pageSlide.slideBack(() => runs++, 'refuse')

    expect(runs).toBe(1)
    expect(played()).toEqual(['refuse'])
    expect(viewTransitions.directions()).toEqual([])
  })

  it('plays the given sound even when reduced motion is preferred', () => {
    viewTransitions = installFakeViewTransitions({ reducedMotion: true })
    const { pageSlide, played } = hearingPageSlide()

    pageSlide.slideBack(() => {}, 'confirm')

    expect(played()).toEqual(['confirm'])
  })

  it('plays an action sound without sliding', () => {
    viewTransitions = installFakeViewTransitions()
    const { pageSlide, played } = hearingPageSlide()

    pageSlide.playSound('confirm')

    expect(played()).toEqual(['confirm'])
    expect(viewTransitions.directions()).toEqual([])
  })
})
