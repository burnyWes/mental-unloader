export type SoundEffect = 'pageTurn' | 'confirm' | 'refuse'

export type ActionSound = Exclude<SoundEffect, 'pageTurn'>

export interface SoundEffects {
  play(effect: SoundEffect): void
}
