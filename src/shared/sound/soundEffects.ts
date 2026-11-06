export type SoundEffect =
  'pageTurn' | 'confirm' | 'refuse' | 'activate' | 'deactivate' | 'arrow'

export type ActionSound = Exclude<SoundEffect, 'pageTurn'>

export interface SoundEffects {
  play(effect: SoundEffect): void
}
