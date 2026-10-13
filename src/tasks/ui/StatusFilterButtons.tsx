import type { StatusFilter } from './foldersAreaPage'

const FILTER_LABELS: readonly { kind: StatusFilter; label: string }[] = [
  { kind: 'open', label: 'offen' },
  { kind: 'completed', label: 'erledigt' },
]

type StatusFilterButtonsProps = {
  chosen: StatusFilter
  counts: Record<StatusFilter, number>
  onChoose: (filter: StatusFilter) => void
}

export function StatusFilterButtons({
  chosen,
  counts,
  onChoose,
}: StatusFilterButtonsProps) {
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
