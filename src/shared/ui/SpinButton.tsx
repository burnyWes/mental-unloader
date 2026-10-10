import type { KeyboardEvent, ReactNode } from 'react'

export type SpinStep = 1 | -1

const STEP_OF_KEY: Partial<Record<string, SpinStep>> = {
  ArrowUp: 1,
  ArrowDown: -1,
}

type SpinButtonProps = {
  labelledBy: string
  value: number
  minimum: number
  maximum: number
  valueText?: string
  onStep: (step: SpinStep) => void
  children: ReactNode
}

export function SpinButton({
  labelledBy,
  value,
  minimum,
  maximum,
  valueText,
  onStep,
  children,
}: SpinButtonProps) {
  function stepOnArrowKey(event: KeyboardEvent<HTMLDivElement>) {
    const step = STEP_OF_KEY[event.key]
    if (step === undefined) return
    event.preventDefault()
    onStep(step)
  }

  return (
    <div
      role="spinbutton"
      className="spinButton"
      tabIndex={0}
      aria-labelledby={labelledBy}
      aria-valuenow={value}
      aria-valuemin={minimum}
      aria-valuemax={maximum}
      aria-valuetext={valueText}
      onKeyDown={stepOnArrowKey}
    >
      {children}
    </div>
  )
}
