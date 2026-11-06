import type { ActionSound } from '../sound/soundEffects'

export function toggleSoundFor(turnedOn: boolean): ActionSound {
  return turnedOn ? 'activate' : 'deactivate'
}
