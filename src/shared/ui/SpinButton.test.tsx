import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SpinButton, type SpinStep } from './SpinButton'

function renderSpinButton(valueText?: string) {
  const steps: SpinStep[] = []
  const onStep = vi.fn((step: SpinStep) => steps.push(step))
  render(
    <>
      <span id="monthLabel">Monat</span>
      <SpinButton
        labelledBy="monthLabel"
        value={10}
        minimum={1}
        maximum={12}
        valueText={valueText}
        onStep={onStep}
      >
        {valueText ?? 10}
      </SpinButton>
    </>,
  )
  return { steps, onStep, field: screen.getByRole('spinbutton') }
}

function keyDownOn(field: HTMLElement, key: string) {
  return !fireEvent.keyDown(field, { key })
}

describe('SpinButton', () => {
  it('is named by its label and reports its value and bounds', () => {
    renderSpinButton()

    const field = screen.getByRole('spinbutton', { name: 'Monat' })
    expect(field).toHaveAttribute('aria-valuenow', '10')
    expect(field).toHaveAttribute('aria-valuemin', '1')
    expect(field).toHaveAttribute('aria-valuemax', '12')
  })

  it('tells its value as text only when given one', () => {
    renderSpinButton()

    expect(screen.getByRole('spinbutton')).not.toHaveAttribute('aria-valuetext')
  })

  it('tells the given value text', () => {
    renderSpinButton('Oktober')

    expect(screen.getByRole('spinbutton')).toHaveAttribute(
      'aria-valuetext',
      'Oktober',
    )
    expect(screen.getByRole('spinbutton')).toHaveTextContent('Oktober')
  })

  it('steps up on arrow up without scrolling the page', () => {
    const { field, steps } = renderSpinButton()

    expect(keyDownOn(field, 'ArrowUp')).toBe(true)
    expect(steps).toEqual([1])
  })

  it('steps down on arrow down without scrolling the page', () => {
    const { field, steps } = renderSpinButton()

    expect(keyDownOn(field, 'ArrowDown')).toBe(true)
    expect(steps).toEqual([-1])
  })

  it.each(['Enter', 'ArrowLeft', 'a'])('leaves the key %s alone', (key) => {
    const { field, onStep } = renderSpinButton()

    expect(keyDownOn(field, key)).toBe(false)
    expect(onStep).not.toHaveBeenCalled()
  })

  it('can be reached with the tab key', async () => {
    const { field } = renderSpinButton()

    await userEvent.tab()

    expect(field).toHaveFocus()
  })
})
