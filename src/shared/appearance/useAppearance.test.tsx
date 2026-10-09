import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInMemoryAppearanceClient } from './inMemoryAppearanceClient'
import { useAppearance } from './useAppearance'

const DARK_SURFACE = '#000000'
const LIGHT_SURFACE = '#ffffff'

function systemBar() {
  return document.querySelector('meta[name="theme-color"]')
}

function givenASystemBar(content = 'untouched') {
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'theme-color')
  meta.setAttribute('content', content)
  document.head.append(meta)
}

function givenThePalette() {
  const palette = document.createElement('style')
  palette.textContent = `
    :root { --surface: ${DARK_SURFACE}; }
    :root[data-dark-mode='false'] { --surface: ${LIGHT_SURFACE}; }
  `
  document.head.append(palette)
}

function renderAppearance(darkMode = true) {
  const { result } = renderHook(() =>
    useAppearance(createInMemoryAppearanceClient(darkMode)),
  )
  return result
}

describe('useAppearance', () => {
  beforeEach(() => {
    document.head.replaceChildren()
    delete document.documentElement.dataset.darkMode
  })

  it('paints the system bar in the surface of the palette', () => {
    givenASystemBar()
    givenThePalette()

    renderAppearance()

    expect(systemBar()?.getAttribute('content')).toBe(DARK_SURFACE)
  })

  it('turns the system bar over with the colours', () => {
    givenASystemBar()
    givenThePalette()
    const appearance = renderAppearance()

    act(() => appearance.current.toggleDarkMode())

    expect(document.documentElement.dataset.darkMode).toBe('false')
    expect(systemBar()?.getAttribute('content')).toBe(LIGHT_SURFACE)
  })

  it('leaves the system bar alone when the palette says nothing', () => {
    givenASystemBar()

    renderAppearance()

    expect(systemBar()?.getAttribute('content')).toBe('untouched')
  })
})
