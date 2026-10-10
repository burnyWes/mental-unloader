import { useEffect, useState } from 'react'
import { calendarDayOf, type CalendarDay } from '../domain/calendarDay'

export function millisecondsUntilNextMidnight(moment: Date): number {
  const nextMidnight = new Date(
    moment.getFullYear(),
    moment.getMonth(),
    moment.getDate() + 1,
  )
  return nextMidnight.getTime() - moment.getTime()
}

export function useToday(now: () => Date): CalendarDay {
  const [today, setToday] = useState(() => calendarDayOf(now()))

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>

    function refresh() {
      setToday(calendarDayOf(now()))
    }

    function refreshAtNextMidnight() {
      midnightTimer = setTimeout(() => {
        refresh()
        refreshAtNextMidnight()
      }, millisecondsUntilNextMidnight(now()))
    }

    function refreshOnceVisible() {
      if (document.visibilityState === 'visible') refresh()
    }

    refreshAtNextMidnight()
    document.addEventListener('visibilitychange', refreshOnceVisible)
    window.addEventListener('pageshow', refresh)
    return () => {
      clearTimeout(midnightTimer)
      document.removeEventListener('visibilitychange', refreshOnceVisible)
      window.removeEventListener('pageshow', refresh)
    }
  }, [now])

  return today
}
