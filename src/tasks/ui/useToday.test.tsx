import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { millisecondsUntilNextMidnight, useToday } from './useToday'

const ONE_DAY = 24 * 60 * 60 * 1000

let moment: Date

function renderToday() {
  return renderHook(() => useToday(clock))
}

function clock() {
  return moment
}

function setVisibility(visibilityState: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: visibilityState,
  })
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

describe('useToday', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    moment = new Date(2026, 9, 10, 23, 59)
  })

  afterEach(() => {
    vi.useRealTimers()
    Reflect.deleteProperty(document, 'visibilityState')
  })

  it('starts on the calendar day of the clock', () => {
    const { result } = renderToday()

    expect(result.current).toBe('2026-10-10')
  })

  it('turns to the next day at midnight and again at the following one', () => {
    const { result } = renderToday()

    moment = new Date(2026, 9, 11, 0, 0)
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(result.current).toBe('2026-10-11')

    moment = new Date(2026, 9, 12, 0, 0)
    act(() => {
      vi.advanceTimersByTime(ONE_DAY)
    })
    expect(result.current).toBe('2026-10-12')
  })

  it('catches up with the clock once the app becomes visible again', () => {
    const { result } = renderToday()

    moment = new Date(2026, 9, 11, 7, 30)
    setVisibility('visible')

    expect(result.current).toBe('2026-10-11')
  })

  it('catches up with the clock once the page is shown again', () => {
    const { result } = renderToday()

    moment = new Date(2026, 9, 11, 7, 30)
    act(() => {
      window.dispatchEvent(new Event('pageshow'))
    })

    expect(result.current).toBe('2026-10-11')
  })

  it('stays on the day while the app is hidden', () => {
    const { result } = renderToday()

    moment = new Date(2026, 9, 11, 7, 30)
    setVisibility('hidden')

    expect(result.current).toBe('2026-10-10')
  })

  it('leaves no timer behind once unmounted', () => {
    const { unmount } = renderToday()

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('millisecondsUntilNextMidnight', () => {
  it('counts the time left until the next local midnight', () => {
    expect(millisecondsUntilNextMidnight(new Date(2026, 9, 10, 23, 59))).toBe(
      60_000,
    )
  })
})
