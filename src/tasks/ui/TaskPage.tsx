import { BackIcon } from '../../shared/ui/BackIcon'
import { BottomBar } from '../../shared/ui/BottomBar'
import { CheckIcon } from '../../shared/ui/CheckIcon'
import { PencilIcon } from '../../shared/ui/PencilIcon'
import { ReopenIcon } from '../../shared/ui/ReopenIcon'
import { TrashIcon } from '../../shared/ui/TrashIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import {
  completionCountLabel,
  REPEAT_RHYTHM_LABELS,
  shortCompletionCountOf,
  URGENCY_LEAD_LABELS,
} from '../domain/announcements'
import {
  calendarDayOf,
  fullDayOf,
  spokenDateOf,
  type CalendarDay,
} from '../domain/calendarDay'
import type { Folder } from '../domain/folder'
import type { List } from '../domain/list'
import {
  completionsNewestFirst,
  isOpen,
  isRecurring,
  lastCompletion,
  type Task,
} from '../domain/task'
import { isOverdueOn } from '../domain/urgency'
import { CalendarIcon } from './CalendarIcon'
import { CoffeeIcon } from './CoffeeIcon'
import { FlameIcon } from './FlameIcon'
import { RepeatIcon } from './RepeatIcon'

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

function CompletionFacts({ task }: { task: Task }) {
  const completedAt = lastCompletion(task)
  if (completedAt === null) return null
  if (!isRecurring(task))
    return (
      <>
        <dt>Erledigt</dt>
        <dd>{spokenDateOf(completedAt)}</dd>
      </>
    )
  const count = task.completions.length
  return (
    <>
      <dt>Verlauf</dt>
      <dd>
        <span aria-hidden="true">{shortCompletionCountOf(count)}</span>
        <span className="visuallyHidden">{completionCountLabel(count)}</span>
        <ul className="completionHistory">
          {completionsNewestFirst(task).map((at, place) => (
            <li key={`${at}-${place}`}>
              {fullDayOf(calendarDayOf(new Date(at)))}
            </li>
          ))}
        </ul>
      </dd>
    </>
  )
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
  const offersCompletion = isOpen(task)

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
        {task.due.kind === 'deadline' && task.due.repetition !== null && (
          <>
            <dt>Wiederholung</dt>
            <dd>
              <RepeatIcon /> {REPEAT_RHYTHM_LABELS[task.due.repetition.rhythm]}
            </dd>
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
        <CompletionFacts task={task} />
      </dl>
      <BottomBar>
        <button
          type="button"
          aria-label={offersCompletion ? 'Erledigen' : 'Wieder öffnen'}
          onClick={offersCompletion ? onComplete : onReopen}
        >
          {offersCompletion ? <CheckIcon /> : <ReopenIcon />}
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
