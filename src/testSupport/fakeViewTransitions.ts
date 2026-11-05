import { act } from '@testing-library/react'
import { vi } from 'vitest'

export type FakeViewTransitions = {
  directions: () => readonly string[]
  finishPendingUpdates: () => void
  uninstall: () => void
}

type FakeViewTransitionsOptions = {
  reducedMotion?: boolean
}

function fakeMediaQueryList(matches: boolean): MediaQueryList {
  return { matches } as MediaQueryList
}

export function installFakeViewTransitions({
  reducedMotion = false,
}: FakeViewTransitionsOptions = {}): FakeViewTransitions {
  const directions: string[] = []
  let pendingUpdates: (() => void)[] = []

  function startViewTransition(
    options: StartViewTransitionOptions,
  ): ViewTransition {
    directions.push(options.types?.[0] ?? '')
    if (options.update) {
      const update = options.update
      pendingUpdates.push(() => void update())
    }
    return {} as ViewTransition
  }

  vi.stubGlobal('ViewTransition', { prototype: { types: new Set() } })
  Object.defineProperty(document, 'startViewTransition', {
    configurable: true,
    value: startViewTransition,
  })
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => fakeMediaQueryList(reducedMotion),
  })

  function finishPendingUpdates() {
    const updates = pendingUpdates
    pendingUpdates = []
    act(() => updates.forEach((update) => update()))
  }

  function uninstall() {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(document, 'startViewTransition')
    Reflect.deleteProperty(window, 'matchMedia')
  }

  return {
    directions: () => [...directions],
    finishPendingUpdates,
    uninstall,
  }
}
