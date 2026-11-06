import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BackIcon } from '../../shared/ui/BackIcon'
import { BottomBar } from '../../shared/ui/BottomBar'
import { usePageSlide } from '../../shared/ui/PageSlideProvider'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { TrashIcon } from '../../shared/ui/TrashIcon'
import { nameFailureMessage } from '../domain/announcements'
import { InvalidName } from '../domain/name'

type NameFormPageProps = {
  heading: string
  name: string
  onNameChange: (name: string) => void
  onSave: () => void
  onBack: () => void
  onDelete?: () => void
  announce: (text: string) => void
  children?: ReactNode
}

export function NameFormPage({
  heading,
  name,
  onNameChange,
  onSave,
  onBack,
  onDelete,
  announce,
  children,
}: NameFormPageProps) {
  const { playSound } = usePageSlide()
  const [failureMessage, setFailureMessage] = useState('')
  const nameField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function save() {
    try {
      onSave()
    } catch (error) {
      if (!(error instanceof InvalidName)) throw error
      const message = nameFailureMessage(error.reason)
      setFailureMessage(message)
      announce(message)
      playSound('refuse')
      nameField.current?.focus()
    }
  }

  return (
    <main className="page">
      <button type="button" className="backButton" onClick={onBack}>
        <BackIcon /> Zurück
      </button>
      <h1>{heading}</h1>
      <p className="field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          ref={nameField}
          value={name}
          aria-describedby="nameFailure"
          onChange={(event) => onNameChange(event.target.value)}
        />
      </p>
      <p id="nameFailure" className="failure">
        {failureMessage}
      </p>
      {children}
      <BottomBar>
        <button type="button" onClick={save}>
          <SaveIcon />
          Speichern
        </button>
        {onDelete !== undefined && (
          <button type="button" onClick={onDelete}>
            <TrashIcon />
            Löschen
          </button>
        )}
      </BottomBar>
    </main>
  )
}
