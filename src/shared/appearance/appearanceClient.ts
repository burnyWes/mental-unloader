export type DeviceStorage = Pick<Storage, 'getItem' | 'setItem'>

export interface AppearanceClient {
  readDarkMode(): boolean
  writeDarkMode(darkMode: boolean): void
}
