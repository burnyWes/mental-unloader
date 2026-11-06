import type { PageTurnSound } from './pageTurnSound'

export type AudioOutput<Sound> = {
  isRunning(): boolean
  resume(): Promise<void>
  decode(data: ArrayBuffer): Promise<Sound>
  play(sound: Sound): void
}

export type AudioEnvironment<Sound> = {
  chooseAmbientAudioSession(): void
  createOutput(): AudioOutput<Sound> | null
  fetch(url: string): Promise<Pick<Response, 'ok' | 'arrayBuffer'>>
}

type NavigatorWithAudioSession = Navigator & {
  audioSession?: { type: string }
}

const SILENT: PageTurnSound = { play: () => {} }

function audioOutputOf(context: AudioContext): AudioOutput<AudioBuffer> {
  return {
    isRunning: () => context.state === 'running',
    resume: () => context.resume(),
    decode: (data) => context.decodeAudioData(data),
    play(sound) {
      const source = context.createBufferSource()
      source.buffer = sound
      source.connect(context.destination)
      source.start()
    },
  }
}

function browserAudioEnvironment(): AudioEnvironment<AudioBuffer> {
  return {
    chooseAmbientAudioSession() {
      const { audioSession } = navigator as NavigatorWithAudioSession
      if (audioSession) audioSession.type = 'ambient'
    },
    createOutput() {
      if (typeof AudioContext === 'undefined') return null
      return audioOutputOf(new AudioContext())
    },
    fetch: (url) => fetch(url),
  }
}

async function loadSound<Sound>(
  soundUrl: string,
  environment: AudioEnvironment<Sound>,
  output: AudioOutput<Sound>,
): Promise<Sound | null> {
  try {
    const response = await environment.fetch(soundUrl)
    if (!response.ok) return null
    return await output.decode(await response.arrayBuffer())
  } catch {
    return null
  }
}

export function createPageTurnSound<Sound>(
  soundUrl: string,
  environment: AudioEnvironment<Sound>,
): PageTurnSound {
  environment.chooseAmbientAudioSession()
  const output = environment.createOutput()
  if (output === null) return SILENT

  let loadedSound: Sound | null = null
  void loadSound(soundUrl, environment, output).then((sound) => {
    loadedSound = sound
  })

  return {
    play() {
      if (!output.isRunning()) void output.resume().catch(() => {})
      if (loadedSound !== null) output.play(loadedSound)
    },
  }
}

export function createWebAudioPageTurnSound(soundUrl: string): PageTurnSound {
  return createPageTurnSound(soundUrl, browserAudioEnvironment())
}
