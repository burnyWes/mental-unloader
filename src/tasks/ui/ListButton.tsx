import type { Ref } from 'react'
import type { List } from '../domain/list'

type ListButtonProps = {
  list: List
  onOpen: (list: List) => void
  ref?: Ref<HTMLButtonElement>
}

export function ListButton({ list, onOpen, ref }: ListButtonProps) {
  return (
    <button
      type="button"
      className="listButton"
      ref={ref}
      onClick={() => onOpen(list)}
    >
      <span className="listButtonFrame">
        <span className="listButtonFace">{list.name}</span>
      </span>
    </button>
  )
}
