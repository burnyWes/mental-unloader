import { BackIcon } from '../../shared/ui/BackIcon'
import { BottomBar } from '../../shared/ui/BottomBar'
import { CheckIcon } from '../../shared/ui/CheckIcon'
import { PencilIcon } from '../../shared/ui/PencilIcon'
import { ReopenIcon } from '../../shared/ui/ReopenIcon'
import { TrashIcon } from '../../shared/ui/TrashIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { URGENCY_LEAD_LABELS } from '../domain/announcements'
import {
  fullDayOf,
  spokenDateOf,
  type CalendarDay,
} from '../domain/calendarDay'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import { lastCompletion, type Task } from '../domain/task'
import { isOverdueOn } from '../domain/urgency'
import { CalendarIcon } from './CalendarIcon'
import { CoffeeIcon } from './CoffeeIcon'
import { FlameIcon } from './FlameIcon'

type TaskPageProps = {
  task: Task
  list: List
  folder: Folder
  today: CalendarDay
  onBack: () => void
  onComplete: () => void
  onReopen: () => void
  onEdit: () => void
  onDelete: () => void
}

function DueFact({ task, today }: { task: Task; today: CalendarDay }) {
  switch (task.due.kind) {
    case 'urgent':
      return (
        <>
          <FlameIcon /> Dringend
        </>
      )
    case 'deadline':
      return (
        <>
          <CalendarIcon /> Stichtag {fullDayOf(task.due.deadline)}
          {isOverdueOn(task, today) && (
            <span className="overdue">, überfällig</span>
          )}
        </>
      )
    case 'someday':
      return (
        <>
          <CoffeeIcon /> Irgendwann
        </>
      )
  }
}

export function TaskPage({
  task,
  list,
  folder,
  today,
  onBack,
  onComplete,
  onReopen,
  onEdit,
  onDelete,
}: TaskPageProps) {
  const heading = useHeadingFocus()
  const completedAt = lastCompletion(task)

  return (
    <main className="page">
      <button type="button" className="backButton" onClick={onBack}>
        <BackIcon /> Zurück
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {task.name}
      </h1>
      {task.description !== '' && (
        <p className="taskDescription">{task.description}</p>
      )}
      <dl className="taskFacts">
        <dt>Fälligkeit</dt>
        <dd>
          <DueFact task={task} today={today} />
        </dd>
        {task.due.kind === 'deadline' && (
          <>
            <dt>Dringend ab</dt>
            <dd>{URGENCY_LEAD_LABELS[task.due.urgentFrom]}</dd>
          </>
        )}
        <dt>Liste</dt>
        <dd>
          <span aria-hidden="true">
            {folder.name} › {list.name}
          </span>
          <span className="visuallyHidden">
            {folder.name}, {list.name}
          </span>
        </dd>
        {completedAt !== null && (
          <>
            <dt>Erledigt</dt>
            <dd>{spokenDateOf(completedAt)}</dd>
          </>
        )}
      </dl>
      <BottomBar>
        <button
          type="button"
          aria-label={completedAt === null ? 'Erledigen' : 'Wieder öffnen'}
          onClick={completedAt === null ? onComplete : onReopen}
        >
          {completedAt === null ? <CheckIcon /> : <ReopenIcon />}
        </button>
        <button type="button" aria-label="Bearbeiten" onClick={onEdit}>
          <PencilIcon />
        </button>
        <button type="button" aria-label="Löschen" onClick={onDelete}>
          <TrashIcon />
        </button>
      </BottomBar>
    </main>
  )
}
