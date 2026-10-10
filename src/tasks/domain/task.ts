import type { CalendarDay } from './calendarDay'
import type { ListId } from './list'

export type TaskId = string

export type DueKind = 'urgent' | 'someday'

export type Due = { kind: 'urgent'; since: CalendarDay } | { kind: 'someday' }

export type TaskContent = {
  name: string
  description: string
  due: Due
}

export type Task = TaskContent & {
  id: TaskId
  listId: ListId
  createdAt: number
  completions: readonly number[]
}

export const MAXIMUM_DESCRIPTION_LENGTH = 2000

export type InvalidDescriptionReason = 'tooLong'

export class InvalidDescription extends Error {
  reason: InvalidDescriptionReason

  constructor(reason: InvalidDescriptionReason) {
    super(reason)
    this.name = 'InvalidDescription'
    this.reason = reason
  }
}

export function createDescription(written: string): string {
  const description = written.trim()
  if (description.length > MAXIMUM_DESCRIPTION_LENGTH)
    throw new InvalidDescription('tooLong')
  return description
}

export function dueAfterChange(
  previous: Due | null,
  chosen: DueKind,
  today: CalendarDay,
): Due {
  if (chosen === 'someday') return { kind: 'someday' }
  if (previous?.kind === 'urgent') return previous
  return { kind: 'urgent', since: today }
}

export function isCompleted(task: Task): boolean {
  return task.completions.length > 0
}

export function lastCompletion(task: Task): number | null {
  if (!isCompleted(task)) return null
  return Math.max(...task.completions)
}

export function taskById(tasks: readonly Task[], id: TaskId): Task | null {
  return tasks.find((task) => task.id === id) ?? null
}
