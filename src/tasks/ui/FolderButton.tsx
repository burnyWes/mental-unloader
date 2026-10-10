import type { Ref } from 'react'
import type { Folder } from '../domain/folder'
import { ArrowIcon } from './ArrowIcon'

type FolderButtonProps = {
  folder: Folder
  onOpen: (folder: Folder) => void
  ref?: Ref<HTMLButtonElement>
}

export function FolderButton({ folder, onOpen, ref }: FolderButtonProps) {
  return (
    <button
      type="button"
      className="folderButton"
      ref={ref}
      onClick={() => onOpen(folder)}
    >
      <span className="folderButtonName">{folder.name}</span>
      <span className="folderButtonArrow">
        <ArrowIcon />
      </span>
    </button>
  )
}
