import { useEffect, useRef, type ReactNode } from 'react'
import { PlusIcon } from '../../shared/ui/PlusIcon'
import { useFocusAfterRemoval } from '../../shared/ui/useFocusAfterRemoval'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { Folder, FolderId } from '../domain/folder'
import { FolderButton } from './FolderButton'

export type FoldersOverviewFocus =
  | { kind: 'heading' }
  | { kind: 'arrivingFolder'; id: FolderId }
  | { kind: 'followingFolder'; removedAt: number; removedId: FolderId }

function withoutRemovedFolder(
  folders: readonly Folder[],
  focus: FoldersOverviewFocus,
): readonly Folder[] {
  if (focus.kind !== 'followingFolder') return folders
  return folders.filter((folder) => folder.id !== focus.removedId)
}

type FoldersPageProps = {
  navigation: ReactNode
  folders: readonly Folder[]
  focus: FoldersOverviewFocus
  onCreateFolder: () => void
  onOpenFolder: (folder: Folder) => void
}

export function FoldersPage({
  navigation,
  folders,
  focus,
  onCreateFolder,
  onOpenFolder,
}: FoldersPageProps) {
  const heading = useHeadingFocus()
  const shownFolders = withoutRemovedFolder(folders, focus)
  const { keepRow } = useFocusAfterRemoval(
    shownFolders.map((folder) => folder.id),
    heading,
    focus.kind === 'followingFolder' ? focus.removedAt : null,
  )
  const folderButtons = useRef(new Map<FolderId, HTMLButtonElement>())
  const awaitedFolder = useRef(
    focus.kind === 'arrivingFolder' ? focus.id : null,
  )

  function focusIsStillUnclaimed() {
    const focused = document.activeElement
    return focused === heading.current || focused === document.body
  }

  useEffect(() => {
    const awaited = awaitedFolder.current
    if (awaited === null) return
    const arrived = folderButtons.current.get(awaited)
    if (arrived === undefined) return
    awaitedFolder.current = null
    if (focusIsStillUnclaimed()) arrived.focus()
  })

  function keepFolderButton(id: FolderId) {
    const keepForRemoval = keepRow(id)
    return (button: HTMLButtonElement | null) => {
      keepForRemoval(button)
      if (button === null) {
        folderButtons.current.delete(id)
      } else {
        folderButtons.current.set(id, button)
      }
    }
  }

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            Ordner
          </h1>
          <button
            type="button"
            className="headerButton"
            aria-label="Ordner anlegen"
            onClick={onCreateFolder}
          >
            <PlusIcon />
          </button>
        </div>
        {shownFolders.length === 0 ? (
          <p>Noch keine Ordner.</p>
        ) : (
          <ul className="folderList">
            {shownFolders.map((folder) => (
              <li key={folder.id}>
                <FolderButton
                  folder={folder}
                  onOpen={onOpenFolder}
                  ref={keepFolderButton(folder.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
