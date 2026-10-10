import type { TaskFilterKind } from './foldersAreaPage'

const FILTER_LABELS: readonly { kind: TaskFilterKind; label: string }[] = [
  { kind: 'open', label: 'offen' },
  { kind: 'completed', label: 'erledigt' },
]

type TaskFilterButtonsProps = {
  chosen: TaskFilterKind
  counts: Record<TaskFilterKind, number>
  onChoose: (filter: TaskFilterKind) => void
}

export function TaskFilterButtons({
  chosen,
  counts,
  onChoose,
}: TaskFilterButtonsProps) {
  return (
    <div role="group" aria-label="Filter" className="taskFilter">
      {FILTER_LABELS.map(({ kind, label }) => (
        <button
          key={kind}
          type="button"
          aria-pressed={chosen === kind}
          onClick={() => onChoose(kind)}
        >
          {label} ({counts[kind]})
        </button>
      ))}
    </div>
  )
}
