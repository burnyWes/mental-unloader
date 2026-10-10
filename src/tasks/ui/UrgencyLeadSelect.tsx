import { URGENCY_LEAD_LABELS } from '../domain/announcements'
import { isUrgencyLead, URGENCY_LEADS, type UrgencyLead } from '../domain/task'

type UrgencyLeadSelectProps = {
  urgentFrom: UrgencyLead
  onChange: (urgentFrom: UrgencyLead) => void
}

export function UrgencyLeadSelect({
  urgentFrom,
  onChange,
}: UrgencyLeadSelectProps) {
  return (
    <p className="field">
      <label htmlFor="urgentFrom">Dringend ab</label>
      <select
        id="urgentFrom"
        value={urgentFrom}
        onChange={(event) => {
          if (isUrgencyLead(event.target.value)) onChange(event.target.value)
        }}
      >
        {URGENCY_LEADS.map((lead) => (
          <option key={lead} value={lead}>
            {URGENCY_LEAD_LABELS[lead]}
          </option>
        ))}
      </select>
    </p>
  )
}
