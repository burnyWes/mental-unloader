import type { Folder } from '../domain/folder'
import { listById, type List, type ListId } from '../domain/list'
import { folderOfList, type Organizer } from '../domain/organizer'
import { isCompleted, type Task } from '../domain/task'
import type { TaskDraft } from './foldersAreaPage'

export type CompletionAskedFrom = 'overview' | 'row'

export type TaskFlowStep =
  | { kind: 'overview' }
  | { kind: 'edit'; draft: TaskDraft; draftListId: ListId | null }
  | { kind: 'confirmCompletion'; from: CompletionAskedFrom }
  | { kind: 'confirmDeletion' }

export type ShownTask = {
  task: Task
  list: List
  folder: Folder
}

export type ShownTaskFlowStep =
  | { kind: 'overview'; alreadyCompleted: boolean }
  | { kind: 'confirmCompletion'; from: CompletionAskedFrom }
  | { kind: 'confirmDeletion' }
  | {
      kind: 'edit'
      draft: TaskDraft
      draftListId: ListId | null
      targetList: List
      targetFolder: Folder
    }

export const OVERVIEW_STEP: TaskFlowStep = { kind: 'overview' }

function chosenListWithFolder(
  organizer: Organizer,
  draftListId: ListId | null,
): { list: List; folder: Folder } | null {
  if (draftListId === null) return null
  const list = listById(organizer.lists, draftListId)
  if (list === null) return null
  const folder = folderOfList(organizer, list)
  if (folder === null) return null
  return { list, folder }
}

export function resolveTaskFlowStep(
  step: TaskFlowStep,
  shown: ShownTask,
  organizer: Organizer,
): ShownTaskFlowStep {
  switch (step.kind) {
    case 'overview':
      return { kind: 'overview', alreadyCompleted: false }
    case 'confirmCompletion':
      if (isCompleted(shown.task))
        return { kind: 'overview', alreadyCompleted: true }
      return step
    case 'confirmDeletion':
      return step
    case 'edit': {
      const chosen = chosenListWithFolder(organizer, step.draftListId)
      return {
        kind: 'edit',
        draft: step.draft,
        draftListId: chosen?.list.id ?? null,
        targetList: chosen?.list ?? shown.list,
        targetFolder: chosen?.folder ?? shown.folder,
      }
    }
  }
}
