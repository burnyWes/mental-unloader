import { isCompleted, lastCompletion, type Task } from './task'

function urgencyRank(task: Task): number {
  return task.due.kind === 'urgent' ? 0 : 1
}

function urgentSince(task: Task): string {
  return task.due.kind === 'urgent' ? task.due.since : ''
}

function byUrgencyThenAge(one: Task, other: Task): number {
  return (
    urgencyRank(one) - urgencyRank(other) ||
    urgentSince(one).localeCompare(urgentSince(other)) ||
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
  return tasks.filter((task) => !isCompleted(task)).sort(byUrgencyThenAge)
}

export function completedTasksInOrder(tasks: readonly Task[]): readonly Task[] {
  return tasks.filter(isCompleted).sort(byLatestCompletion)
}
