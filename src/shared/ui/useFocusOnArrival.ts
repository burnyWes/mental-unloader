import { useEffect, useRef, type RefObject } from 'react'

export function useFocusOnArrival<Key>(
  awaited: Key | null,
  heading: RefObject<HTMLElement | null>,
) {
  const elements = useRef(new Map<Key, HTMLElement>())
  const awaitedKey = useRef(awaited)

  function focusIsStillUnclaimed() {
    const focused = document.activeElement
    return focused === heading.current || focused === document.body
  }

  useEffect(() => {
    const key = awaitedKey.current
    if (key === null) return
    const arrived = elements.current.get(key)
    if (arrived === undefined) return
    awaitedKey.current = null
    if (focusIsStillUnclaimed()) arrived.focus()
  })

  function keepArrival(key: Key) {
    return (element: HTMLElement | null) => {
      if (element === null) {
        elements.current.delete(key)
      } else {
        elements.current.set(key, element)
      }
    }
  }

  return { keepArrival }
}
