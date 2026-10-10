import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ConfirmationPage } from '../../shared/ui/ConfirmationPage'
import {
  folderCreatedAnnouncement,
  folderDeletedAnnouncement,
  folderDeletedElsewhereAnnouncement,
  folderDeletionExplanation,
  folderDeletionHeading,
  folderSavedAnnouncement,
  listCreatedAnnouncement,
  listDeletedAnnouncement,
  listDeletedElsewhereAnnouncement,
  listDeletionExplanation,
  listDeletionHeading,
  listMovedAnnouncement,
  listSavedAnnouncement,
  taskCreatedAnnouncement,
  taskDeletedElsewhereAnnouncement,
} from '../domain/announcements'
import type { CalendarDay } from '../domain/calendarDay'
import type { Folder, FolderId } from '../domain/folder'
import type { List } from '../domain/list'
import { createName } from '../domain/name'
import {
  listCountOfFolder,
  listsOfFolder,
  openTaskSummaryOfList,
  taskCountOfList,
  tasksOfFolder,
  tasksOfList,
} from '../domain/organizer'
import {
  createDescription,
  dueAfterChange,
  isRecurring,
  type Task,
} from '../domain/task'
import { FolderPage } from './FolderPage'
import { FolderSelect } from './FolderSelect'
import {
  dueChoiceOf,
  emptyTaskDraft,
  filterOf,
  FOLDER_HEADING_FOCUS,
  tasksShownIn,
  LIST_HEADING_FOCUS,
  OVERVIEW_HEADING_FOCUS,
  resolveFoldersAreaPage,
  type FolderPageFocus,
  type FoldersAreaPage,
  type ListPageFocus,
  type ShownFoldersAreaPage,
  type TaskFilterKind,
  type TaskFlowEntry,
} from './foldersAreaPage'
import { FoldersPage, type FoldersOverviewFocus } from './FoldersPage'
import { ListPage } from './ListPage'
import { NameFormPage } from './NameFormPage'
import { TaskFlow, type TaskFlowLeaveReason } from './TaskFlow'
import { TaskFormPage } from './TaskFormPage'
import type { OrganizerState } from './useOrganizer'

type ShownListDraftPage = Extract<
  ShownFoldersAreaPage,
  { kind: 'editList' | 'confirmListDeletion' }
>

type ShownCreateTaskPage = Extract<ShownFoldersAreaPage, { kind: 'createTask' }>

type ShownListPage = Extract<ShownFoldersAreaPage, { kind: 'list' }>

type ShownTaskPage = Extract<ShownFoldersAreaPage, { kind: 'task' }>

function idsOf(identified: readonly { id: string }[]): readonly string[] {
  return identified.map((each) => each.id)
}

type FoldersAreaProps = {
  organizer: OrganizerState
  navigation: ReactNode
  announce: (text: string) => void
  today: CalendarDay
  now: () => Date
}

export function FoldersArea({
  organizer,
  navigation,
  announce,
  today,
  now,
}: FoldersAreaProps) {
  const [page, setPage] = useState<FoldersAreaPage>({
    kind: 'overview',
    focus: OVERVIEW_HEADING_FOCUS,
  })
  const { shown, vanished } = resolveFoldersAreaPage(page, organizer)
  const shownFolder = 'folder' in shown ? shown.folder : null
  const shownList = 'list' in shown ? shown.list : null
  const shownTask = 'task' in shown ? shown.task : null
  const lastKnownFolderName = useRef('')
  const lastKnownListName = useRef('')
  const lastKnownTaskName = useRef('')

  useEffect(() => {
    if (shownFolder !== null) lastKnownFolderName.current = shownFolder.name
  }, [shownFolder])

  useEffect(() => {
    if (shownList !== null) lastKnownListName.current = shownList.name
  }, [shownList])

  useEffect(() => {
    if (shownTask !== null) lastKnownTaskName.current = shownTask.name
  }, [shownTask])

  useEffect(() => {
    if (vanished === 'folder')
      announce(folderDeletedElsewhereAnnouncement(lastKnownFolderName.current))
    if (vanished === 'list')
      announce(listDeletedElsewhereAnnouncement(lastKnownListName.current))
    if (vanished === 'task')
      announce(taskDeletedElsewhereAnnouncement(lastKnownTaskName.current))
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

  function showList(
    list: List,
    folderId: FolderId = list.folderId,
    filter: TaskFilterKind = 'open',
    focus: ListPageFocus = LIST_HEADING_FOCUS,
  ) {
    setPage({ kind: 'list', id: list.id, folderId, filter, focus })
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
      idsOf(listsOfFolder(organizer, folder.id)),
      idsOf(tasksOfFolder(organizer, folder.id)),
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
    organizer.removeList(list.id, idsOf(tasksOfList(organizer, list.id)))
    announce(listDeletedAnnouncement(list.name))
  }

  function createTask(shownPage: ShownCreateTaskPage) {
    const { list, folder, draft } = shownPage
    const name = createName(draft.name)
    const id = organizer.addTask({
      listId: list.id,
      name,
      description: createDescription(draft.description),
      due: dueAfterChange(null, dueChoiceOf(draft), today),
      createdAt: now().getTime(),
    })
    showList(list, folder.id, 'open', { kind: 'arrivingTask', id })
    announce(taskCreatedAnnouncement(name))
  }

  function openTask(
    shownPage: ShownListPage,
    task: Task,
    entry: TaskFlowEntry,
  ) {
    setPage({
      kind: 'task',
      id: task.id,
      listId: shownPage.list.id,
      folderId: shownPage.folder.id,
      filter: shownPage.filter,
      entry,
    })
  }

  function followingTask(task: Task, filter: TaskFilterKind): ListPageFocus {
    const shownTasks = tasksShownIn(filter, tasksOfList(organizer, task.listId))
    return {
      kind: 'followingTask',
      removedAt: shownTasks.findIndex((each) => each.id === task.id),
      removedId: task.id,
    }
  }

  function followingPlace(task: Task): ListPageFocus {
    const shownTasks = tasksShownIn('open', tasksOfList(organizer, task.listId))
    return {
      kind: 'followingPlace',
      at: shownTasks.findIndex((each) => each.id === task.id),
      completedId: task.id,
    }
  }

  function leaveCompletedRecurringTask(shownPage: ShownTaskPage) {
    const { task, list, folder, filter } = shownPage
    if (filter === 'completed') {
      showList(list, folder.id, 'completed', {
        kind: 'returningTask',
        id: task.id,
        button: 'open',
      })
      return
    }
    showList(list, folder.id, 'open', followingPlace(task))
  }

  function leaveTask(shownPage: ShownTaskPage, reason: TaskFlowLeaveReason) {
    const { task, list, folder } = shownPage
    const returnFilter = filterOf(task, shownPage.filter)
    switch (reason) {
      case 'back':
        showList(list, folder.id, returnFilter, {
          kind: 'returningTask',
          id: task.id,
          button: 'open',
        })
        return
      case 'cancelled':
        showList(list, folder.id, 'open', {
          kind: 'returningTask',
          id: task.id,
          button: 'complete',
        })
        return
      case 'completed':
        if (isRecurring(task)) {
          leaveCompletedRecurringTask(shownPage)
          return
        }
        showList(list, folder.id, 'open', followingTask(task, 'open'))
        return
      case 'deleted':
        showList(
          list,
          folder.id,
          returnFilter,
          followingTask(task, returnFilter),
        )
    }
  }

  function followMovedTask(movedTo: List) {
    setPage((current) =>
      current.kind === 'task'
        ? { ...current, listId: movedTo.id, folderId: movedTo.folderId }
        : current,
    )
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
          openTaskSummary={(listId) =>
            openTaskSummaryOfList(organizer, listId, today)
          }
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
      const taskCount = tasksOfFolder(organizer, shown.folder.id).length
      return (
        <ConfirmationPage
          heading={folderDeletionHeading(
            shown.folder.name,
            listCount,
            taskCount,
          )}
          explanation={folderDeletionExplanation(listCount, taskCount)}
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
          tasks={tasksOfList(organizer, shown.list.id)}
          today={today}
          filter={shown.filter}
          focus={shown.focus}
          onFilter={(filter) =>
            showList(shown.list, shown.folder.id, filter, LIST_HEADING_FOCUS)
          }
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
          onCreateTask={() =>
            setPage({
              kind: 'createTask',
              listId: shown.list.id,
              folderId: shown.folder.id,
              filter: shown.filter,
              draft: emptyTaskDraft(today),
            })
          }
          onOpenTask={(task) => openTask(shown, task, 'overview')}
          onCompleteTask={(task) => openTask(shown, task, 'completion')}
        />
      )

    case 'task':
      return (
        <TaskFlow
          key={shown.task.id}
          task={shown.task}
          list={shown.list}
          folder={shown.folder}
          organizer={organizer}
          today={today}
          now={now}
          entry={shown.entry}
          announce={announce}
          onLeave={(reason) => leaveTask(shown, reason)}
          onMoved={followMovedTask}
        />
      )

    case 'createTask':
      return (
        <TaskFormPage
          heading="Aufgabe anlegen"
          draft={shown.draft}
          onDraftChange={(draft) =>
            setPage({
              kind: 'createTask',
              listId: shown.list.id,
              folderId: shown.folder.id,
              filter: shown.filter,
              draft,
            })
          }
          onSave={() => createTask(shown)}
          onBack={() => showList(shown.list, shown.folder.id, shown.filter)}
          announce={announce}
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
          heading={listDeletionHeading(
            shown.list.name,
            taskCountOfList(organizer, shown.list.id),
          )}
          explanation={listDeletionExplanation(
            taskCountOfList(organizer, shown.list.id),
          )}
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
