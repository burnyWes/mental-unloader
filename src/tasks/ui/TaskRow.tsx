import type { Ref } from 'react'
import { CheckIcon } from '../../shared/ui/CheckIcon'
import {
  completedOnLabel,
  deadlineLabel,
  overdueLabel,
} from '../domain/announcements'
import {
  shortDateOf,
  shortDayOf,
  type CalendarDay,
} from '../domain/calendarDay'
import { lastCompletion, type Task } from '../domain/task'
import { isOverdueOn, isUrgentOn } from '../domain/urgency'
import { CalendarIcon } from './CalendarIcon'
import { FlameIcon } from './FlameIcon'

type TaskRowProps = {
  task: Task
  today: CalendarDay
  onOpen: (task: Task) => void
  onComplete?: (task: Task) => void
  openButton?: Ref<HTMLButtonElement>
  completeButton?: Ref<HTMLButtonElement>
}

function UrgentTaskName({ name }: { name: string }) {
  return (
    <>
      <span className="taskRowTitle">
        {name}
        <span className="visuallyHidden">,</span>
      </span>{' '}
      <span className="taskRowDetail">
        <FlameIcon /> dringend
      </span>
    </>
  )
}

function DeadlineTaskName({
  task,
  deadline,
  today,
}: {
  task: Task
  deadline: CalendarDay
  today: CalendarDay
}) {
  const shortDay = shortDayOf(deadline, today)
  if (isOverdueOn(task, today))
    return (
      <>
        <span className="taskRowTitle">
          {task.name}
          <span className="visuallyHidden">
            , {overdueLabel(deadline, today)}
          </span>
        </span>{' '}
        <span className="taskRowDetail overdue" aria-hidden="true">
          <CalendarIcon /> {shortDay} überfällig
        </span>
      </>
    )
  const urgent = isUrgentOn(task, today)
  return (
    <>
      <span className="taskRowTitle">
        {task.name}
        <span className="visuallyHidden">
          , {deadlineLabel(deadline, today)}
          {urgent && ', dringend'}
        </span>
      </span>{' '}
      <span className="taskRowDetail" aria-hidden="true">
        <CalendarIcon /> {shortDay}
        {urgent && (
          <>
            {' '}
            <FlameIcon />
          </>
        )}
      </span>
    </>
  )
}

function OpenTaskName({ task, today }: { task: Task; today: CalendarDay }) {
  switch (task.due.kind) {
    case 'urgent':
      return <UrgentTaskName name={task.name} />
    case 'deadline':
      return (
        <DeadlineTaskName
          task={task}
          deadline={task.due.deadline}
          today={today}
        />
      )
    case 'someday':
      return <span className="taskRowTitle">{task.name}</span>
  }
}

function CompletedTaskName({
  completedAt,
  task,
}: {
  completedAt: number
  task: Task
}) {
  return (
    <>
      <span className="taskRowTitle">
        {task.name}
        <span className="visuallyHidden">
          , {completedOnLabel(completedAt)}
        </span>
      </span>{' '}
      <span className="taskRowDetail" aria-hidden="true">
        erledigt {shortDateOf(completedAt)}
      </span>
    </>
  )
}

export function TaskRow({
  task,
  today,
  onOpen,
  onComplete,
  openButton,
  completeButton,
}: TaskRowProps) {
  const completedAt = lastCompletion(task)

  return (
    <div className="taskRow">
      <button
        type="button"
        className="taskRowName"
        ref={openButton}
        onClick={() => onOpen(task)}
      >
        {completedAt === null ? (
          <OpenTaskName task={task} today={today} />
        ) : (
          <CompletedTaskName completedAt={completedAt} task={task} />
        )}
      </button>
      {onComplete !== undefined && (
        <button
          type="button"
          className="taskRowComplete"
          aria-label={`${task.name} erledigen`}
          ref={completeButton}
          onClick={() => onComplete(task)}
        >
          <CheckIcon />
        </button>
      )}
    </div>
  )
}
