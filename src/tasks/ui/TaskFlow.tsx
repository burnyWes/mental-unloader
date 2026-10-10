import { useEffect, useState } from 'react'
import { ConfirmationPage } from '../../shared/ui/ConfirmationPage'
import {
  TASK_COMPLETION_EXPLANATION,
  TASK_DELETION_EXPLANATION,
  taskAlreadyCompletedAnnouncement,
  taskCompletedAnnouncement,
  taskCompletionHeading,
  taskDeletedAnnouncement,
  taskDeletionHeading,
  taskMovedAnnouncement,
  taskReopenedAnnouncement,
  taskSavedAnnouncement,
} from '../domain/announcements'
import { calendarDayOf } from '../domain/calendarDay'
import type { List } from '../domain/list'
import { createName } from '../domain/name'
import { createDescription, dueAfterChange, type Task } from '../domain/task'
import type { TaskDraft, TaskFlowEntry } from './foldersAreaPage'
import { TaskFormPage } from './TaskFormPage'
import {
  OVERVIEW_STEP,
  resolveTaskFlowStep,
  type CompletionAskedFrom,
  type ShownTask,
  type ShownTaskFlowStep,
  type TaskFlowStep,
} from './taskFlowStep'
import { TaskListSelect } from './TaskListSelect'
import { TaskPage } from './TaskPage'
import type { OrganizerState } from './useOrganizer'

export type TaskFlowLeaveReason = 'back' | 'cancelled' | 'completed' | 'deleted'

type ShownEditStep = Extract<ShownTaskFlowStep, { kind: 'edit' }>

function draftOf(task: Task): TaskDraft {
  return {
    name: task.name,
    description: task.description,
    dueKind: task.due.kind,
  }
}

function firstStep(entry: TaskFlowEntry): TaskFlowStep {
  return entry === 'completion'
    ? { kind: 'confirmCompletion', from: 'row' }
    : OVERVIEW_STEP
}

type TaskFlowProps = ShownTask & {
  organizer: OrganizerState
  now: () => Date
  entry: TaskFlowEntry
  announce: (text: string) => void
  onLeave: (reason: TaskFlowLeaveReason) => void
  onMoved: (list: List) => void
}

export function TaskFlow({
  task,
  list,
  folder,
  organizer,
  now,
  entry,
  announce,
  onLeave,
  onMoved,
}: TaskFlowProps) {
  const [step, setStep] = useState<TaskFlowStep>(() => firstStep(entry))
  const shownStep = resolveTaskFlowStep(step, { task, list, folder }, organizer)
  const alreadyCompleted =
    shownStep.kind === 'overview' && shownStep.alreadyCompleted

  useEffect(() => {
    if (alreadyCompleted) announce(taskAlreadyCompletedAnnouncement(task.name))
  }, [alreadyCompleted, announce, task.name])

  function save({ draft, targetList, targetFolder }: ShownEditStep) {
    const name = createName(draft.name)
    const description = createDescription(draft.description)
    const due = dueAfterChange(task.due, draft.dueKind, calendarDayOf(now()))
    organizer.changeTask(task.id, { name, description, due }, targetList.id)
    setStep(OVERVIEW_STEP)
    if (targetList.id === list.id) {
      announce(taskSavedAnnouncement(name))
      return
    }
    onMoved(targetList)
    announce(taskMovedAnnouncement(name, targetFolder.name, targetList.name))
  }

  function complete() {
    onLeave('completed')
    organizer.completeTask(task.id, now().getTime())
    announce(taskCompletedAnnouncement(task.name))
  }

  function cancelCompletion(from: CompletionAskedFrom) {
    if (from === 'row') onLeave('cancelled')
    else setStep(OVERVIEW_STEP)
  }

  function reopen() {
    setStep(OVERVIEW_STEP)
    organizer.reopenTask(task.id)
    announce(taskReopenedAnnouncement(task.name))
  }

  function remove() {
    onLeave('deleted')
    organizer.removeTask(task.id)
    announce(taskDeletedAnnouncement(task.name))
  }

  switch (shownStep.kind) {
    case 'overview':
      return (
        <TaskPage
          task={task}
          list={list}
          folder={folder}
          onBack={() => onLeave('back')}
          onComplete={() =>
            setStep({ kind: 'confirmCompletion', from: 'overview' })
          }
          onReopen={reopen}
          onEdit={() =>
            setStep({ kind: 'edit', draft: draftOf(task), draftListId: null })
          }
          onDelete={() => setStep({ kind: 'confirmDeletion' })}
        />
      )

    case 'edit':
      return (
        <TaskFormPage
          heading="Aufgabe bearbeiten"
          draft={shownStep.draft}
          onDraftChange={(draft) =>
            setStep({
              kind: 'edit',
              draft,
              draftListId: shownStep.draftListId,
            })
          }
          onSave={() => save(shownStep)}
          onBack={() => setStep(OVERVIEW_STEP)}
          announce={announce}
        >
          <TaskListSelect
            organizer={organizer}
            value={shownStep.targetList.id}
            onChange={(draftListId) =>
              setStep({ kind: 'edit', draft: shownStep.draft, draftListId })
            }
          />
        </TaskFormPage>
      )

    case 'confirmCompletion':
      return (
        <ConfirmationPage
          heading={taskCompletionHeading(task.name)}
          explanation={TASK_COMPLETION_EXPLANATION}
          confirmLabel="Erledigen"
          onConfirm={complete}
          onCancel={() => cancelCompletion(shownStep.from)}
        />
      )

    case 'confirmDeletion':
      return (
        <ConfirmationPage
          heading={taskDeletionHeading(task.name)}
          explanation={TASK_DELETION_EXPLANATION}
          confirmLabel="Löschen"
          onConfirm={remove}
          onCancel={() => setStep(OVERVIEW_STEP)}
        />
      )
  }
}
