import type { Folder, FolderId } from '../domain/folder'

type FolderSelectProps = {
  folders: readonly Folder[]
  value: FolderId
  onChange: (folderId: FolderId) => void
}

export function FolderSelect({ folders, value, onChange }: FolderSelectProps) {
  return (
    <p className="field">
      <label htmlFor="listFolder">Ordner</label>
      <select
        id="listFolder"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>
    </p>
  )
}
