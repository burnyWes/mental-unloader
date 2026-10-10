import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { NavigationBar, type AreaBadge } from './NavigationBar'

function renderNavigation(badge?: AreaBadge) {
  return render(
    <NavigationBar
      areas={[
        { id: 'urgent', label: 'Dringend', icon: <svg />, badge },
        { id: 'folders', label: 'Ordner', icon: <svg /> },
      ]}
      activeArea="urgent"
      onSelectArea={() => {}}
    />,
  )
}

function shownBadge() {
  return document.querySelector('.navigationBadge')
}

describe('NavigationBar', () => {
  it.each([
    ['without a badge', undefined],
    ['with nothing to count', { count: 0, label: 'Dringend, 0 Aufgaben' }],
  ])('names the area plainly and shows no badge %s', (_case, badge) => {
    renderNavigation(badge)

    expect(screen.getByRole('button', { name: 'Dringend' })).toBeInTheDocument()
    expect(shownBadge()).toBeNull()
  })

  it('names the area with the badge label and shows the count hidden from assistive technology', () => {
    renderNavigation({ count: 3, label: 'Dringend, 3 Aufgaben' })

    const area = screen.getByRole('button', { name: 'Dringend, 3 Aufgaben' })
    expect(area).toContainElement(shownBadge() as HTMLElement)
    expect(shownBadge()).toHaveTextContent('3')
    expect(shownBadge()).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows 99+ for a count above 99 but keeps the label', () => {
    renderNavigation({ count: 100, label: 'Dringend, 100 Aufgaben' })

    expect(shownBadge()).toHaveTextContent('99+')
    expect(
      screen.getByRole('button', { name: 'Dringend, 100 Aufgaben' }),
    ).toBeInTheDocument()
  })

  it('keeps marking the current area', () => {
    renderNavigation({ count: 3, label: 'Dringend, 3 Aufgaben' })

    expect(
      screen.getByRole('button', { name: 'Dringend, 3 Aufgaben' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Ordner' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('shows a badge without accessibility violations', async () => {
    const { container } = renderNavigation({
      count: 3,
      label: 'Dringend, 3 Aufgaben',
    })

    expect(await accessibilityViolations(container)).toEqual([])
  })
})
