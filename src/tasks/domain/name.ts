export const MAXIMUM_NAME_LENGTH = 100

export type InvalidNameReason = 'empty' | 'tooLong'

export class InvalidName extends Error {
  reason: InvalidNameReason

  constructor(reason: InvalidNameReason) {
    super(reason)
    this.name = 'InvalidName'
    this.reason = reason
  }
}

export function createName(written: string): string {
  const name = written.trim()
  if (name === '') throw new InvalidName('empty')
  if (name.length > MAXIMUM_NAME_LENGTH) throw new InvalidName('tooLong')
  return name
}

export function byName<Named extends { id: string; name: string }>(
  named: readonly Named[],
): readonly Named[] {
  return [...named].sort(
    (one, other) =>
      one.name.localeCompare(other.name, 'de-DE') ||
      one.id.localeCompare(other.id),
  )
}
