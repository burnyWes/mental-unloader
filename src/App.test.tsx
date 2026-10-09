import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { accessibilityViolations } from './testSupport/accessibility'

function renderApp() {
  return render(<App />)
}

const areaButtons = ['Dringend', 'Ordner', 'Einstellungen']

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
})
