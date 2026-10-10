import { describe, expect, it } from 'vitest'
import { listById, type List } from './list'

const haushalt: List = { id: 'list-1', name: 'Haushalt', folderId: 'folder-1' }
const einkauf: List = { id: 'list-2', name: 'Einkauf', folderId: 'folder-2' }

describe('listById', () => {
  it('finds the list with the id', () => {
    expect(listById([haushalt, einkauf], 'list-2')).toEqual(einkauf)
  })

  it('finds nothing for an unknown id', () => {
    expect(listById([haushalt, einkauf], 'list-3')).toBeNull()
  })
})
