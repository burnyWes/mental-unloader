import type { ListId } from '../domain/list'
import {
  listsOfFolder,
  sortedFolders,
  type Organizer,
} from '../domain/organizer'

type TaskListSelectProps = {
  organizer: Organizer
  value: ListId
  onChange: (listId: ListId) => void
}

export function TaskListSelect({
  organizer,
  value,
  onChange,
}: TaskListSelectProps) {
  const foldersWithLists = sortedFolders(organizer)
    .map((folder) => ({ folder, lists: listsOfFolder(organizer, folder.id) }))
    .filter(({ lists }) => lists.length > 0)

  return (
    <p className="field">
      <label htmlFor="taskList">Liste</label>
      <select
        id="taskList"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {foldersWithLists.map(({ folder, lists }) => (
          <optgroup key={folder.id} label={folder.name}>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </p>
  )
}
