import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import {
  folderOfList,
  listOfTask,
  type Organizer,
  type UrgentTask,
} from '../domain/organizer'
import { isRecurring, taskById, type Task, type TaskId } from '../domain/task'
import type { ListPageFocus, TaskFlowEntry } from './foldersAreaPage'
import type { TaskFlowLeaveReason } from './TaskFlow'

export type UrgentPageFocus = Exclude<ListPageFocus, { kind: 'arrivingTask' }>

export type UrgentAreaPage =
  | { kind: 'overview'; focus: UrgentPageFocus }
  | { kind: 'task'; id: TaskId; entry: TaskFlowEntry; openedAt: number }

export type ShownUrgentAreaPage =
  | { kind: 'overview'; focus: UrgentPageFocus }
  | {
      kind: 'task'
      task: Task
      list: List
      folder: Folder
      entry: TaskFlowEntry
      openedAt: number
    }

export type ResolvedUrgentAreaPage = {
  shown: ShownUrgentAreaPage
  vanished: boolean
}

export type UrgentPageReturn = {
  focus: UrgentPageFocus
  noLongerUrgent: boolean
}

export const URGENT_HEADING_FOCUS: UrgentPageFocus = { kind: 'heading' }

const OVERVIEW_AFTER_TASK_VANISHED: ResolvedUrgentAreaPage = {
  shown: { kind: 'overview', focus: URGENT_HEADING_FOCUS },
  vanished: true,
}

export function resolveUrgentAreaPage(
  page: UrgentAreaPage,
  organizer: Organizer,
): ResolvedUrgentAreaPage {
  if (page.kind === 'overview') return { shown: page, vanished: false }
  const task = taskById(organizer.tasks, page.id)
  if (task === null) return OVERVIEW_AFTER_TASK_VANISHED
  const list = listOfTask(organizer, task)
  if (list === null) return OVERVIEW_AFTER_TASK_VANISHED
  const folder = folderOfList(organizer, list)
  if (folder === null) return OVERVIEW_AFTER_TASK_VANISHED
  return {
    shown: {
      kind: 'task',
      task,
      list,
      folder,
      entry: page.entry,
      openedAt: page.openedAt,
    },
    vanished: false,
  }
}

function followingTask(task: Task, removedAt: number): UrgentPageFocus {
  return { kind: 'followingTask', removedAt, removedId: task.id }
}

export function focusAfterLeaving(
  task: Task,
  urgentTasks: readonly UrgentTask[],
  openedAt: number,
  reason: TaskFlowLeaveReason,
): UrgentPageReturn {
  const currentPlace = urgentTasks.findIndex((each) => each.task.id === task.id)
  const stillShown = currentPlace !== -1
  switch (reason) {
    case 'back':
    case 'cancelled':
      if (!stillShown)
        return {
          focus: followingTask(task, openedAt),
          noLongerUrgent: true,
        }
      return {
        focus: {
          kind: 'returningTask',
          id: task.id,
          button: reason === 'back' ? 'open' : 'complete',
        },
        noLongerUrgent: false,
      }
    case 'completed':
      if (isRecurring(task))
        return {
          focus: {
            kind: 'followingPlace',
            at: stillShown ? currentPlace : openedAt,
            completedId: task.id,
          },
          noLongerUrgent: false,
        }
      return {
        focus: followingTask(task, stillShown ? currentPlace : openedAt),
        noLongerUrgent: false,
      }
    case 'deleted':
      return {
        focus: followingTask(task, stillShown ? currentPlace : openedAt),
        noLongerUrgent: false,
      }
  }
}
