import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ConfirmationPage } from '../../shared/ui/ConfirmationPage'
import {
  FOLDER_DELETION_EXPLANATION,
  folderCreatedAnnouncement,
  folderDeletedAnnouncement,
  folderDeletedElsewhereAnnouncement,
  folderDeletionHeading,
  folderSavedAnnouncement,
} from '../domain/announcements'
import {
  createFolderName,
  folderById,
  type Folder,
  type FolderId,
} from '../domain/folder'
import { FolderFormPage } from './FolderFormPage'
import { FolderPage } from './FolderPage'
import { FoldersPage, type FoldersOverviewFocus } from './FoldersPage'
import type { Folders } from './useFolders'

type FoldersAreaPage =
  | { kind: 'overview'; focus: FoldersOverviewFocus }
  | { kind: 'create'; draftName: string }
  | { kind: 'folder'; id: FolderId }
  | { kind: 'edit'; id: FolderId; draftName: string }
  | { kind: 'confirmDeletion'; id: FolderId; draftName: string }

type FoldersAreaProps = {
  folders: Folders
  navigation: ReactNode
  announce: (text: string) => void
}

const HEADING_FOCUS: FoldersOverviewFocus = { kind: 'heading' }

function addressedFolderId(page: FoldersAreaPage): FolderId | null {
  return 'id' in page ? page.id : null
}

export function FoldersArea({
  folders,
  navigation,
  announce,
}: FoldersAreaProps) {
  const [page, setPage] = useState<FoldersAreaPage>({
    kind: 'overview',
    focus: HEADING_FOCUS,
  })
  const addressedId = addressedFolderId(page)
  const addressedFolder =
    addressedId === null ? null : folderById(folders.folders, addressedId)
  const addressedFolderVanished =
    addressedId !== null && addressedFolder === null
  const lastKnownName = useRef('')

  useEffect(() => {
    if (addressedFolder !== null) lastKnownName.current = addressedFolder.name
  }, [addressedFolder])

  useEffect(() => {
    if (!addressedFolderVanished) return
    announce(folderDeletedElsewhereAnnouncement(lastKnownName.current))
  }, [addressedFolderVanished, announce])

  function showOverview(focus: FoldersOverviewFocus = HEADING_FOCUS) {
    setPage({ kind: 'overview', focus })
  }

  function showFolder(id: FolderId) {
    setPage({ kind: 'folder', id })
  }

  function createFolder(draftName: string) {
    const name = createFolderName(draftName)
    const id = folders.addFolder(name)
    showOverview({ kind: 'arrivingFolder', id })
    announce(folderCreatedAnnouncement(name))
  }

  function renameFolder(folder: Folder, draftName: string) {
    const name = createFolderName(draftName)
    folders.renameFolder(folder.id, name)
    showFolder(folder.id)
    announce(folderSavedAnnouncement(name))
  }

  function deleteFolder(folder: Folder) {
    showOverview({
      kind: 'followingFolder',
      removedAt: folders.folders.indexOf(folder),
      removedId: folder.id,
    })
    folders.removeFolder(folder.id)
    announce(folderDeletedAnnouncement(folder.name))
  }

  if (page.kind === 'create')
    return (
      <FolderFormPage
        heading="Ordner anlegen"
        name={page.draftName}
        onNameChange={(draftName) => setPage({ kind: 'create', draftName })}
        onSave={() => createFolder(page.draftName)}
        onBack={() => showOverview()}
        announce={announce}
      />
    )

  if (addressedFolder !== null && page.kind === 'folder')
    return (
      <FolderPage
        navigation={navigation}
        folder={addressedFolder}
        onBack={() => showOverview()}
        onEdit={() =>
          setPage({
            kind: 'edit',
            id: addressedFolder.id,
            draftName: addressedFolder.name,
          })
        }
      />
    )

  if (addressedFolder !== null && page.kind === 'edit')
    return (
      <FolderFormPage
        heading="Ordner bearbeiten"
        name={page.draftName}
        onNameChange={(draftName) => setPage({ ...page, draftName })}
        onSave={() => renameFolder(addressedFolder, page.draftName)}
        onBack={() => showFolder(addressedFolder.id)}
        onDelete={() => setPage({ ...page, kind: 'confirmDeletion' })}
        announce={announce}
      />
    )

  if (addressedFolder !== null && page.kind === 'confirmDeletion')
    return (
      <ConfirmationPage
        heading={folderDeletionHeading(addressedFolder.name)}
        explanation={FOLDER_DELETION_EXPLANATION}
        confirmLabel="Löschen"
        onConfirm={() => deleteFolder(addressedFolder)}
        onCancel={() => setPage({ ...page, kind: 'edit' })}
      />
    )

  return (
    <FoldersPage
      navigation={navigation}
      folders={folders.folders}
      focus={page.kind === 'overview' ? page.focus : HEADING_FOCUS}
      onCreateFolder={() => setPage({ kind: 'create', draftName: '' })}
      onOpenFolder={(folder) => showFolder(folder.id)}
    />
  )
}
