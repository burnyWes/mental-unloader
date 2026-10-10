import type { ReactNode } from 'react'
import { BackIcon } from '../../shared/ui/BackIcon'
import { PencilIcon } from '../../shared/ui/PencilIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { Folder } from '../domain/folder'

type FolderPageProps = {
  navigation: ReactNode
  folder: Folder
  onBack: () => void
  onEdit: () => void
}

export function FolderPage({
  navigation,
  folder,
  onBack,
  onEdit,
}: FolderPageProps) {
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
            {folder.name}
          </h1>
          <button
            type="button"
            className="headerButton"
            aria-label="Ordner bearbeiten"
            onClick={onEdit}
          >
            <PencilIcon />
          </button>
        </div>
        <p>Noch keine Listen.</p>
      </main>
    </>
  )
}
