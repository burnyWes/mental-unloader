import { describe, expect, it } from 'vitest'
import { folderById, type Folder } from './folder'

function folder(name: string, id: string): Folder {
  return { id, name }
}

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
