import { describe, expect, it } from 'vitest'
import { byName, createName, InvalidName, MAXIMUM_NAME_LENGTH } from './name'

function named(name: string, id = name) {
  return { id, name }
}

function rejectionOf(written: string): InvalidName {
  try {
    createName(written)
  } catch (error) {
    if (error instanceof InvalidName) return error
    throw error
  }
  throw new Error(`"${written}" was accepted`)
}

describe('createName', () => {
  it('trims the written name', () => {
    expect(createName('  Familie ')).toBe('Familie')
  })

  it.each(['', '   '])('rejects the empty name "%s"', (written) => {
    expect(rejectionOf(written).reason).toBe('empty')
  })

  it('accepts a name of the maximum length', () => {
    const longest = 'a'.repeat(MAXIMUM_NAME_LENGTH)

    expect(createName(longest)).toBe(longest)
  })

  it('rejects a name beyond the maximum length', () => {
    const tooLong = 'a'.repeat(MAXIMUM_NAME_LENGTH + 1)

    expect(rejectionOf(tooLong).reason).toBe('tooLong')
  })
})

describe('byName', () => {
  it('sorts the way a German reader expects', () => {
    const sorted = byName([named('Bad'), named('Ärzte'), named('Zoo')])

    expect(sorted.map((each) => each.name)).toEqual(['Ärzte', 'Bad', 'Zoo'])
  })

  it('keeps names differing only in case next to each other', () => {
    const sorted = byName([
      named('Bad'),
      named('Abfall'),
      named('bad', 'small'),
      named('Car'),
    ])

    expect(sorted.map((each) => each.name.toLowerCase())).toEqual([
      'abfall',
      'bad',
      'bad',
      'car',
    ])
  })

  it('orders equal names by their id so the order stays stable', () => {
    const sorted = byName([named('Familie', 'b'), named('Familie', 'a')])

    expect(sorted.map((each) => each.id)).toEqual(['a', 'b'])
  })

  it('sorts lists as well', () => {
    const sorted = byName([
      { id: 'list-1', name: 'Wocheneinkauf', folderId: 'folder-1' },
      { id: 'list-2', name: 'Haushalt', folderId: 'folder-1' },
    ])

    expect(sorted.map((each) => each.name)).toEqual([
      'Haushalt',
      'Wocheneinkauf',
    ])
  })
})
