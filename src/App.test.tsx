import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { createInMemoryAppearanceClient } from './shared/appearance/inMemoryAppearanceClient'
import { accessibilityViolations } from './testSupport/accessibility'

function renderApp(appearanceClient = createInMemoryAppearanceClient()) {
  return render(<App appearanceClient={appearanceClient} />)
}

const areaButtons = ['Dringend', 'Ordner', 'Einstellungen']

function darkModeOnTheDocument() {
  return document.documentElement.dataset.darkMode
}

async function openSettings() {
  await userEvent.click(screen.getByRole('button', { name: 'Einstellungen' }))
}

const darkModeSwitch = { name: 'Dunkelmodus' }

describe('App', () => {
  it('starts on the urgent tasks with their heading focused', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Dringend' })).toHaveFocus()
    expect(screen.getByText('Nichts Dringendes.')).toBeInTheDocument()
  })

  it('offers every area in the navigation', () => {
    renderApp()

    const navigation = screen.getByRole('navigation', { name: 'Bereiche' })
    for (const name of areaButtons)
      expect(navigation).toContainElement(screen.getByRole('button', { name }))
  })

  it('marks the area being shown as the current page', async () => {
    renderApp()

    expect(screen.getByRole('button', { name: 'Dringend' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Ordner' }))

    expect(screen.getByRole('button', { name: 'Ordner' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      screen.getByRole('button', { name: 'Dringend' }),
    ).not.toHaveAttribute('aria-current')
  })

  it('focuses the heading of the folders once they are chosen', async () => {
    renderApp()

    await userEvent.click(screen.getByRole('button', { name: 'Ordner' }))

    expect(screen.getByRole('heading', { name: 'Ordner' })).toHaveFocus()
    expect(screen.getByText('Noch keine Ordner.')).toBeInTheDocument()
  })

  it('focuses the heading of the settings once they are chosen', async () => {
    renderApp()

    await userEvent.click(screen.getByRole('button', { name: 'Einstellungen' }))

    expect(screen.getByRole('heading', { name: 'Einstellungen' })).toHaveFocus()
  })

  it('keeps the live region in the document from the first render', () => {
    renderApp()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it.each(areaButtons)(
    'shows the area %s without accessibility violations',
    async (name) => {
      const { container } = renderApp()

      await userEvent.click(screen.getByRole('button', { name }))

      expect(await accessibilityViolations(container)).toEqual([])
    },
  )

  it('starts dark on a device without a stored wish', () => {
    renderApp()

    expect(darkModeOnTheDocument()).toBe('true')
  })

  it('starts light on a device that turned dark mode off', () => {
    renderApp(createInMemoryAppearanceClient(false))

    expect(darkModeOnTheDocument()).toBe('false')
  })

  it('offers dark mode as a switch that is turned on at first', async () => {
    renderApp()
    await openSettings()

    expect(screen.getByRole('switch', darkModeSwitch)).toBeChecked()
  })

  it('turns dark mode off and remembers it on this device', async () => {
    const appearanceClient = createInMemoryAppearanceClient()
    renderApp(appearanceClient)
    await openSettings()

    await userEvent.click(screen.getByRole('switch', darkModeSwitch))

    expect(screen.getByRole('switch', darkModeSwitch)).not.toBeChecked()
    expect(appearanceClient.storedDarkMode()).toBe(false)
    expect(darkModeOnTheDocument()).toBe('false')
  })

  it('shows the dark mode switch without accessibility violations', async () => {
    const { container } = renderApp()
    await openSettings()

    expect(screen.getByRole('switch', darkModeSwitch)).toBeInTheDocument()
    expect(await accessibilityViolations(container)).toEqual([])
  })
})
