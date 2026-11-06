import type { SoundEffect, SoundEffects } from './soundEffects'

export type RecordingSoundEffects = SoundEffects & {
  played(): readonly SoundEffect[]
}

export function createInMemorySoundEffects(): RecordingSoundEffects {
  const played: SoundEffect[] = []

  return {
    play: (effect) => {
      played.push(effect)
    },
    played: () => [...played],
  }
}
