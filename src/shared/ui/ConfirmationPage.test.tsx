import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { ConfirmationPage } from './ConfirmationPage'

function renderConfirmationPage() {
  const calls = { confirmed: 0, cancelled: 0 }
  const rendered = render(
    <ConfirmationPage
      heading="Abmelden?"
      explanation="Auf diesem Gerät musst du dich danach neu anmelden."
      confirmLabel="Abmelden"
      onConfirm={() => {
        calls.confirmed += 1
      }}
      onCancel={() => {
        calls.cancelled += 1
      }}
    />,
  )
  return { calls, rendered }
}

describe('ConfirmationPage', () => {
  it('focuses its heading', () => {
    renderConfirmationPage()

    expect(screen.getByRole('heading', { name: 'Abmelden?' })).toHaveFocus()
  })

  it('shows the explanation', () => {
    renderConfirmationPage()

    expect(
      screen.getByText('Auf diesem Gerät musst du dich danach neu anmelden.'),
    ).toBeInTheDocument()
  })

  it('confirms with the confirm button', async () => {
    const { calls } = renderConfirmationPage()

    await userEvent.click(screen.getByRole('button', { name: 'Abmelden' }))

    expect(calls).toEqual({ confirmed: 1, cancelled: 0 })
  })

  it.each(['Abbrechen', 'Zurück'])('cancels with %s', async (name) => {
    const { calls } = renderConfirmationPage()

    await userEvent.click(screen.getByRole('button', { name }))

    expect(calls).toEqual({ confirmed: 0, cancelled: 1 })
  })

  it('offers no navigation', () => {
    renderConfirmationPage()

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { rendered } = renderConfirmationPage()

    expect(await accessibilityViolations(rendered.container)).toEqual([])
  })
})
