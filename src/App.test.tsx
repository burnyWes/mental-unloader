import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { createInMemoryAppearanceClient } from './shared/appearance/inMemoryAppearanceClient'
import { createInMemoryAppUpdateClient } from './shared/appUpdate/inMemoryAppUpdateClient'
import type { AuthClient } from './shared/auth/authClient'
import { createInMemoryAuthClient } from './shared/auth/inMemoryAuthClient'
import { createInMemoryOrganizerClient } from './tasks/api/inMemoryOrganizerClient'
import type { OrganizerClient } from './tasks/api/organizerClient'
import { accessibilityViolations } from './testSupport/accessibility'

const household = {
  email: 'haushalt@example.com',
  password: 'geheim',
  userId: 'household',
}

const TENTH_OF_OCTOBER_MORNING = new Date(2026, 9, 10, 9, 0)

function signedInAuthClient() {
  return createInMemoryAuthClient(household, {
    status: 'signedIn',
    userId: household.userId,
  })
}

function renderApp(
  appearanceClient = createInMemoryAppearanceClient(),
  appUpdateClient = createInMemoryAppUpdateClient(),
  authClient: AuthClient = signedInAuthClient(),
  createOrganizerClient: (
    onFailure: (message: string) => void,
  ) => OrganizerClient = () => createInMemoryOrganizerClient(),
  storageWarning = '',
) {
  return render(
    <App
      appearanceClient={appearanceClient}
      appUpdateClient={appUpdateClient}
      authClient={authClient}
      createOrganizerClient={createOrganizerClient}
      storageWarning={storageWarning}
      now={() => TENTH_OF_OCTOBER_MORNING}
    />,
  )
}

function renderAppWithFolders(...folders: string[]) {
  const client = createInMemoryOrganizerClient({
    folders: folders.map((name, index) => ({ id: `stored-${index}`, name })),
  })
  return renderApp(undefined, undefined, undefined, () => client)
}

function failureReportingOrganizerClient() {
  const reported: { onFailure: (message: string) => void } = {
    onFailure: () => {},
  }
  function createOrganizerClient(onFailure: (message: string) => void) {
    reported.onFailure = onFailure
    return createInMemoryOrganizerClient()
  }
  return { reported, createOrganizerClient }
}

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value: online,
  })
  window.dispatchEvent(new Event(online ? 'online' : 'offline'))
}

function renderSignedOutApp() {
  return renderApp(undefined, undefined, createInMemoryAuthClient(household))
}

const undecidedAuthClient: AuthClient = {
  observeSession: () => () => {},
  signIn: () => Promise.resolve({ succeeded: true }),
  signOut: () => Promise.resolve(),
}

function authClientFailingToSignOut(): AuthClient {
  return {
    ...signedInAuthClient(),
    signOut: () => Promise.reject(new Error('auth/network-request-failed')),
  }
}

async function signInAsHousehold() {
  await userEvent.type(screen.getByLabelText('E-Mail'), household.email)
  await userEvent.type(screen.getByLabelText('Passwort'), household.password)
  await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }))
}

async function requestSignOut() {
  await openSettings()
  await userEvent.click(screen.getByRole('button', { name: 'Abmelden' }))
}

async function confirmSignOut() {
  await requestSignOut()
  await userEvent.click(screen.getByRole('button', { name: 'Abmelden' }))
}

const areaButtons = ['Dringend', 'Ordner', 'Einstellungen']

function darkModeOnTheDocument() {
  return document.documentElement.dataset.darkMode
}

async function openSettings() {
  await userEvent.click(screen.getByRole('button', { name: 'Einstellungen' }))
}

const darkModeSwitch = { name: 'Dunkelmodus' }

const updateOffer = { name: 'Neue Version laden' }

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

  it('shows a folder that was stored before the start', async () => {
    renderAppWithFolders('Familie')

    await userEvent.click(screen.getByRole('button', { name: 'Ordner' }))

    expect(screen.getByRole('button', { name: 'Familie' })).toBeInTheDocument()
  })

  it('returns from an open folder to the overview with the folders button', async () => {
    renderAppWithFolders('Familie')
    await userEvent.click(screen.getByRole('button', { name: 'Ordner' }))
    await userEvent.click(screen.getByRole('button', { name: 'Familie' }))

    await userEvent.click(screen.getByRole('button', { name: 'Ordner' }))

    expect(screen.getByRole('heading', { name: 'Ordner' })).toHaveFocus()
  })

  it('announces a missing storage on this device', () => {
    renderApp(
      undefined,
      undefined,
      undefined,
      undefined,
      'Ohne Speicher auf diesem Gerät. Änderungen gehen beim Schließen verloren.',
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Ohne Speicher auf diesem Gerät. Änderungen gehen beim Schließen verloren.',
    )
  })

  it('announces losing and regaining the connection', () => {
    renderApp()

    act(() => setOnline(false))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Offline. Änderungen werden gespeichert.',
    )

    act(() => setOnline(true))
    expect(screen.getByRole('status')).toHaveTextContent('Wieder online.')
  })

  it('announces a failure reported by the organizer client', () => {
    const { reported, createOrganizerClient } =
      failureReportingOrganizerClient()
    renderApp(undefined, undefined, undefined, createOrganizerClient)

    act(() => reported.onFailure('Konnte nicht gespeichert werden.'))

    expect(screen.getByRole('status')).toHaveTextContent(
      'Konnte nicht gespeichert werden.',
    )
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

  it('offers nothing while no new version waits', () => {
    renderApp()

    expect(screen.queryByRole('button', updateOffer)).not.toBeInTheDocument()
  })

  it('offers and announces a waiting new version', () => {
    const appUpdateClient = createInMemoryAppUpdateClient()
    renderApp(undefined, appUpdateClient)

    act(() => appUpdateClient.releaseUpdate(() => {}))

    expect(screen.getByRole('button', updateOffer)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Neue Version verfügbar.',
    )
  })

  it('loads the new version only once the household asks for it', async () => {
    let loadedVersions = 0
    const appUpdateClient = createInMemoryAppUpdateClient()
    renderApp(undefined, appUpdateClient)

    act(() =>
      appUpdateClient.releaseUpdate(() => {
        loadedVersions += 1
      }),
    )
    expect(loadedVersions).toBe(0)

    await userEvent.click(screen.getByRole('button', updateOffer))

    expect(loadedVersions).toBe(1)
  })

  it('waits while the session is not yet known', () => {
    renderApp(undefined, undefined, undecidedAuthClient)

    expect(screen.getByText('Wird geladen.')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('asks a signed out household to sign in without offering the areas', () => {
    renderSignedOutApp()

    expect(
      screen.getByRole('heading', { name: 'Mental Unloader' }),
    ).toHaveFocus()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('shows the urgent tasks once the household signed in', async () => {
    renderSignedOutApp()

    await signInAsHousehold()

    expect(
      await screen.findByRole('heading', { name: 'Dringend' }),
    ).toHaveFocus()
  })

  it('asks for confirmation before signing out', async () => {
    renderApp()

    await requestSignOut()

    expect(screen.getByRole('heading', { name: 'Abmelden?' })).toHaveFocus()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it.each(['Abbrechen', 'Zurück'])(
    'returns to the settings and stays signed in with %s',
    async (name) => {
      renderApp()
      await requestSignOut()

      await userEvent.click(screen.getByRole('button', { name }))

      expect(
        screen.getByRole('heading', { name: 'Einstellungen' }),
      ).toHaveFocus()
      expect(
        screen.getByRole('navigation', { name: 'Bereiche' }),
      ).toBeInTheDocument()
    },
  )

  it('signs out once confirmed and announces it', async () => {
    renderApp()

    await confirmSignOut()

    expect(
      await screen.findByRole('heading', { name: 'Mental Unloader' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Abgemeldet.')
  })

  it('announces a failed sign out and stays signed in', async () => {
    renderApp(undefined, undefined, authClientFailingToSignOut())

    await confirmSignOut()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Abmelden fehlgeschlagen.',
    )
    expect(
      screen.queryByRole('heading', { name: 'Mental Unloader' }),
    ).not.toBeInTheDocument()
  })

  it('starts on the urgent tasks again after signing out and in', async () => {
    renderApp()
    await confirmSignOut()

    await signInAsHousehold()

    expect(
      await screen.findByRole('heading', { name: 'Dringend' }),
    ).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Dringend' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('shows the sign in page without accessibility violations', async () => {
    const { container } = renderSignedOutApp()

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows the sign out confirmation without accessibility violations', async () => {
    const { container } = renderApp()
    await requestSignOut()

    expect(await accessibilityViolations(container)).toEqual([])
  })
})
