import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { CalendarDay } from '../domain/calendarDay'
import type { UrgentTask } from '../domain/organizer'
import type { Task, TaskId } from '../domain/task'
import { TaskRow } from './TaskRow'
import type { UrgentPageFocus } from './urgentAreaPage'
import { useTaskRowFocus, withoutRemovedTask } from './useTaskRowFocus'

function taskIdOf({ task }: UrgentTask): TaskId {
  return task.id
}

type UrgentPageProps = {
  navigation: ReactNode
  urgentTasks: readonly UrgentTask[]
  today: CalendarDay
  focus: UrgentPageFocus
  onOpenTask: (task: Task) => void
  onCompleteTask: (task: Task) => void
}

export function UrgentPage({
  navigation,
  urgentTasks,
  today,
  focus,
  onOpenTask,
  onCompleteTask,
}: UrgentPageProps) {
  const heading = useHeadingFocus()
  const rows = withoutRemovedTask(urgentTasks, focus, taskIdOf)
  const { openButton, completeButton } = useTaskRowFocus(
    rows.map(taskIdOf),
    focus,
    heading,
  )

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            Dringend
          </h1>
        </div>
        {rows.length === 0 ? (
          <p>Nichts Dringendes.</p>
        ) : (
          <ul className="folderList">
            {rows.map(({ task, list, folder }) => (
              <li key={task.id}>
                <TaskRow
                  task={task}
                  shownAs="open"
                  today={today}
                  origin={{ folderName: folder.name, listName: list.name }}
                  onOpen={onOpenTask}
                  onComplete={onCompleteTask}
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
