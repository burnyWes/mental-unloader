import { useEffect, useRef, useState } from 'react'
import { BackIcon } from '../../shared/ui/BackIcon'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { TrashIcon } from '../../shared/ui/TrashIcon'
import { folderNameFailureMessage } from '../domain/announcements'
import { InvalidFolderName } from '../domain/folder'

type FolderFormPageProps = {
  heading: string
  name: string
  onNameChange: (name: string) => void
  onSave: () => void
  onBack: () => void
  onDelete?: () => void
  announce: (text: string) => void
}

export function FolderFormPage({
  heading,
  name,
  onNameChange,
  onSave,
  onBack,
  onDelete,
  announce,
}: FolderFormPageProps) {
  const [failureMessage, setFailureMessage] = useState('')
  const nameField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function saveFolder() {
    try {
      onSave()
    } catch (error) {
      if (!(error instanceof InvalidFolderName)) throw error
      const message = folderNameFailureMessage(error.reason)
      setFailureMessage(message)
      announce(message)
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
        <label htmlFor="folderName">Name</label>
        <input
          id="folderName"
          type="text"
          ref={nameField}
          value={name}
          aria-describedby="folderNameFailure"
          onChange={(event) => onNameChange(event.target.value)}
        />
      </p>
      <p id="folderNameFailure" className="failure">
        {failureMessage}
      </p>
      <BottomBar>
        {onDelete !== undefined && (
          <button type="button" onClick={onDelete}>
            <TrashIcon />
            Löschen
          </button>
        )}
        <button type="button" onClick={saveFolder}>
          <SaveIcon />
          Speichern
        </button>
      </BottomBar>
    </main>
  )
}
