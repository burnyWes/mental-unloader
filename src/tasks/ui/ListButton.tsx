import type { Ref } from 'react'
import { openTaskSummaryLabel } from '../domain/announcements'
import type { List } from '../domain/list'
import type { OpenTaskSummary } from '../domain/organizer'
import { FlameIcon } from './FlameIcon'

type ListButtonProps = {
  list: List
  summary: OpenTaskSummary
  onOpen: (list: List) => void
  ref?: Ref<HTMLButtonElement>
}

export function ListButton({ list, summary, onOpen, ref }: ListButtonProps) {
  const hasOpenTasks = summary.open > 0

  return (
    <button
      type="button"
      className="listButton"
      ref={ref}
      onClick={() => onOpen(list)}
    >
      <span className="listButtonFrame">
        <span className="listButtonFace">
          <span className="listButtonTitle">
            {list.name}
            {hasOpenTasks && (
              <span className="visuallyHidden">
                , {openTaskSummaryLabel(summary)}
              </span>
            )}
          </span>
          {hasOpenTasks && (
            <span className="listButtonCount" aria-hidden="true">
              {summary.open} offen
              {summary.urgent > 0 && (
                <>
                  , <FlameIcon /> {summary.urgent}
                </>
              )}
            </span>
          )}
        </span>
      </span>
    </button>
  )
}
