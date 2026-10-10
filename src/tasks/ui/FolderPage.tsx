import type { ReactNode } from 'react'
import { BackIcon } from '../../shared/ui/BackIcon'
import { PencilIcon } from '../../shared/ui/PencilIcon'
import { PlusIcon } from '../../shared/ui/PlusIcon'
import { useFocusAfterRemoval } from '../../shared/ui/useFocusAfterRemoval'
import { useFocusOnArrival } from '../../shared/ui/useFocusOnArrival'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { Folder } from '../domain/folder'
import type { List, ListId } from '../domain/list'
import type { FolderPageFocus } from './foldersAreaPage'
import { ListButton } from './ListButton'

function withoutRemovedList(
  lists: readonly List[],
  focus: FolderPageFocus,
): readonly List[] {
  if (focus.kind !== 'followingList') return lists
  return lists.filter((list) => list.id !== focus.removedId)
}

type FolderPageProps = {
  navigation: ReactNode
  folder: Folder
  lists: readonly List[]
  focus: FolderPageFocus
  onBack: () => void
  onEdit: () => void
  onCreateList: () => void
  onOpenList: (list: List) => void
}

export function FolderPage({
  navigation,
  folder,
  lists,
  focus,
  onBack,
  onEdit,
  onCreateList,
  onOpenList,
}: FolderPageProps) {
  const heading = useHeadingFocus()
  const shownLists = withoutRemovedList(lists, focus)
  const { keepRow } = useFocusAfterRemoval(
    shownLists.map((list) => list.id),
    heading,
    focus.kind === 'followingList' ? focus.removedAt : null,
  )
  const { keepArrival } = useFocusOnArrival<ListId>(
    focus.kind === 'arrivingList' ? focus.id : null,
    heading,
  )

  function keepListButton(id: ListId) {
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
        <button type="button" className="backButton" onClick={onBack}>
          <BackIcon /> Zurück
        </button>
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            {folder.name}
          </h1>
          <div className="pageHeaderButtons">
            <button
              type="button"
              className="headerButton"
              aria-label="Ordner bearbeiten"
              onClick={onEdit}
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              className="headerButton"
              aria-label="Liste anlegen"
              onClick={onCreateList}
            >
              <PlusIcon />
            </button>
          </div>
        </div>
        {shownLists.length === 0 ? (
          <p>Noch keine Listen.</p>
        ) : (
          <ul className="folderList">
            {shownLists.map((list) => (
              <li key={list.id}>
                <ListButton
                  list={list}
                  onOpen={onOpenList}
                  ref={keepListButton(list.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
