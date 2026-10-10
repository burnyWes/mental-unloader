import type { ReactNode } from 'react'
import { PlusIcon } from '../../shared/ui/PlusIcon'
import { useFocusAfterRemoval } from '../../shared/ui/useFocusAfterRemoval'
import { useFocusOnArrival } from '../../shared/ui/useFocusOnArrival'
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
  listCount: (folderId: FolderId) => number
  focus: FoldersOverviewFocus
  onCreateFolder: () => void
  onOpenFolder: (folder: Folder) => void
}

export function FoldersPage({
  navigation,
  folders,
  listCount,
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
  const { keepArrival } = useFocusOnArrival(
    focus.kind === 'arrivingFolder' ? focus.id : null,
    heading,
  )

  function keepFolderButton(id: FolderId) {
    const keepForRemoval = keepRow(id)
    const keepForArrival = keepArrival(id)
    return (button: HTMLButtonElement | null) => {
      keepForRemoval(button)
      keepForArrival(button)
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
                  listCount={listCount(folder.id)}
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
