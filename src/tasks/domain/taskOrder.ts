import { hasCompletions, isOpen, lastCompletion, type Task } from './task'

function urgencyRank(task: Task): number {
  switch (task.due.kind) {
    case 'urgent':
      return 0
    case 'deadline':
      return 1
    case 'someday':
      return 2
  }
}

function sortDayOf(task: Task): string {
  switch (task.due.kind) {
    case 'urgent':
      return task.due.since
    case 'deadline':
      return task.due.deadline
    case 'someday':
      return ''
  }
}

function byUrgencyThenAge(one: Task, other: Task): number {
  return (
    urgencyRank(one) - urgencyRank(other) ||
    sortDayOf(one).localeCompare(sortDayOf(other)) ||
    one.createdAt - other.createdAt ||
    one.id.localeCompare(other.id)
  )
}

function byLatestCompletion(one: Task, other: Task): number {
  return (
    (lastCompletion(other) ?? 0) - (lastCompletion(one) ?? 0) ||
    one.id.localeCompare(other.id)
  )
}

export function openTasksInOrder(tasks: readonly Task[]): readonly Task[] {
  return tasks.filter(isOpen).sort(byUrgencyThenAge)
}

export function completedTasksInOrder(tasks: readonly Task[]): readonly Task[] {
  return tasks.filter(hasCompletions).sort(byLatestCompletion)
}
