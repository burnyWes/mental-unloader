import { addDays, subtractMonths, type CalendarDay } from './calendarDay'
import type { Task, UrgencyLead } from './task'

const DAYS_PER_WEEK = 7

export function urgencyStartOf(
  deadline: CalendarDay,
  urgentFrom: UrgencyLead,
): CalendarDay | null {
  switch (urgentFrom) {
    case 'immediately':
      return null
    case 'onDeadline':
      return deadline
    case 'oneDay':
      return addDays(deadline, -1)
    case 'oneWeek':
      return addDays(deadline, -DAYS_PER_WEEK)
    case 'oneMonth':
      return subtractMonths(deadline, 1)
    case 'oneQuarter':
      return subtractMonths(deadline, 3)
    case 'halfYear':
      return subtractMonths(deadline, 6)
    case 'oneYear':
      return subtractMonths(deadline, 12)
  }
}

export function isUrgentOn(task: Task, today: CalendarDay): boolean {
  switch (task.due.kind) {
    case 'urgent':
      return true
    case 'deadline': {
      const start = urgencyStartOf(task.due.deadline, task.due.urgentFrom)
      return start === null || start <= today
    }
    case 'someday':
      return false
  }
}

export function isOverdueOn(task: Task, today: CalendarDay): boolean {
  return task.due.kind === 'deadline' && task.due.deadline < today
}
