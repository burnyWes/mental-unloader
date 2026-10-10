import { addDays, type CalendarDay } from './calendarDay'
import type { ListId } from './list'
import {
  isAnchoredOn,
  nextDeadlineAfter,
  repetitionStartingOn,
  type RepeatRhythm,
  type Repetition,
} from './repetition'

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
  | {
      kind: 'deadline'
      deadline: CalendarDay
      urgentFrom: UrgencyLead
      repetition: Repetition | null
    }
  | { kind: 'someday' }

export type DueChoice = {
  kind: DueKind
  deadline: CalendarDay
  urgentFrom: UrgencyLead
  repeats: boolean
  rhythm: RepeatRhythm
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

export function repetitionOf(due: Due): Repetition | null {
  return due.kind === 'deadline' ? due.repetition : null
}

function keptAnchorDay(
  previous: Due | null,
  deadline: CalendarDay,
): number | null {
  if (previous?.kind !== 'deadline' || previous.deadline !== deadline)
    return null
  const previousRepetition = repetitionOf(previous)
  if (previousRepetition === null) return null
  if (!isAnchoredOn(deadline, previousRepetition.anchorDay)) return null
  return previousRepetition.anchorDay
}

function repetitionAfterChange(
  previous: Due | null,
  chosen: DueChoice,
): Repetition | null {
  if (!chosen.repeats) return null
  const anchorDay = keptAnchorDay(previous, chosen.deadline)
  if (anchorDay === null)
    return repetitionStartingOn(chosen.deadline, chosen.rhythm)
  return { rhythm: chosen.rhythm, anchorDay }
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
        repetition: repetitionAfterChange(previous, chosen),
      }
    case 'urgent':
      if (previous?.kind === 'urgent') return previous
      return { kind: 'urgent', since: today }
  }
}

export function isRecurring(task: Task): boolean {
  return repetitionOf(task.due) !== null
}

export function hasCompletions(task: Task): boolean {
  return task.completions.length > 0
}

export function isOpen(task: Task): boolean {
  return isRecurring(task) || !hasCompletions(task)
}

export function lastCompletion(task: Task): number | null {
  if (!hasCompletions(task)) return null
  return Math.max(...task.completions)
}

export function completionsNewestFirst(task: Task): readonly number[] {
  return [...task.completions].sort((one, other) => other - one)
}

export function nextDeadlineOf(
  task: Task,
  today: CalendarDay,
): CalendarDay | null {
  if (task.due.kind !== 'deadline' || task.due.repetition === null) return null
  return nextDeadlineAfter(task.due.deadline, task.due.repetition, today)
}

export function endsRepetition(previous: Due, next: Due): boolean {
  return repetitionOf(previous) !== null && repetitionOf(next) === null
}

export function taskById(tasks: readonly Task[], id: TaskId): Task | null {
  return tasks.find((task) => task.id === id) ?? null
}
