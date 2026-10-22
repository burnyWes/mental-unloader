import type { Ref } from 'react'
import { folderSummaryLabel, listCountLabel } from '../domain/announcements'
import type { Folder } from '../domain/folder'
import type { FolderSummary } from '../domain/organizer'
import { ArrowIcon } from './ArrowIcon'
import { FlameIcon } from './FlameIcon'

type FolderButtonProps = {
  folder: Folder
  summary: FolderSummary
  onOpen: (folder: Folder) => void
  ref?: Ref<HTMLButtonElement>
}

export function FolderButton({
  folder,
  summary,
  onOpen,
  ref,
}: FolderButtonProps) {
  const hasLists = summary.lists > 0

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
          {hasLists && (
            <span className="visuallyHidden">
              , {folderSummaryLabel(summary)}
            </span>
          )}
        </span>
        {hasLists && (
          <span className="folderButtonCount" aria-hidden="true">
            {listCountLabel(summary.lists)}
            {summary.urgent > 0 && (
              <>
                , <FlameIcon /> {summary.urgent}
              </>
            )}
          </span>
        )}
      </span>
      <span className="folderButtonArrow">
        <ArrowIcon />
      </span>
    </button>
  )
}
