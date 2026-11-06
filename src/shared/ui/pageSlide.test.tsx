import { afterEach, describe, expect, it } from 'vitest'
import {
  installFakeViewTransitions,
  type FakeViewTransitions,
} from '../../testSupport/fakeViewTransitions'
import { createPageSlide, directionBetween } from './pageSlide'

function countingSlides() {
  let reportedSlides = 0
  return {
    onSlide: () => {
      reportedSlides++
    },
    reportedSlides: () => reportedSlides,
  }
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
    const slides = countingSlides()
    let runs = 0

    createPageSlide({
      animations: false,
      onSlide: slides.onSlide,
    }).slideForward(() => runs++)

    expect(runs).toBe(1)
    expect(viewTransitions.directions()).toEqual([])
    expect(slides.reportedSlides()).toBe(0)
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

  it('reports each slide that animates', () => {
    viewTransitions = installFakeViewTransitions()
    const slides = countingSlides()
    const pageSlide = createPageSlide({
      animations: true,
      onSlide: slides.onSlide,
    })

    pageSlide.slideForward(() => {})
    pageSlide.slidePage('back', () => {})
    pageSlide.slideItems('forward', () => {})

    expect(slides.reportedSlides()).toBe(3)
  })

  it('does not report a slide when reduced motion is preferred', () => {
    viewTransitions = installFakeViewTransitions({ reducedMotion: true })
    const slides = countingSlides()

    createPageSlide({ animations: true, onSlide: slides.onSlide }).slideBack(
      () => {},
    )

    expect(slides.reportedSlides()).toBe(0)
  })
})
