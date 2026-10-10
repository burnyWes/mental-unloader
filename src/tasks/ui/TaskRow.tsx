import type { Ref } from 'react'
import { CheckIcon } from '../../shared/ui/CheckIcon'
import {
  completedOnLabel,
  deadlineLabel,
  overdueLabel,
  recurringCompletedLabel,
  REPEAT_RHYTHM_LABELS,
  shortCompletionCountOf,
} from '../domain/announcements'
import {
  shortDateOf,
  shortDayOf,
  type CalendarDay,
} from '../domain/calendarDay'
import type { Repetition } from '../domain/repetition'
import {
  isRecurring,
  lastCompletion,
  repetitionOf,
  type Task,
} from '../domain/task'
import { isOverdueOn, isUrgentOn } from '../domain/urgency'
import { CalendarIcon } from './CalendarIcon'
import { FlameIcon } from './FlameIcon'
import type { TaskFilterKind } from './foldersAreaPage'
import { RepeatIcon } from './RepeatIcon'

export type TaskOrigin = {
  folderName: string
  listName: string
}

type TaskRowProps = {
  task: Task
  shownAs: TaskFilterKind
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

function SpokenRhythm({ repetition }: { repetition: Repetition | null }) {
  if (repetition === null) return null
  return <>, {REPEAT_RHYTHM_LABELS[repetition.rhythm]}</>
}

function ShownRhythm({ repetition }: { repetition: Repetition | null }) {
  if (repetition === null) return null
  return (
    <>
      {' '}
      <RepeatIcon />
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
  const repetition = repetitionOf(task.due)
  if (isOverdueOn(task, today))
    return (
      <>
        <span className="taskRowTitle">
          {task.name}
          <span className="visuallyHidden">
            , {overdueLabel(deadline, today)}
            <SpokenRhythm repetition={repetition} />
          </span>
          <SeparatorBeforeOrigin origin={origin} />
        </span>{' '}
        <span className="taskRowDetail overdue" aria-hidden="true">
          <CalendarIcon /> {shortDay}
          <ShownRhythm repetition={repetition} /> überfällig
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
          <SpokenRhythm repetition={repetition} />
          {urgent && ', dringend'}
        </span>
        <SeparatorBeforeOrigin origin={origin} />
      </span>{' '}
      <span className="taskRowDetail" aria-hidden="true">
        <CalendarIcon /> {shortDay}
        <ShownRhythm repetition={repetition} />
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

function RecurringCompletedTaskName({
  completedAt,
  task,
  origin,
}: {
  completedAt: number
  task: Task
  origin?: TaskOrigin
}) {
  const count = task.completions.length
  return (
    <>
      <span className="taskRowTitle">
        {task.name}
        <span className="visuallyHidden">
          , {recurringCompletedLabel(count, completedAt)}
        </span>
        <SeparatorBeforeOrigin origin={origin} />
      </span>{' '}
      <span className="taskRowDetail" aria-hidden="true">
        {shortCompletionCountOf(count)}, zuletzt {shortDateOf(completedAt)}
      </span>
    </>
  )
}

function ShownTaskName({
  task,
  shownAs,
  today,
  origin,
}: {
  task: Task
  shownAs: TaskFilterKind
  today: CalendarDay
  origin?: TaskOrigin
}) {
  const completedAt = lastCompletion(task)
  if (shownAs === 'open' || completedAt === null)
    return <OpenTaskName task={task} today={today} origin={origin} />
  if (isRecurring(task))
    return (
      <RecurringCompletedTaskName
        completedAt={completedAt}
        task={task}
        origin={origin}
      />
    )
  return (
    <CompletedTaskName completedAt={completedAt} task={task} origin={origin} />
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
  shownAs,
  today,
  origin,
  onOpen,
  onComplete,
  openButton,
  completeButton,
}: TaskRowProps) {
  return (
    <div className="taskRow">
      <button
        type="button"
        className="taskRowName"
        ref={openButton}
        onClick={() => onOpen(task)}
      >
        <ShownTaskName
          task={task}
          shownAs={shownAs}
          today={today}
          origin={origin}
        />
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
