import { describe, expect, it } from 'vitest'
import type { DeviceStorage } from './appearanceClient'
import {
  ANIMATIONS_KEY,
  createLocalStorageAppearanceClient,
  DARK_MODE_KEY,
  SOUNDS_KEY,
} from './localStorageAppearanceClient'

function storageHolding(
  storedValue: string | null,
  storedKey: string = DARK_MODE_KEY,
) {
  const written: Record<string, string> = {}
  const storage: DeviceStorage = {
    getItem: (key) => (key === storedKey ? storedValue : null),
    setItem: (key, value) => {
      written[key] = value
    },
  }
  return { storage, written }
}

const throwingStorage: DeviceStorage = {
  getItem() {
    throw new Error('storage is blocked')
  },
  setItem() {
    throw new Error('storage is blocked')
  },
}

describe('localStorageAppearanceClient', () => {
  it('reads a remembered switch as turned off', () => {
    const { storage } = storageHolding('false')

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readDarkMode()).toBe(false)
  })

  it('reads a remembered switch as turned on', () => {
    const { storage } = storageHolding('true')

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readDarkMode()).toBe(true)
  })

  it('reads an unknown value as turned on', () => {
    const { storage } = storageHolding('maybe')

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readDarkMode()).toBe(true)
  })

  it('reads nothing remembered as turned on', () => {
    const { storage } = storageHolding(null)

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readDarkMode()).toBe(true)
  })

  it('remembers the switch turned on', () => {
    const { storage, written } = storageHolding('false')

    createLocalStorageAppearanceClient(storage).writeDarkMode(true)

    expect(written).toEqual({ [DARK_MODE_KEY]: 'true' })
  })

  it('remembers the switch turned off', () => {
    const { storage, written } = storageHolding(null)

    createLocalStorageAppearanceClient(storage).writeDarkMode(false)

    expect(written).toEqual({ [DARK_MODE_KEY]: 'false' })
  })

  it('stays usable without any storage', () => {
    const client = createLocalStorageAppearanceClient(null)

    expect(client.readDarkMode()).toBe(true)
    expect(() => client.writeDarkMode(false)).not.toThrow()
  })

  it('stays usable while the storage refuses to be read', () => {
    const client = createLocalStorageAppearanceClient(throwingStorage)

    expect(client.readDarkMode()).toBe(true)
  })

  it('stays usable while the storage refuses to be written', () => {
    const client = createLocalStorageAppearanceClient(throwingStorage)

    expect(() => client.writeDarkMode(false)).not.toThrow()
  })

  it('reads remembered animations as turned off', () => {
    const { storage } = storageHolding('false', ANIMATIONS_KEY)

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readAnimations()).toBe(false)
    expect(client.readDarkMode()).toBe(true)
  })

  it('reads nothing remembered for animations as turned on', () => {
    const { storage } = storageHolding(null, ANIMATIONS_KEY)

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readAnimations()).toBe(true)
  })

  it('remembers animations turned off', () => {
    const { storage, written } = storageHolding(null)

    createLocalStorageAppearanceClient(storage).writeAnimations(false)

    expect(written).toEqual({ [ANIMATIONS_KEY]: 'false' })
  })

  it('stays usable for animations while the storage is blocked', () => {
    const client = createLocalStorageAppearanceClient(throwingStorage)

    expect(client.readAnimations()).toBe(true)
    expect(() => client.writeAnimations(false)).not.toThrow()
  })

  it('reads remembered sounds as turned off', () => {
    const { storage } = storageHolding('false', SOUNDS_KEY)

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readSounds()).toBe(false)
    expect(client.readAnimations()).toBe(true)
  })

  it('reads nothing remembered for sounds as turned on', () => {
    const { storage } = storageHolding(null, SOUNDS_KEY)

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readSounds()).toBe(true)
  })

  it('remembers sounds turned off', () => {
    const { storage, written } = storageHolding(null)

    createLocalStorageAppearanceClient(storage).writeSounds(false)

    expect(written).toEqual({ [SOUNDS_KEY]: 'false' })
  })

  it('stays usable for sounds while the storage is blocked', () => {
    const client = createLocalStorageAppearanceClient(throwingStorage)

    expect(client.readSounds()).toBe(true)
    expect(() => client.writeSounds(false)).not.toThrow()
  })
})
