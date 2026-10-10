import type { ReactNode } from 'react'

export type AreaBadge = {
  count: number
  label: string
}

export type Area<Id extends string> = {
  id: Id
  label: string
  icon: ReactNode
  badge?: AreaBadge
}

const MAXIMUM_SHOWN_BADGE_COUNT = 99

function shownCount(count: number): string {
  return count > MAXIMUM_SHOWN_BADGE_COUNT
    ? `${MAXIMUM_SHOWN_BADGE_COUNT}+`
    : String(count)
}

function countedBadge(area: Area<string>): AreaBadge | null {
  if (area.badge === undefined || area.badge.count === 0) return null
  return area.badge
}

type NavigationBarProps<Id extends string> = {
  areas: readonly Area<Id>[]
  activeArea: Id
  onSelectArea: (area: Id) => void
}

export function NavigationBar<Id extends string>({
  areas,
  activeArea,
  onSelectArea,
}: NavigationBarProps<Id>) {
  return (
    <nav aria-label="Bereiche" className="navigationBar">
      <ul>
        {areas.map((area) => {
          const badge = countedBadge(area)
          return (
            <li key={area.id}>
              <button
                type="button"
                aria-current={area.id === activeArea ? 'page' : undefined}
                aria-label={badge?.label ?? area.label}
                onClick={() => onSelectArea(area.id)}
              >
                {area.icon}
                {badge !== null && (
                  <span className="navigationBadge" aria-hidden="true">
                    {shownCount(badge.count)}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
