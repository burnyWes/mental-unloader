import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  taskDeletedElsewhereAnnouncement,
  taskNoLongerUrgentAnnouncement,
} from '../domain/announcements'
import type { CalendarDay } from '../domain/calendarDay'
import type { UrgentTask } from '../domain/organizer'
import type { Task } from '../domain/task'
import type { TaskFlowEntry } from './foldersAreaPage'
import { TaskFlow, type TaskFlowLeaveReason } from './TaskFlow'
import {
  focusAfterLeaving,
  resolveUrgentAreaPage,
  URGENT_HEADING_FOCUS,
  type ShownUrgentAreaPage,
  type UrgentAreaPage,
} from './urgentAreaPage'
import { UrgentPage } from './UrgentPage'
import type { OrganizerState } from './useOrganizer'

type ShownTaskPage = Extract<ShownUrgentAreaPage, { kind: 'task' }>

type UrgentAreaProps = {
  organizer: OrganizerState
  urgentTasks: readonly UrgentTask[]
  navigation: ReactNode
  announce: (text: string) => void
  today: CalendarDay
  now: () => Date
}

export function UrgentArea({
  organizer,
  urgentTasks,
  navigation,
  announce,
  today,
  now,
}: UrgentAreaProps) {
  const [page, setPage] = useState<UrgentAreaPage>({
    kind: 'overview',
    focus: URGENT_HEADING_FOCUS,
  })
  const { shown, vanished } = resolveUrgentAreaPage(page, organizer)
  const shownTask = shown.kind === 'task' ? shown.task : null
  const lastKnownTaskName = useRef('')

  useEffect(() => {
    if (shownTask !== null) lastKnownTaskName.current = shownTask.name
  }, [shownTask])

  useEffect(() => {
    if (vanished)
      announce(taskDeletedElsewhereAnnouncement(lastKnownTaskName.current))
  }, [vanished, announce])

  function openTask(task: Task, entry: TaskFlowEntry) {
    setPage({
      kind: 'task',
      id: task.id,
      entry,
      openedAt: urgentTasks.findIndex((each) => each.task.id === task.id),
    })
  }

  function leaveTask(shownPage: ShownTaskPage, reason: TaskFlowLeaveReason) {
    const { focus, noLongerUrgent } = focusAfterLeaving(
      shownPage.task,
      urgentTasks,
      shownPage.openedAt,
      reason,
    )
    setPage({ kind: 'overview', focus })
    if (noLongerUrgent)
      announce(taskNoLongerUrgentAnnouncement(shownPage.task.name))
  }

  if (shown.kind === 'task')
    return (
      <TaskFlow
        key={shown.task.id}
        task={shown.task}
        list={shown.list}
        folder={shown.folder}
        organizer={organizer}
        today={today}
        now={now}
        entry={shown.entry}
        announce={announce}
        onLeave={(reason) => leaveTask(shown, reason)}
      />
    )

  return (
    <UrgentPage
      navigation={navigation}
      urgentTasks={urgentTasks}
      today={today}
      focus={shown.focus}
      onOpenTask={(task) => openTask(task, 'overview')}
      onCompleteTask={(task) => openTask(task, 'completion')}
    />
  )
}
