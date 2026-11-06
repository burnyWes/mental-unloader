export type DeviceStorage = Pick<Storage, 'getItem' | 'setItem'>

export interface AppearanceClient {
  readDarkMode(): boolean
  writeDarkMode(darkMode: boolean): void
  readAnimations(): boolean
  writeAnimations(animations: boolean): void
  readSounds(): boolean
  writeSounds(sounds: boolean): void
}
