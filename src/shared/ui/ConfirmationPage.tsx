import type { SoundEffect } from '../sound/soundEffects'
import { BackIcon } from './BackIcon'
import { BottomBar } from './BottomBar'
import { useHeadingFocus } from './useHeadingFocus'

export type CancelSound = Extract<SoundEffect, 'refuse' | 'pageTurn'>

type ConfirmationPageProps = {
  heading: string
  explanation: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: (sound: CancelSound) => void
}

export function ConfirmationPage({
  heading,
  explanation,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmationPageProps) {
  const headingRef = useHeadingFocus()

  return (
    <main className="page">
      <button
        type="button"
        className="backButton"
        onClick={() => onCancel('pageTurn')}
      >
        <BackIcon /> Zurück
      </button>
      <h1 ref={headingRef} tabIndex={-1}>
        {heading}
      </h1>
      <p>{explanation}</p>
      <BottomBar>
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" onClick={() => onCancel('refuse')}>
          Abbrechen
        </button>
      </BottomBar>
    </main>
  )
}
