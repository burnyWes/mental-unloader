import { REPEAT_RHYTHM_LABELS } from '../domain/announcements'
import {
  isRepeatRhythm,
  REPEAT_RHYTHMS,
  type RepeatRhythm,
} from '../domain/repetition'
import { RepeatIcon } from './RepeatIcon'

type RepeatFieldsProps = {
  repeats: boolean
  rhythm: RepeatRhythm
  onRepeatsChange: (repeats: boolean) => void
  onRhythmChange: (rhythm: RepeatRhythm) => void
}

export function RepeatFields({
  repeats,
  rhythm,
  onRepeatsChange,
  onRhythmChange,
}: RepeatFieldsProps) {
  return (
    <>
      <p className="field dueChoice">
        <label>
          <RepeatIcon />
          <span className="dueChoiceLabel">Wiederkehrend</span>
          <input
            type="checkbox"
            className="checkboxLook"
            checked={repeats}
            onChange={(event) => onRepeatsChange(event.target.checked)}
          />
        </label>
      </p>
      {repeats && (
        <p className="field">
          <label htmlFor="repeatRhythm">Rhythmus</label>
          <select
            id="repeatRhythm"
            value={rhythm}
            onChange={(event) => {
              if (isRepeatRhythm(event.target.value))
                onRhythmChange(event.target.value)
            }}
          >
            {REPEAT_RHYTHMS.map((each) => (
              <option key={each} value={each}>
                {REPEAT_RHYTHM_LABELS[each]}
              </option>
            ))}
          </select>
        </p>
      )}
    </>
  )
}
