import { folderById, type Folder, type FolderId } from '../domain/folder'
import { listById, type List, type ListId } from '../domain/list'
import { folderOfList, type Organizer } from '../domain/organizer'
import type { FoldersOverviewFocus } from './FoldersPage'

export type FolderPageFocus =
  | { kind: 'heading' }
  | { kind: 'arrivingList'; id: ListId }
  | { kind: 'followingList'; removedAt: number; removedId: ListId }

type ListDraft = {
  id: ListId
  folderId: FolderId
  draftName: string
  draftFolderId: FolderId | null
}

export type FoldersAreaPage =
  | { kind: 'overview'; focus: FoldersOverviewFocus }
  | { kind: 'create'; draftName: string }
  | { kind: 'folder'; id: FolderId; focus: FolderPageFocus }
  | { kind: 'edit'; id: FolderId; draftName: string }
  | { kind: 'confirmDeletion'; id: FolderId; draftName: string }
  | { kind: 'createList'; folderId: FolderId; draftName: string }
  | { kind: 'list'; id: ListId; folderId: FolderId }
  | ({ kind: 'editList' } & ListDraft)
  | ({ kind: 'confirmListDeletion' } & ListDraft)

type ShownListDraft = {
  list: List
  folder: Folder
  draftName: string
  draftFolderId: FolderId | null
  targetFolder: Folder
}

export type ShownFoldersAreaPage =
  | { kind: 'overview'; focus: FoldersOverviewFocus }
  | { kind: 'create'; draftName: string }
  | { kind: 'folder'; folder: Folder; focus: FolderPageFocus }
  | { kind: 'edit'; folder: Folder; draftName: string }
  | { kind: 'confirmDeletion'; folder: Folder; draftName: string }
  | { kind: 'createList'; folder: Folder; draftName: string }
  | { kind: 'list'; list: List; folder: Folder }
  | ({ kind: 'editList' } & ShownListDraft)
  | ({ kind: 'confirmListDeletion' } & ShownListDraft)

export type VanishedElsewhere = 'folder' | 'list' | null

export type ResolvedFoldersAreaPage = {
  shown: ShownFoldersAreaPage
  vanished: VanishedElsewhere
}

export const OVERVIEW_HEADING_FOCUS: FoldersOverviewFocus = { kind: 'heading' }

export const FOLDER_HEADING_FOCUS: FolderPageFocus = { kind: 'heading' }

const OVERVIEW_AFTER_FOLDER_VANISHED: ResolvedFoldersAreaPage = {
  shown: { kind: 'overview', focus: OVERVIEW_HEADING_FOCUS },
  vanished: 'folder',
}

function shownWithFolder(
  folder: Folder | null,
  show: (folder: Folder) => ShownFoldersAreaPage,
): ResolvedFoldersAreaPage {
  if (folder === null) return OVERVIEW_AFTER_FOLDER_VANISHED
  return { shown: show(folder), vanished: null }
}

function folderPageAfterListVanished(
  organizer: Organizer,
  lastKnownFolderId: FolderId,
): ResolvedFoldersAreaPage {
  const folder = folderById(organizer.folders, lastKnownFolderId)
  if (folder === null) return OVERVIEW_AFTER_FOLDER_VANISHED
  return {
    shown: { kind: 'folder', folder, focus: FOLDER_HEADING_FOCUS },
    vanished: 'list',
  }
}

function shownWithList(
  organizer: Organizer,
  id: ListId,
  lastKnownFolderId: FolderId,
  show: (list: List, folder: Folder) => ShownFoldersAreaPage,
): ResolvedFoldersAreaPage {
  const list = listById(organizer.lists, id)
  if (list === null)
    return folderPageAfterListVanished(organizer, lastKnownFolderId)
  return shownWithFolder(folderOfList(organizer, list), (folder) =>
    show(list, folder),
  )
}

function shownListDraft(
  organizer: Organizer,
  draft: ListDraft,
  list: List,
  folder: Folder,
): ShownListDraft {
  const chosenFolder =
    draft.draftFolderId === null
      ? null
      : folderById(organizer.folders, draft.draftFolderId)
  return {
    list,
    folder,
    draftName: draft.draftName,
    draftFolderId: chosenFolder?.id ?? null,
    targetFolder: chosenFolder ?? folder,
  }
}

export function resolveFoldersAreaPage(
  page: FoldersAreaPage,
  organizer: Organizer,
): ResolvedFoldersAreaPage {
  switch (page.kind) {
    case 'overview':
    case 'create':
      return { shown: page, vanished: null }
    case 'folder':
    case 'edit':
    case 'confirmDeletion':
      return shownWithFolder(
        folderById(organizer.folders, page.id),
        (folder) => ({ ...page, folder }),
      )
    case 'createList':
      return shownWithFolder(
        folderById(organizer.folders, page.folderId),
        (folder) => ({ ...page, folder }),
      )
    case 'list':
      return shownWithList(
        organizer,
        page.id,
        page.folderId,
        (list, folder) => ({ kind: 'list', list, folder }),
      )
    case 'editList':
    case 'confirmListDeletion':
      return shownWithList(
        organizer,
        page.id,
        page.folderId,
        (list, folder) => ({
          kind: page.kind,
          ...shownListDraft(organizer, page, list, folder),
        }),
      )
  }
}
