import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ConfirmationPage } from '../../shared/ui/ConfirmationPage'
import {
  folderCreatedAnnouncement,
  folderDeletedAnnouncement,
  folderDeletedElsewhereAnnouncement,
  folderDeletionExplanation,
  folderDeletionHeading,
  folderSavedAnnouncement,
  LIST_DELETION_EXPLANATION,
  listCreatedAnnouncement,
  listDeletedAnnouncement,
  listDeletedElsewhereAnnouncement,
  listDeletionHeading,
  listMovedAnnouncement,
  listSavedAnnouncement,
} from '../domain/announcements'
import type { Folder, FolderId } from '../domain/folder'
import type { List } from '../domain/list'
import { createName } from '../domain/name'
import { listCountOfFolder, listsOfFolder } from '../domain/organizer'
import { FolderPage } from './FolderPage'
import { FolderSelect } from './FolderSelect'
import {
  FOLDER_HEADING_FOCUS,
  OVERVIEW_HEADING_FOCUS,
  resolveFoldersAreaPage,
  type FolderPageFocus,
  type FoldersAreaPage,
  type ShownFoldersAreaPage,
} from './foldersAreaPage'
import { FoldersPage, type FoldersOverviewFocus } from './FoldersPage'
import { ListPage } from './ListPage'
import { NameFormPage } from './NameFormPage'
import type { OrganizerState } from './useOrganizer'

type ShownListDraftPage = Extract<
  ShownFoldersAreaPage,
  { kind: 'editList' | 'confirmListDeletion' }
>

type FoldersAreaProps = {
  organizer: OrganizerState
  navigation: ReactNode
  announce: (text: string) => void
}

export function FoldersArea({
  organizer,
  navigation,
  announce,
}: FoldersAreaProps) {
  const [page, setPage] = useState<FoldersAreaPage>({
    kind: 'overview',
    focus: OVERVIEW_HEADING_FOCUS,
  })
  const { shown, vanished } = resolveFoldersAreaPage(page, organizer)
  const shownFolder = 'folder' in shown ? shown.folder : null
  const shownList = 'list' in shown ? shown.list : null
  const lastKnownFolderName = useRef('')
  const lastKnownListName = useRef('')

  useEffect(() => {
    if (shownFolder !== null) lastKnownFolderName.current = shownFolder.name
  }, [shownFolder])

  useEffect(() => {
    if (shownList !== null) lastKnownListName.current = shownList.name
  }, [shownList])

  useEffect(() => {
    if (vanished === 'folder')
      announce(folderDeletedElsewhereAnnouncement(lastKnownFolderName.current))
    if (vanished === 'list')
      announce(listDeletedElsewhereAnnouncement(lastKnownListName.current))
  }, [vanished, announce])

  function showOverview(focus: FoldersOverviewFocus = OVERVIEW_HEADING_FOCUS) {
    setPage({ kind: 'overview', focus })
  }

  function showFolder(
    id: FolderId,
    focus: FolderPageFocus = FOLDER_HEADING_FOCUS,
  ) {
    setPage({ kind: 'folder', id, focus })
  }

  function showList(list: List, folderId: FolderId = list.folderId) {
    setPage({ kind: 'list', id: list.id, folderId })
  }

  function showListDraft(
    kind: 'editList' | 'confirmListDeletion',
    shownDraft: ShownListDraftPage,
    changes: { draftName?: string; draftFolderId?: FolderId } = {},
  ) {
    setPage({
      kind,
      id: shownDraft.list.id,
      folderId: shownDraft.list.folderId,
      draftName: shownDraft.draftName,
      draftFolderId: shownDraft.draftFolderId,
      ...changes,
    })
  }

  function createFolder(draftName: string) {
    const name = createName(draftName)
    const id = organizer.addFolder(name)
    showOverview({ kind: 'arrivingFolder', id })
    announce(folderCreatedAnnouncement(name))
  }

  function renameFolder(folder: Folder, draftName: string) {
    const name = createName(draftName)
    organizer.renameFolder(folder.id, name)
    showFolder(folder.id)
    announce(folderSavedAnnouncement(name))
  }

  function deleteFolder(folder: Folder) {
    showOverview({
      kind: 'followingFolder',
      removedAt: organizer.folders.indexOf(folder),
      removedId: folder.id,
    })
    organizer.removeFolder(
      folder.id,
      listsOfFolder(organizer, folder.id).map((list) => list.id),
    )
    announce(folderDeletedAnnouncement(folder.name))
  }

  function createList(folder: Folder, draftName: string) {
    const name = createName(draftName)
    const id = organizer.addList(folder.id, name)
    showFolder(folder.id, { kind: 'arrivingList', id })
    announce(listCreatedAnnouncement(name))
  }

  function saveList(shownDraft: ShownListDraftPage) {
    const name = createName(shownDraft.draftName)
    const { list, folder, targetFolder } = shownDraft
    organizer.changeList(list.id, name, targetFolder.id)
    showList(list, targetFolder.id)
    announce(
      targetFolder.id === folder.id
        ? listSavedAnnouncement(name)
        : listMovedAnnouncement(name, targetFolder.name),
    )
  }

  function deleteList(list: List) {
    showFolder(list.folderId, {
      kind: 'followingList',
      removedAt: listsOfFolder(organizer, list.folderId).indexOf(list),
      removedId: list.id,
    })
    organizer.removeList(list.id)
    announce(listDeletedAnnouncement(list.name))
  }

  switch (shown.kind) {
    case 'create':
      return (
        <NameFormPage
          heading="Ordner anlegen"
          name={shown.draftName}
          onNameChange={(draftName) => setPage({ kind: 'create', draftName })}
          onSave={() => createFolder(shown.draftName)}
          onBack={() => showOverview()}
          announce={announce}
        />
      )

    case 'folder':
      return (
        <FolderPage
          navigation={navigation}
          folder={shown.folder}
          lists={listsOfFolder(organizer, shown.folder.id)}
          focus={shown.focus}
          onBack={() => showOverview()}
          onEdit={() =>
            setPage({
              kind: 'edit',
              id: shown.folder.id,
              draftName: shown.folder.name,
            })
          }
          onCreateList={() =>
            setPage({
              kind: 'createList',
              folderId: shown.folder.id,
              draftName: '',
            })
          }
          onOpenList={showList}
        />
      )

    case 'edit':
      return (
        <NameFormPage
          heading="Ordner bearbeiten"
          name={shown.draftName}
          onNameChange={(draftName) =>
            setPage({ kind: 'edit', id: shown.folder.id, draftName })
          }
          onSave={() => renameFolder(shown.folder, shown.draftName)}
          onBack={() => showFolder(shown.folder.id)}
          onDelete={() =>
            setPage({
              kind: 'confirmDeletion',
              id: shown.folder.id,
              draftName: shown.draftName,
            })
          }
          announce={announce}
        />
      )

    case 'confirmDeletion': {
      const listCount = listCountOfFolder(organizer, shown.folder.id)
      return (
        <ConfirmationPage
          heading={folderDeletionHeading(shown.folder.name, listCount)}
          explanation={folderDeletionExplanation(listCount)}
          confirmLabel="Löschen"
          onConfirm={() => deleteFolder(shown.folder)}
          onCancel={() =>
            setPage({
              kind: 'edit',
              id: shown.folder.id,
              draftName: shown.draftName,
            })
          }
        />
      )
    }

    case 'createList':
      return (
        <NameFormPage
          heading="Liste anlegen"
          name={shown.draftName}
          onNameChange={(draftName) =>
            setPage({
              kind: 'createList',
              folderId: shown.folder.id,
              draftName,
            })
          }
          onSave={() => createList(shown.folder, shown.draftName)}
          onBack={() => showFolder(shown.folder.id)}
          announce={announce}
        />
      )

    case 'list':
      return (
        <ListPage
          navigation={navigation}
          list={shown.list}
          onBack={() => showFolder(shown.folder.id)}
          onEdit={() =>
            setPage({
              kind: 'editList',
              id: shown.list.id,
              folderId: shown.list.folderId,
              draftName: shown.list.name,
              draftFolderId: null,
            })
          }
        />
      )

    case 'editList':
      return (
        <NameFormPage
          heading="Liste bearbeiten"
          name={shown.draftName}
          onNameChange={(draftName) =>
            showListDraft('editList', shown, { draftName })
          }
          onSave={() => saveList(shown)}
          onBack={() => showList(shown.list)}
          onDelete={() => showListDraft('confirmListDeletion', shown)}
          announce={announce}
        >
          <FolderSelect
            folders={organizer.folders}
            value={shown.targetFolder.id}
            onChange={(draftFolderId) =>
              showListDraft('editList', shown, { draftFolderId })
            }
          />
        </NameFormPage>
      )

    case 'confirmListDeletion':
      return (
        <ConfirmationPage
          heading={listDeletionHeading(shown.list.name)}
          explanation={LIST_DELETION_EXPLANATION}
          confirmLabel="Löschen"
          onConfirm={() => deleteList(shown.list)}
          onCancel={() => showListDraft('editList', shown)}
        />
      )

    case 'overview':
      return (
        <FoldersPage
          navigation={navigation}
          folders={organizer.folders}
          listCount={(folderId) => listCountOfFolder(organizer, folderId)}
          focus={shown.focus}
          onCreateFolder={() => setPage({ kind: 'create', draftName: '' })}
          onOpenFolder={(folder) => showFolder(folder.id)}
        />
      )
  }
}
