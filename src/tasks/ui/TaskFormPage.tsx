import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BackIcon } from '../../shared/ui/BackIcon'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import {
  descriptionFailureMessage,
  nameFailureMessage,
} from '../domain/announcements'
import { InvalidName } from '../domain/name'
import { InvalidDescription, type DueKind } from '../domain/task'
import { CalendarIcon } from './CalendarIcon'
import { CoffeeIcon } from './CoffeeIcon'
import { DeadlineStepper } from './DeadlineStepper'
import { FlameIcon } from './FlameIcon'
import type { TaskDraft } from './foldersAreaPage'
import { UrgencyLeadSelect } from './UrgencyLeadSelect'

const DUE_CHOICES: readonly {
  kind: DueKind
  label: string
  icon: ReactNode
}[] = [
  { kind: 'urgent', label: 'Dringend', icon: <FlameIcon /> },
  { kind: 'deadline', label: 'Stichtag', icon: <CalendarIcon /> },
  { kind: 'someday', label: 'Irgendwann', icon: <CoffeeIcon /> },
]

type TaskFormPageProps = {
  heading: string
  draft: TaskDraft
  onDraftChange: (draft: TaskDraft) => void
  onSave: () => void
  onBack: () => void
  announce: (text: string) => void
  children?: ReactNode
}

export function TaskFormPage({
  heading,
  draft,
  onDraftChange,
  onSave,
  onBack,
  announce,
  children,
}: TaskFormPageProps) {
  const [nameFailure, setNameFailure] = useState('')
  const [descriptionFailure, setDescriptionFailure] = useState('')
  const nameField = useRef<HTMLInputElement>(null)
  const descriptionField = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    nameField.current?.focus()
  }, [])

  function change(changes: Partial<TaskDraft>) {
    onDraftChange({ ...draft, ...changes })
  }

  function reportFailure(
    message: string,
    showFailure: (message: string) => void,
    field: HTMLElement | null,
  ) {
    showFailure(message)
    announce(message)
    field?.focus()
  }

  function save() {
    setNameFailure('')
    setDescriptionFailure('')
    try {
      onSave()
    } catch (error) {
      if (error instanceof InvalidName)
        reportFailure(
          nameFailureMessage(error.reason),
          setNameFailure,
          nameField.current,
        )
      else if (error instanceof InvalidDescription)
        reportFailure(
          descriptionFailureMessage(),
          setDescriptionFailure,
          descriptionField.current,
        )
      else throw error
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
          value={draft.name}
          aria-describedby="nameFailure"
          onChange={(event) => change({ name: event.target.value })}
        />
      </p>
      <p id="nameFailure" className="failure">
        {nameFailure}
      </p>
      <p className="field">
        <label htmlFor="description">Beschreibung</label>
        <textarea
          id="description"
          rows={4}
          ref={descriptionField}
          value={draft.description}
          aria-describedby="descriptionFailure"
          onChange={(event) => change({ description: event.target.value })}
        />
      </p>
      <p id="descriptionFailure" className="failure">
        {descriptionFailure}
      </p>
      <fieldset className="field dueChoice">
        <legend>Fälligkeit</legend>
        {DUE_CHOICES.map((choice) => (
          <label key={choice.kind}>
            {choice.icon}
            <span className="dueChoiceLabel">{choice.label}</span>
            <input
              type="radio"
              name="due"
              className="checkboxLook"
              value={choice.kind}
              checked={draft.dueKind === choice.kind}
              onChange={() => change({ dueKind: choice.kind })}
            />
          </label>
        ))}
      </fieldset>
      {draft.dueKind === 'deadline' && (
        <>
          <DeadlineStepper
            deadline={draft.deadline}
            onChange={(deadline) => change({ deadline })}
          />
          <UrgencyLeadSelect
            urgentFrom={draft.urgentFrom}
            onChange={(urgentFrom) => change({ urgentFrom })}
          />
        </>
      )}
      {children}
      <BottomBar>
        <button type="button" onClick={save}>
          <SaveIcon />
          Speichern
        </button>
      </BottomBar>
    </main>
  )
}
