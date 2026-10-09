import { BackIcon } from './BackIcon'
import { BottomBar } from './BottomBar'
import { useHeadingFocus } from './useHeadingFocus'

type ConfirmationPageProps = {
  heading: string
  explanation: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
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
      <button type="button" className="backButton" onClick={onCancel}>
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
        <button type="button" onClick={onCancel}>
          Abbrechen
        </button>
      </BottomBar>
    </main>
  )
}
