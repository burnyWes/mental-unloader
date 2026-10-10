import type { RefObject } from 'react'
import { useFocusAfterRemoval } from '../../shared/ui/useFocusAfterRemoval'
import { useFocusOnArrival } from '../../shared/ui/useFocusOnArrival'
import type { TaskId } from '../domain/task'
import type { ListPageFocus } from './foldersAreaPage'

function openButtonKey(id: TaskId) {
  return `${id}:open`
}

function completeButtonKey(id: TaskId) {
  return `${id}:complete`
}

function awaitedButton(focus: ListPageFocus): string | null {
  switch (focus.kind) {
    case 'arrivingTask':
      return openButtonKey(focus.id)
    case 'returningTask':
      return focus.button === 'open'
        ? openButtonKey(focus.id)
        : completeButtonKey(focus.id)
    case 'heading':
    case 'followingTask':
      return null
  }
}

export function withoutRemovedTask<Row>(
  rows: readonly Row[],
  focus: ListPageFocus,
  taskIdOf: (row: Row) => TaskId,
): readonly Row[] {
  if (focus.kind !== 'followingTask') return rows
  return rows.filter((row) => taskIdOf(row) !== focus.removedId)
}

export function useTaskRowFocus(
  shownTaskIds: readonly TaskId[],
  focus: ListPageFocus,
  heading: RefObject<HTMLHeadingElement | null>,
) {
  const { keepRow } = useFocusAfterRemoval(
    shownTaskIds,
    heading,
    focus.kind === 'followingTask' ? focus.removedAt : null,
  )
  const { keepArrival } = useFocusOnArrival<string>(
    awaitedButton(focus),
    heading,
  )

  function openButton(id: TaskId) {
    const keepForRemoval = keepRow(id)
    const keepForArrival = keepArrival(openButtonKey(id))
    return (button: HTMLButtonElement | null) => {
      keepForRemoval(button)
      keepForArrival(button)
    }
  }

  function completeButton(id: TaskId) {
    return keepArrival(completeButtonKey(id))
  }

  return { openButton, completeButton }
}
