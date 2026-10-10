import type { Ref } from 'react'
import { listCountLabel } from '../domain/announcements'
import type { Folder } from '../domain/folder'
import { ArrowIcon } from './ArrowIcon'

type FolderButtonProps = {
  folder: Folder
  listCount: number
  onOpen: (folder: Folder) => void
  ref?: Ref<HTMLButtonElement>
}

export function FolderButton({
  folder,
  listCount,
  onOpen,
  ref,
}: FolderButtonProps) {
  const hasLists = listCount > 0

  return (
    <button
      type="button"
      className="folderButton"
      ref={ref}
      onClick={() => onOpen(folder)}
    >
      <span className="folderButtonName">
        <span className="folderButtonTitle">
          {folder.name}
          {hasLists && <span className="visuallyHidden">,</span>}
        </span>
        {hasLists && (
          <>
            {' '}
            <span className="folderButtonCount">
              {listCountLabel(listCount)}
            </span>
          </>
        )}
      </span>
      <span className="folderButtonArrow">
        <ArrowIcon />
      </span>
    </button>
  )
}
