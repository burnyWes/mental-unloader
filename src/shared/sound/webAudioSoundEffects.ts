import type { SoundEffect, SoundEffects } from './soundEffects'

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

export type SoundUrls = Record<SoundEffect, string>

type NavigatorWithAudioSession = Navigator & {
  audioSession?: { type: string }
}

const SILENT: SoundEffects = { play: () => {} }

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

export function createSoundEffects<Sound>(
  soundUrls: SoundUrls,
  environment: AudioEnvironment<Sound>,
): SoundEffects {
  environment.chooseAmbientAudioSession()
  const output = environment.createOutput()
  if (output === null) return SILENT

  const loadedSounds = new Map<SoundEffect, Sound>()
  for (const effect of Object.keys(soundUrls) as SoundEffect[]) {
    void loadSound(soundUrls[effect], environment, output).then((sound) => {
      if (sound !== null) loadedSounds.set(effect, sound)
    })
  }

  return {
    play(effect) {
      if (!output.isRunning()) void output.resume().catch(() => {})
      const sound = loadedSounds.get(effect)
      if (sound !== undefined) output.play(sound)
    },
  }
}

export function createWebAudioSoundEffects(soundUrls: SoundUrls): SoundEffects {
  return createSoundEffects(soundUrls, browserAudioEnvironment())
}
