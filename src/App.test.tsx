import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { createInMemoryAppearanceClient } from './shared/appearance/inMemoryAppearanceClient'
import { createInMemoryAppUpdateClient } from './shared/appUpdate/inMemoryAppUpdateClient'
import type { AuthClient } from './shared/auth/authClient'
import { createInMemoryAuthClient } from './shared/auth/inMemoryAuthClient'
import {
  createInMemorySoundEffects,
  type RecordingSoundEffects,
} from './shared/sound/inMemorySoundEffects'
import { createInMemoryOrganizerClient } from './tasks/api/inMemoryOrganizerClient'
import type { OrganizerClient } from './tasks/api/organizerClient'
import type { Due, Task } from './tasks/domain/task'
import { accessibilityViolations } from './testSupport/accessibility'
import {
  installFakeViewTransitions,
  type FakeViewTransitions,
} from './testSupport/fakeViewTransitions'

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
  now: () => Date = () => TENTH_OF_OCTOBER_MORNING,
  soundEffects: RecordingSoundEffects = createInMemorySoundEffects(),
) {
  return render(
    <App
      appearanceClient={appearanceClient}
      appUpdateClient={appUpdateClient}
      authClient={authClient}
      createOrganizerClient={createOrganizerClient}
      storageWarning={storageWarning}
      now={now}
      soundEffects={soundEffects}
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

const haushalt = { id: 'stored-list-1', name: 'Haushalt', folderId: 'stored-1' }

function storedTask(id: string, name: string, due: Due): Task {
  return {
    id,
    listId: haushalt.id,
    name,
    description: '',
    due,
    createdAt: 1,
    completions: [],
  }
}

const muell = storedTask('stored-task-1', 'Müll rausbringen', {
  kind: 'urgent',
  since: '2026-10-01',
})

function deadlineTask(name: string, deadline: string) {
  return storedTask(`stored-${name}`, name, {
    kind: 'deadline',
    deadline,
    urgentFrom: 'oneWeek',
    repetition: null,
  })
}

function renderAppWithTasks(...tasks: Task[]) {
  return renderAppWithTasksAt(() => TENTH_OF_OCTOBER_MORNING, ...tasks)
}

function renderAppWithTasksAt(now: () => Date, ...tasks: Task[]) {
  const client = createInMemoryOrganizerClient({
    folders: [{ id: 'stored-1', name: 'Familie' }],
    lists: [haushalt],
    tasks,
  })
  return renderApp(undefined, undefined, undefined, () => client, '', now)
}

function urgentAreaButton(name: string) {
  return screen.getByRole('button', { name })
}

function navigationBadge() {
  return document.querySelector('.navigationBadge')
}

function darkModeOnTheDocument() {
  return document.documentElement.dataset.darkMode
}

async function openSettings() {
  await userEvent.click(screen.getByRole('button', { name: 'Einstellungen' }))
}

const darkModeSwitch = { name: 'Dunkelmodus' }

const animationsSwitch = { name: 'Animationen' }

const soundsSwitch = { name: 'Sounds' }

function switchLabels() {
  return screen
    .getAllByRole('switch')
    .map((each) => each.closest('label')?.textContent)
}

const updateOffer = { name: 'Neue Version laden' }

describe('App', () => {
  it('starts on the urgent tasks with their heading focused', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Dringend' })).toHaveFocus()
    expect(screen.getByText('Nichts Dringendes.')).toBeInTheDocument()
  })

  it('shows an urgent task with its origin on the start page', () => {
    renderAppWithTasks(muell)

    expect(
      screen.getByRole('button', {
        name: 'Müll rausbringen, dringend, Familie, Haushalt',
      }),
    ).toBeInTheDocument()
  })

  it('counts the urgent tasks at the urgent area in every area', async () => {
    renderAppWithTasks(muell, deadlineTask('Reifen wechseln', '2026-10-15'))

    expect(urgentAreaButton('Dringend, 2 Aufgaben')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Ordner' }))

    expect(urgentAreaButton('Dringend, 2 Aufgaben')).toBeInTheDocument()
  })

  it('counts one task less after completing it on the urgent page', async () => {
    renderAppWithTasks(muell, deadlineTask('Reifen wechseln', '2026-10-15'))

    await userEvent.click(
      screen.getByRole('button', { name: 'Müll rausbringen erledigen' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Erledigen' }))

    expect(urgentAreaButton('Dringend, 1 Aufgabe')).toBeInTheDocument()
  })

  it('shows no badge while nothing is urgent', () => {
    renderApp()

    expect(urgentAreaButton('Dringend')).toBeInTheDocument()
    expect(navigationBadge()).toBeNull()
  })

  it('turns to the new day once the app becomes visible again', () => {
    let moment = TENTH_OF_OCTOBER_MORNING
    renderAppWithTasksAt(
      () => moment,
      deadlineTask('Reifen wechseln', '2026-10-18'),
    )
    expect(urgentAreaButton('Dringend')).toBeInTheDocument()

    moment = new Date(2026, 9, 11, 7, 30)
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    Reflect.deleteProperty(document, 'visibilityState')

    expect(urgentAreaButton('Dringend, 1 Aufgabe')).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Reifen wechseln, Stichtag 18. Oktober, dringend, Familie, Haushalt',
      }),
    ).toBeInTheDocument()
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
    renderApp(createInMemoryAppearanceClient({ darkMode: false }))

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

  it('shows the animations switch below dark mode, turned on', async () => {
    renderApp()
    await openSettings()

    expect(switchLabels()).toEqual(['Dunkelmodus', 'Animationen', 'Sounds'])
    expect(screen.getByRole('switch', animationsSwitch)).toBeChecked()
  })

  it('shows the sounds switch below animations, turned on', async () => {
    renderApp()
    await openSettings()

    expect(switchLabels().at(-1)).toBe('Sounds')
    expect(screen.getByRole('switch', soundsSwitch)).toBeChecked()
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

describe('App sliding', () => {
  let viewTransitions: FakeViewTransitions

  beforeEach(() => {
    viewTransitions = installFakeViewTransitions()
  })

  afterEach(() => {
    viewTransitions.uninstall()
  })

  async function slideBy(name: string) {
    await userEvent.click(screen.getByRole('button', { name }))
    viewTransitions.finishPendingUpdates()
  }

  it('slides into the sign out confirmation and back on cancel', async () => {
    renderApp()
    await slideBy('Einstellungen')

    await slideBy('Abmelden')
    await slideBy('Abbrechen')

    expect(screen.getByRole('heading', { name: 'Einstellungen' })).toHaveFocus()
    expect(viewTransitions.directions()).toEqual(['forward', 'forward', 'back'])
  })

  it('slides between the areas in the order of their buttons', async () => {
    renderApp()

    await slideBy('Ordner')
    await slideBy('Einstellungen')
    await slideBy('Dringend')

    expect(screen.getByRole('heading', { name: 'Dringend' })).toHaveFocus()
    expect(viewTransitions.directions()).toEqual(['forward', 'forward', 'back'])
  })

  it('does not slide when choosing the area already shown', async () => {
    renderApp()

    await userEvent.click(screen.getByRole('button', { name: 'Dringend' }))

    expect(viewTransitions.directions()).toEqual([])
  })

  it('stops sliding once animations are turned off', async () => {
    const appearanceClient = createInMemoryAppearanceClient()
    renderApp(appearanceClient)
    await slideBy('Einstellungen')

    await userEvent.click(screen.getByRole('switch', animationsSwitch))
    await userEvent.click(screen.getByRole('button', { name: 'Dringend' }))

    expect(screen.getByRole('heading', { name: 'Dringend' })).toHaveFocus()
    expect(viewTransitions.directions()).toEqual(['forward'])
    expect(appearanceClient.storedAnimations()).toBe(false)
  })

  it('starts without sliding when animations were turned off before', async () => {
    renderApp(createInMemoryAppearanceClient({ animations: false }))

    await userEvent.click(screen.getByRole('button', { name: 'Ordner' }))

    expect(screen.getByRole('heading', { name: 'Ordner' })).toHaveFocus()
    expect(viewTransitions.directions()).toEqual([])
  })

  function renderAppHearing(
    soundEffects: RecordingSoundEffects,
    appearanceClient = createInMemoryAppearanceClient(),
  ) {
    const client = createInMemoryOrganizerClient({
      folders: [{ id: 'stored-0', name: 'Familie' }],
    })
    return renderApp(
      appearanceClient,
      undefined,
      undefined,
      () => client,
      undefined,
      undefined,
      soundEffects,
    )
  }

  async function slideByClicking(name: string | RegExp) {
    await userEvent.click(screen.getByRole('button', { name }))
    viewTransitions.finishPendingUpdates()
  }

  it('plays the page turn sound once for each slide', async () => {
    const soundEffects = createInMemorySoundEffects()
    renderAppHearing(soundEffects)

    await slideByClicking('Ordner')
    await slideByClicking('Familie')
    await slideByClicking(/^erledigt/)

    expect(viewTransitions.directions()).toEqual([
      'forward',
      'forward',
      'itemsForward',
    ])
    expect(soundEffects.played()).toEqual(['pageTurn', 'pageTurn', 'pageTurn'])
  })

  it('does not play the page turn sound when choosing the area already shown', async () => {
    const soundEffects = createInMemorySoundEffects()
    renderAppHearing(soundEffects)

    await userEvent.click(screen.getByRole('button', { name: 'Dringend' }))

    expect(soundEffects.played()).toEqual([])
  })

  it('plays the deactivate sound when turning sounds off and stays silent after', async () => {
    const soundEffects = createInMemorySoundEffects()
    const appearanceClient = createInMemoryAppearanceClient()
    renderAppHearing(soundEffects, appearanceClient)
    await slideByClicking('Einstellungen')

    await userEvent.click(screen.getByRole('switch', soundsSwitch))
    await slideByClicking('Ordner')

    expect(viewTransitions.directions()).toEqual(['forward', 'back'])
    expect(soundEffects.played()).toEqual(['pageTurn', 'deactivate'])
    expect(appearanceClient.storedSounds()).toBe(false)
  })

  it('plays the activate sound when turning sounds on', async () => {
    const soundEffects = createInMemorySoundEffects()
    renderAppHearing(
      soundEffects,
      createInMemoryAppearanceClient({ sounds: false }),
    )
    await slideByClicking('Einstellungen')

    await userEvent.click(screen.getByRole('switch', soundsSwitch))

    expect(soundEffects.played()).toEqual(['activate'])
  })

  it('plays the deactivate and activate sounds when switching dark mode', async () => {
    const soundEffects = createInMemorySoundEffects()
    renderAppHearing(soundEffects)
    await slideByClicking('Einstellungen')

    await userEvent.click(screen.getByRole('switch', { name: 'Dunkelmodus' }))
    await userEvent.click(screen.getByRole('switch', { name: 'Dunkelmodus' }))

    expect(soundEffects.played()).toEqual([
      'pageTurn',
      'deactivate',
      'activate',
    ])
  })

  it('plays the switch sounds for animations even while animations are turned off', async () => {
    const soundEffects = createInMemorySoundEffects()
    renderAppHearing(soundEffects)
    await slideByClicking('Einstellungen')

    await userEvent.click(screen.getByRole('switch', { name: 'Animationen' }))
    await userEvent.click(screen.getByRole('switch', { name: 'Animationen' }))

    expect(soundEffects.played()).toEqual([
      'pageTurn',
      'deactivate',
      'activate',
    ])
  })

  it('keeps the other switches silent once sounds are turned off', async () => {
    const soundEffects = createInMemorySoundEffects()
    renderAppHearing(
      soundEffects,
      createInMemoryAppearanceClient({ sounds: false }),
    )
    await slideByClicking('Einstellungen')

    await userEvent.click(screen.getByRole('switch', { name: 'Dunkelmodus' }))

    expect(soundEffects.played()).toEqual([])
  })

  it('stays silent while animations are turned off', async () => {
    const soundEffects = createInMemorySoundEffects()
    renderAppHearing(
      soundEffects,
      createInMemoryAppearanceClient({ animations: false }),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Einstellungen' }))
    await userEvent.click(screen.getByRole('button', { name: 'Ordner' }))
    await userEvent.click(screen.getByRole('button', { name: 'Einstellungen' }))

    expect(soundEffects.played()).toEqual([])
    expect(screen.getByRole('switch', soundsSwitch)).toBeChecked()
    expect(screen.getByRole('switch', soundsSwitch)).toBeEnabled()
  })

  async function requestSignOutHearing() {
    await slideByClicking('Einstellungen')
    await slideByClicking('Abmelden')
  }

  it('plays the confirm sound when signing out', async () => {
    const soundEffects = createInMemorySoundEffects()
    renderAppHearing(soundEffects)
    await requestSignOutHearing()

    await userEvent.click(screen.getByRole('button', { name: 'Abmelden' }))

    expect(soundEffects.played()).toEqual(['pageTurn', 'pageTurn', 'confirm'])
  })

  it('plays the refuse sound when cancelling the sign out', async () => {
    const soundEffects = createInMemorySoundEffects()
    renderAppHearing(soundEffects)
    await requestSignOutHearing()

    await slideByClicking('Abbrechen')

    expect(soundEffects.played()).toEqual(['pageTurn', 'pageTurn', 'refuse'])
    expect(viewTransitions.directions()).toEqual(['forward', 'forward', 'back'])
  })

  it('stays silent on confirmation once sounds are turned off', async () => {
    const soundEffects = createInMemorySoundEffects()
    renderAppHearing(
      soundEffects,
      createInMemoryAppearanceClient({ sounds: false }),
    )
    await requestSignOutHearing()

    await slideByClicking('Abbrechen')
    await slideByClicking('Abmelden')
    await userEvent.click(screen.getByRole('button', { name: 'Abmelden' }))

    expect(soundEffects.played()).toEqual([])
  })
})

describe('App sound with reduced motion', () => {
  it('stays silent when reduced motion is preferred', async () => {
    const viewTransitions = installFakeViewTransitions({ reducedMotion: true })
    const soundEffects = createInMemorySoundEffects()
    renderApp(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      soundEffects,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Ordner' }))

    expect(soundEffects.played()).toEqual([])
    viewTransitions.uninstall()
  })

  it('plays the refuse sound when reduced motion is preferred', async () => {
    const viewTransitions = installFakeViewTransitions({ reducedMotion: true })
    const soundEffects = createInMemorySoundEffects()
    renderApp(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      soundEffects,
    )
    await requestSignOut()

    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))

    expect(soundEffects.played()).toEqual(['refuse'])
    viewTransitions.uninstall()
  })
})
