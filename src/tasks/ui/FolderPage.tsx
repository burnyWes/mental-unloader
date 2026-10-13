import type { ReactNode } from 'react'
import { BackIcon } from '../../shared/ui/BackIcon'
import { PencilIcon } from '../../shared/ui/PencilIcon'
import { PlusIcon } from '../../shared/ui/PlusIcon'
import { useFocusAfterRemoval } from '../../shared/ui/useFocusAfterRemoval'
import { useFocusOnArrival } from '../../shared/ui/useFocusOnArrival'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { Folder } from '../domain/folder'
import type { List, ListId } from '../domain/list'
import type { OpenTaskSummary } from '../domain/organizer'
import type { FolderPageFocus, StatusFilter } from './foldersAreaPage'
import { ListButton } from './ListButton'
import { StatusFilterButtons } from './StatusFilterButtons'

const EMPTY_FILTER_TEXTS: Record<StatusFilter, string> = {
  open: 'Keine offenen Listen.',
  completed: 'Noch keine Liste erledigt.',
}

function withoutRemovedList(
  lists: readonly List[],
  focus: FolderPageFocus,
): readonly List[] {
  if (focus.kind !== 'followingList') return lists
  return lists.filter((list) => list.id !== focus.removedId)
}

function awaitedList(focus: FolderPageFocus): ListId | null {
  switch (focus.kind) {
    case 'arrivingList':
    case 'returningList':
      return focus.id
    case 'heading':
    case 'followingList':
      return null
  }
}

type FolderPageProps = {
  navigation: ReactNode
  folder: Folder
  listsByFilter: Record<StatusFilter, readonly List[]>
  filter: StatusFilter
  openTaskSummary: (listId: ListId) => OpenTaskSummary
  focus: FolderPageFocus
  onBack: () => void
  onEdit: () => void
  onFilter: (filter: StatusFilter) => void
  onCreateList: () => void
  onOpenList: (list: List) => void
}

export function FolderPage({
  navigation,
  folder,
  listsByFilter,
  filter,
  openTaskSummary,
  focus,
  onBack,
  onEdit,
  onFilter,
  onCreateList,
  onOpenList,
}: FolderPageProps) {
  const heading = useHeadingFocus()

  function listsIn(kind: StatusFilter): readonly List[] {
    const lists = listsByFilter[kind]
    return kind === filter ? withoutRemovedList(lists, focus) : lists
  }

  const counts: Record<StatusFilter, number> = {
    open: listsIn('open').length,
    completed: listsIn('completed').length,
  }
  const shownLists = listsIn(filter)
  const { keepRow } = useFocusAfterRemoval(
    shownLists.map((list) => list.id),
    heading,
    focus.kind === 'followingList' ? focus.removedAt : null,
  )
  const { keepArrival } = useFocusOnArrival<ListId>(awaitedList(focus), heading)

  function keepListButton(id: ListId) {
    const keepForRemoval = keepRow(id)
    const keepForArrival = keepArrival(id)
    return (button: HTMLButtonElement | null) => {
      keepForRemoval(button)
      keepForArrival(button)
    }
  }

  function emptyText(): string {
    if (counts.open + counts.completed === 0) return 'Noch keine Listen.'
    return EMPTY_FILTER_TEXTS[filter]
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
        <StatusFilterButtons
          chosen={filter}
          counts={counts}
          onChoose={onFilter}
        />
        {shownLists.length === 0 ? (
          <p>{emptyText()}</p>
        ) : (
          <ul className="folderList">
            {shownLists.map((list) => (
              <li key={list.id}>
                <ListButton
                  list={list}
                  summary={openTaskSummary(list.id)}
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
