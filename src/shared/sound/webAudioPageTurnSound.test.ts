import { describe, expect, it } from 'vitest'
import {
  createPageTurnSound,
  type AudioEnvironment,
  type AudioOutput,
} from './webAudioPageTurnSound'

const SOUND_URL = '/mental-unloader/sounds/page-turn.wav'

const SOUND_BYTES = new Uint8Array([1, 2, 3, 4])

type FakeOutput = AudioOutput<string> & {
  playedSounds: string[]
  resumes: () => number
}

function fakeOutput({
  running = true,
  decodes = true,
}: { running?: boolean; decodes?: boolean } = {}): FakeOutput {
  const playedSounds: string[] = []
  let resumes = 0
  return {
    playedSounds,
    resumes: () => resumes,
    isRunning: () => running,
    resume: async () => {
      resumes++
      running = true
    },
    decode: async (data) => {
      if (!decodes) throw new Error('not a sound')
      return `decoded ${data.byteLength} bytes`
    },
    play: (sound) => {
      playedSounds.push(sound)
    },
  }
}

type FakeEnvironment = AudioEnvironment<string> & {
  audioSessionType: () => string | null
}

function fakeEnvironment(
  output: FakeOutput | null,
  respond: () => Promise<Response> = async () =>
    new Response(SOUND_BYTES, { status: 200 }),
): FakeEnvironment {
  let audioSessionType: string | null = null
  return {
    audioSessionType: () => audioSessionType,
    chooseAmbientAudioSession: () => {
      audioSessionType = 'ambient'
    },
    createOutput: () => output,
    fetch: async (url) => {
      if (url !== SOUND_URL) return new Response(null, { status: 404 })
      return respond()
    },
  }
}

function settleLoading() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('webAudioPageTurnSound', () => {
  it('asks for an ambient audio session so the silent switch mutes it', () => {
    const environment = fakeEnvironment(fakeOutput())

    createPageTurnSound(SOUND_URL, environment)

    expect(environment.audioSessionType()).toBe('ambient')
  })

  it('plays the loaded sound through the audio output', async () => {
    const output = fakeOutput()
    const sound = createPageTurnSound(SOUND_URL, fakeEnvironment(output))
    await settleLoading()

    sound.play()
    sound.play()

    expect(output.playedSounds).toEqual(['decoded 4 bytes', 'decoded 4 bytes'])
  })

  it('resumes an audio output that is not running when playing', async () => {
    const output = fakeOutput({ running: false })
    const sound = createPageTurnSound(SOUND_URL, fakeEnvironment(output))
    await settleLoading()

    sound.play()

    expect(output.resumes()).toBe(1)
    expect(output.playedSounds).toHaveLength(1)
  })

  it('stays silent while the sound is still loading', () => {
    const output = fakeOutput()
    const sound = createPageTurnSound(SOUND_URL, fakeEnvironment(output))

    sound.play()

    expect(output.playedSounds).toEqual([])
  })

  it('stays silent when the sound file is missing', async () => {
    const output = fakeOutput()
    const sound = createPageTurnSound(
      SOUND_URL,
      fakeEnvironment(output, async () => new Response(null, { status: 404 })),
    )
    await settleLoading()

    expect(() => sound.play()).not.toThrow()
    expect(output.playedSounds).toEqual([])
  })

  it('stays silent when the sound cannot be fetched', async () => {
    const output = fakeOutput()
    const sound = createPageTurnSound(
      SOUND_URL,
      fakeEnvironment(output, () => Promise.reject(new Error('offline'))),
    )
    await settleLoading()

    sound.play()

    expect(output.playedSounds).toEqual([])
  })

  it('stays silent when the sound cannot be decoded', async () => {
    const output = fakeOutput({ decodes: false })
    const sound = createPageTurnSound(SOUND_URL, fakeEnvironment(output))
    await settleLoading()

    sound.play()

    expect(output.playedSounds).toEqual([])
  })

  it('stays silent without web audio', async () => {
    const sound = createPageTurnSound(SOUND_URL, fakeEnvironment(null))
    await settleLoading()

    expect(() => sound.play()).not.toThrow()
  })
})
