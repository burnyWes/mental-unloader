import type { PointerEvent, ReactNode } from 'react'
import { SpinButton, type SpinStep } from '../../shared/ui/SpinButton'
import {
  daysInMonth,
  EARLIEST_YEAR,
  LATEST_YEAR,
  monthNameOf,
  MONTHS_PER_YEAR,
  partsOf,
  stepDayOfMonth,
  stepMonth,
  stepYear,
  type CalendarDay,
} from '../domain/calendarDay'

function keepFocusWhereItIs(event: PointerEvent<HTMLButtonElement>) {
  event.preventDefault()
}

type DeadlineFieldProps = {
  labelId: string
  label: string
  value: number
  minimum: number
  maximum: number
  valueText?: string
  onStep: (step: SpinStep) => void
  children: ReactNode
}

function DeadlineField({
  labelId,
  label,
  value,
  minimum,
  maximum,
  valueText,
  onStep,
  children,
}: DeadlineFieldProps) {
  return (
    <div className="deadlineField">
      <button
        type="button"
        className="stepButton"
        aria-hidden="true"
        tabIndex={-1}
        onPointerDown={keepFocusWhereItIs}
        onClick={() => onStep(1)}
      >
        ▲
      </button>
      <SpinButton
        labelledBy={labelId}
        value={value}
        minimum={minimum}
        maximum={maximum}
        valueText={valueText}
        onStep={onStep}
      >
        {children}
      </SpinButton>
      <button
        type="button"
        className="stepButton"
        aria-hidden="true"
        tabIndex={-1}
        onPointerDown={keepFocusWhereItIs}
        onClick={() => onStep(-1)}
      >
        ▼
      </button>
      <span id={labelId}>{label}</span>
    </div>
  )
}

type DeadlineStepperProps = {
  deadline: CalendarDay
  onChange: (deadline: CalendarDay) => void
}

export function DeadlineStepper({ deadline, onChange }: DeadlineStepperProps) {
  const { year, month, day } = partsOf(deadline)
  const monthName = monthNameOf(month)

  return (
    <fieldset className="field deadlineStepper">
      <legend>Stichtag</legend>
      <div className="deadlineFields">
        <DeadlineField
          labelId="deadlineDayLabel"
          label="Tag"
          value={day}
          minimum={1}
          maximum={daysInMonth(year, month)}
          onStep={(step) => onChange(stepDayOfMonth(deadline, step))}
        >
          {day}
        </DeadlineField>
        <DeadlineField
          labelId="deadlineMonthLabel"
          label="Monat"
          value={month}
          minimum={1}
          maximum={MONTHS_PER_YEAR}
          valueText={monthName}
          onStep={(step) => onChange(stepMonth(deadline, step))}
        >
          {monthName}
        </DeadlineField>
        <DeadlineField
          labelId="deadlineYearLabel"
          label="Jahr"
          value={year}
          minimum={EARLIEST_YEAR}
          maximum={LATEST_YEAR}
          onStep={(step) => onChange(stepYear(deadline, step))}
        >
          {year}
        </DeadlineField>
      </div>
    </fieldset>
  )
}
