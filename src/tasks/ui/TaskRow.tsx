import type { Ref } from 'react'
import { CheckIcon } from '../../shared/ui/CheckIcon'
import { completedOnLabel } from '../domain/announcements'
import { shortDateOf } from '../domain/calendarDay'
import { lastCompletion, type Task } from '../domain/task'
import { FlameIcon } from './FlameIcon'

type TaskRowProps = {
  task: Task
  onOpen: (task: Task) => void
  onComplete?: (task: Task) => void
  openButton?: Ref<HTMLButtonElement>
  completeButton?: Ref<HTMLButtonElement>
}

function OpenTaskName({ task }: { task: Task }) {
  if (task.due.kind !== 'urgent')
    return <span className="taskRowTitle">{task.name}</span>
  return (
    <>
      <span className="taskRowTitle">
        {task.name}
        <span className="visuallyHidden">,</span>
      </span>{' '}
      <span className="taskRowDetail">
        <FlameIcon /> dringend
      </span>
    </>
  )
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
          <OpenTaskName task={task} />
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
