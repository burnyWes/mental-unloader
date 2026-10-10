import { addDays, type CalendarDay } from './calendarDay'
import type { ListId } from './list'

export type TaskId = string

export const URGENCY_LEADS = [
  'immediately',
  'onDeadline',
  'oneDay',
  'oneWeek',
  'oneMonth',
  'oneQuarter',
  'halfYear',
  'oneYear',
] as const

export type UrgencyLead = (typeof URGENCY_LEADS)[number]

export const DEFAULT_URGENCY_LEAD: UrgencyLead = 'oneWeek'

export function isUrgencyLead(value: unknown): value is UrgencyLead {
  return URGENCY_LEADS.some((lead) => lead === value)
}

const DAYS_UNTIL_INITIAL_DEADLINE = 7

export type DueKind = 'urgent' | 'deadline' | 'someday'

export type Due =
  | { kind: 'urgent'; since: CalendarDay }
  | { kind: 'deadline'; deadline: CalendarDay; urgentFrom: UrgencyLead }
  | { kind: 'someday' }

export type DueChoice = {
  kind: DueKind
  deadline: CalendarDay
  urgentFrom: UrgencyLead
}

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

export function initialDeadlineOf(today: CalendarDay): CalendarDay {
  return addDays(today, DAYS_UNTIL_INITIAL_DEADLINE)
}

export function dueAfterChange(
  previous: Due | null,
  chosen: DueChoice,
  today: CalendarDay,
): Due {
  switch (chosen.kind) {
    case 'someday':
      return { kind: 'someday' }
    case 'deadline':
      return {
        kind: 'deadline',
        deadline: chosen.deadline,
        urgentFrom: chosen.urgentFrom,
      }
    case 'urgent':
      if (previous?.kind === 'urgent') return previous
      return { kind: 'urgent', since: today }
  }
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
