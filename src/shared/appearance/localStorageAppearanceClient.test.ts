import { describe, expect, it } from 'vitest'
import type { DeviceStorage } from './appearanceClient'
import {
  createLocalStorageAppearanceClient,
  DARK_MODE_KEY,
} from './localStorageAppearanceClient'

function storageHolding(storedValue: string | null) {
  const written: Record<string, string> = {}
  const storage: DeviceStorage = {
    getItem: (key) => (key === DARK_MODE_KEY ? storedValue : null),
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
})
