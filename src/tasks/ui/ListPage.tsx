import type { ReactNode } from 'react'
import { BackIcon } from '../../shared/ui/BackIcon'
import { PencilIcon } from '../../shared/ui/PencilIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { List } from '../domain/list'

type ListPageProps = {
  navigation: ReactNode
  list: List
  onBack: () => void
  onEdit: () => void
}

export function ListPage({ navigation, list, onBack, onEdit }: ListPageProps) {
  const heading = useHeadingFocus()

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <button type="button" className="backButton" onClick={onBack}>
          <BackIcon /> Zurück
        </button>
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            {list.name}
          </h1>
          <button
            type="button"
            className="headerButton"
            aria-label="Liste bearbeiten"
            onClick={onEdit}
          >
            <PencilIcon />
          </button>
        </div>
        <p>Noch keine Aufgaben.</p>
      </main>
    </>
  )
}
