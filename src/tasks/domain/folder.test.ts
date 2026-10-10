import { describe, expect, it } from 'vitest'
import {
  byName,
  createFolderName,
  folderById,
  InvalidFolderName,
  MAXIMUM_FOLDER_NAME_LENGTH,
  type Folder,
} from './folder'

function folder(name: string, id = name): Folder {
  return { id, name }
}

function rejectionOf(written: string): InvalidFolderName {
  try {
    createFolderName(written)
  } catch (error) {
    if (error instanceof InvalidFolderName) return error
    throw error
  }
  throw new Error(`"${written}" was accepted`)
}

describe('createFolderName', () => {
  it('trims the written name', () => {
    expect(createFolderName('  Familie ')).toBe('Familie')
  })

  it.each(['', '   '])('rejects the empty name "%s"', (written) => {
    expect(rejectionOf(written).reason).toBe('empty')
  })

  it('accepts a name of the maximum length', () => {
    const longest = 'a'.repeat(MAXIMUM_FOLDER_NAME_LENGTH)

    expect(createFolderName(longest)).toBe(longest)
  })

  it('rejects a name beyond the maximum length', () => {
    const tooLong = 'a'.repeat(MAXIMUM_FOLDER_NAME_LENGTH + 1)

    expect(rejectionOf(tooLong).reason).toBe('tooLong')
  })
})

describe('byName', () => {
  it('sorts the way a German reader expects', () => {
    const sorted = byName([folder('Bad'), folder('Ärzte'), folder('Zoo')])

    expect(sorted.map((each) => each.name)).toEqual(['Ärzte', 'Bad', 'Zoo'])
  })

  it('keeps names differing only in case next to each other', () => {
    const sorted = byName([
      folder('Bad'),
      folder('Abfall'),
      folder('bad', 'small'),
      folder('Car'),
    ])

    expect(sorted.map((each) => each.name.toLowerCase())).toEqual([
      'abfall',
      'bad',
      'bad',
      'car',
    ])
  })

  it('orders equal names by their id so the order stays stable', () => {
    const sorted = byName([folder('Familie', 'b'), folder('Familie', 'a')])

    expect(sorted.map((each) => each.id)).toEqual(['a', 'b'])
  })
})

describe('folderById', () => {
  const folders = [folder('Familie', 'folder-1'), folder('Garten', 'folder-2')]

  it('finds the folder with the id', () => {
    expect(folderById(folders, 'folder-2')).toEqual(
      folder('Garten', 'folder-2'),
    )
  })

  it('finds nothing for an unknown id', () => {
    expect(folderById(folders, 'folder-3')).toBeNull()
  })
})
