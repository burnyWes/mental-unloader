import type { ReactNode } from 'react'
import { BackIcon } from '../../shared/ui/BackIcon'
import { PencilIcon } from '../../shared/ui/PencilIcon'
import { PlusIcon } from '../../shared/ui/PlusIcon'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { CalendarDay } from '../domain/calendarDay'
import type { List } from '../domain/list'
import type { Task, TaskId } from '../domain/task'
import {
  tasksShownIn,
  type ListPageFocus,
  type TaskFilterKind,
} from './foldersAreaPage'
import { TaskFilterButtons } from './TaskFilterButtons'
import { TaskRow } from './TaskRow'
import { useTaskRowFocus, withoutRemovedTask } from './useTaskRowFocus'

const EMPTY_FILTER_TEXTS: Record<TaskFilterKind, string> = {
  open: 'Keine offenen Aufgaben.',
  completed: 'Noch nichts erledigt.',
}

function idOf(task: Task): TaskId {
  return task.id
}

type ListPageProps = {
  navigation: ReactNode
  list: List
  tasks: readonly Task[]
  today: CalendarDay
  filter: TaskFilterKind
  focus: ListPageFocus
  onBack: () => void
  onEdit: () => void
  onFilter: (filter: TaskFilterKind) => void
  onCreateTask: () => void
  onOpenTask: (task: Task) => void
  onCompleteTask: (task: Task) => void
}

export function ListPage({
  navigation,
  list,
  tasks,
  today,
  filter,
  focus,
  onBack,
  onEdit,
  onFilter,
  onCreateTask,
  onOpenTask,
  onCompleteTask,
}: ListPageProps) {
  const heading = useHeadingFocus()

  function rowsOf(kind: TaskFilterKind): readonly Task[] {
    const shown = tasksShownIn(kind, tasks)
    return kind === filter ? withoutRemovedTask(shown, focus, idOf) : shown
  }

  const counts: Record<TaskFilterKind, number> = {
    open: rowsOf('open').length,
    completed: rowsOf('completed').length,
  }
  const rows = rowsOf(filter)
  const { openButton, completeButton } = useTaskRowFocus(
    rows.map(idOf),
    focus,
    heading,
  )

  function emptyText(): string {
    if (counts.open + counts.completed === 0) return 'Noch keine Aufgaben.'
    return EMPTY_FILTER_TEXTS[filter]
  }

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <button type="button" className="backButton" onClick={onBack}>
          <BackIcon /> Zurück
        </button>
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            {list.name}
          </h1>
          <div className="pageHeaderButtons">
            <button
              type="button"
              className="headerButton"
              aria-label="Liste bearbeiten"
              onClick={onEdit}
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              className="headerButton"
              aria-label="Aufgabe anlegen"
              onClick={onCreateTask}
            >
              <PlusIcon />
            </button>
          </div>
        </div>
        <TaskFilterButtons
          chosen={filter}
          counts={counts}
          onChoose={onFilter}
        />
        {rows.length === 0 ? (
          <p>{emptyText()}</p>
        ) : (
          <ul className="folderList">
            {rows.map((task) => (
              <li key={task.id}>
                <TaskRow
                  task={task}
                  shownAs={filter}
                  today={today}
                  onOpen={onOpenTask}
                  onComplete={filter === 'open' ? onCompleteTask : undefined}
                  openButton={openButton(task.id)}
                  completeButton={completeButton(task.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
