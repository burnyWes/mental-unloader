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

export type TaskOrigin = {
  folderName: string
  listName: string
}

type TaskRowProps = {
  task: Task
  today: CalendarDay
  origin?: TaskOrigin
  onOpen: (task: Task) => void
  onComplete?: (task: Task) => void
  openButton?: Ref<HTMLButtonElement>
  completeButton?: Ref<HTMLButtonElement>
}

function SeparatorBeforeOrigin({ origin }: { origin?: TaskOrigin }) {
  if (origin === undefined) return null
  return <span className="visuallyHidden">,</span>
}

function UrgentTaskName({
  name,
  origin,
}: {
  name: string
  origin?: TaskOrigin
}) {
  return (
    <>
      <span className="taskRowTitle">
        {name}
        <span className="visuallyHidden">,</span>
      </span>{' '}
      <span className="taskRowDetail">
        <FlameIcon /> dringend
        <SeparatorBeforeOrigin origin={origin} />
      </span>
    </>
  )
}

function DeadlineTaskName({
  task,
  deadline,
  today,
  origin,
}: {
  task: Task
  deadline: CalendarDay
  today: CalendarDay
  origin?: TaskOrigin
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
          <SeparatorBeforeOrigin origin={origin} />
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
        <SeparatorBeforeOrigin origin={origin} />
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

function OpenTaskName({
  task,
  today,
  origin,
}: {
  task: Task
  today: CalendarDay
  origin?: TaskOrigin
}) {
  switch (task.due.kind) {
    case 'urgent':
      return <UrgentTaskName name={task.name} origin={origin} />
    case 'deadline':
      return (
        <DeadlineTaskName
          task={task}
          deadline={task.due.deadline}
          today={today}
          origin={origin}
        />
      )
    case 'someday':
      return (
        <span className="taskRowTitle">
          {task.name}
          <SeparatorBeforeOrigin origin={origin} />
        </span>
      )
  }
}

function CompletedTaskName({
  completedAt,
  task,
  origin,
}: {
  completedAt: number
  task: Task
  origin?: TaskOrigin
}) {
  return (
    <>
      <span className="taskRowTitle">
        {task.name}
        <span className="visuallyHidden">
          , {completedOnLabel(completedAt)}
        </span>
        <SeparatorBeforeOrigin origin={origin} />
      </span>{' '}
      <span className="taskRowDetail" aria-hidden="true">
        erledigt {shortDateOf(completedAt)}
      </span>
    </>
  )
}

function TaskOriginLine({ folderName, listName }: TaskOrigin) {
  return (
    <span className="taskRowOrigin">
      {folderName}
      <span aria-hidden="true"> ›</span>
      <span className="visuallyHidden">,</span> {listName}
    </span>
  )
}

export function TaskRow({
  task,
  today,
  origin,
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
          <OpenTaskName task={task} today={today} origin={origin} />
        ) : (
          <CompletedTaskName
            completedAt={completedAt}
            task={task}
            origin={origin}
          />
        )}
        {origin !== undefined && (
          <>
            {' '}
            <TaskOriginLine {...origin} />
          </>
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
