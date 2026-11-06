import { describe, expect, it } from 'vitest'
import type { SoundEffect } from './soundEffects'
import {
  createSoundEffects,
  type AudioEnvironment,
  type AudioOutput,
  type SoundUrls,
} from './webAudioSoundEffects'

const SOUND_URLS: SoundUrls = {
  pageTurn: '/mental-unloader/sounds/page-turn.wav',
  confirm: '/mental-unloader/sounds/confirm.wav',
  refuse: '/mental-unloader/sounds/refuse.wav',
}

const SOUND_BYTES: Record<SoundEffect, Uint8Array<ArrayBuffer>> = {
  pageTurn: new Uint8Array([1]),
  confirm: new Uint8Array([1, 2]),
  refuse: new Uint8Array([1, 2, 3]),
}

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

type Respond = (effect: SoundEffect) => Promise<Response>

const respondWithSoundBytes: Respond = async (effect) =>
  new Response(SOUND_BYTES[effect], { status: 200 })

type FakeEnvironment = AudioEnvironment<string> & {
  audioSessionType: () => string | null
  createdOutputs: () => number
}

function effectAt(url: string): SoundEffect | null {
  const effects = Object.keys(SOUND_URLS) as SoundEffect[]
  return effects.find((effect) => SOUND_URLS[effect] === url) ?? null
}

function fakeEnvironment(
  output: FakeOutput | null,
  respond: Respond = respondWithSoundBytes,
): FakeEnvironment {
  let audioSessionType: string | null = null
  let createdOutputs = 0
  return {
    audioSessionType: () => audioSessionType,
    createdOutputs: () => createdOutputs,
    chooseAmbientAudioSession: () => {
      audioSessionType = 'ambient'
    },
    createOutput: () => {
      createdOutputs++
      return output
    },
    fetch: async (url) => {
      const effect = effectAt(url)
      if (effect === null) return new Response(null, { status: 404 })
      return respond(effect)
    },
  }
}

function settleLoading() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('webAudioSoundEffects', () => {
  it('asks for an ambient audio session so the silent switch mutes it', () => {
    const environment = fakeEnvironment(fakeOutput())

    createSoundEffects(SOUND_URLS, environment)

    expect(environment.audioSessionType()).toBe('ambient')
  })

  it('creates a single audio output for all sounds', async () => {
    const environment = fakeEnvironment(fakeOutput())

    createSoundEffects(SOUND_URLS, environment)
    await settleLoading()

    expect(environment.createdOutputs()).toBe(1)
  })

  it('plays each loaded sound through the audio output', async () => {
    const output = fakeOutput()
    const soundEffects = createSoundEffects(SOUND_URLS, fakeEnvironment(output))
    await settleLoading()

    soundEffects.play('pageTurn')
    soundEffects.play('confirm')
    soundEffects.play('refuse')

    expect(output.playedSounds).toEqual([
      'decoded 1 bytes',
      'decoded 2 bytes',
      'decoded 3 bytes',
    ])
  })

  it('resumes an audio output that is not running when playing', async () => {
    const output = fakeOutput({ running: false })
    const soundEffects = createSoundEffects(SOUND_URLS, fakeEnvironment(output))
    await settleLoading()

    soundEffects.play('confirm')

    expect(output.resumes()).toBe(1)
    expect(output.playedSounds).toHaveLength(1)
  })

  it('stays silent while the sound is still loading', () => {
    const output = fakeOutput()
    const soundEffects = createSoundEffects(SOUND_URLS, fakeEnvironment(output))

    soundEffects.play('confirm')

    expect(output.playedSounds).toEqual([])
  })

  it('keeps the other sounds when one sound file is missing', async () => {
    const output = fakeOutput()
    const soundEffects = createSoundEffects(
      SOUND_URLS,
      fakeEnvironment(output, async (effect) =>
        effect === 'refuse'
          ? new Response(null, { status: 404 })
          : respondWithSoundBytes(effect),
      ),
    )
    await settleLoading()

    expect(() => soundEffects.play('refuse')).not.toThrow()
    soundEffects.play('confirm')

    expect(output.playedSounds).toEqual(['decoded 2 bytes'])
  })

  it('stays silent when a sound cannot be fetched', async () => {
    const output = fakeOutput()
    const soundEffects = createSoundEffects(
      SOUND_URLS,
      fakeEnvironment(output, () => Promise.reject(new Error('offline'))),
    )
    await settleLoading()

    soundEffects.play('confirm')

    expect(output.playedSounds).toEqual([])
  })

  it('stays silent when a sound cannot be decoded', async () => {
    const output = fakeOutput({ decodes: false })
    const soundEffects = createSoundEffects(SOUND_URLS, fakeEnvironment(output))
    await settleLoading()

    soundEffects.play('confirm')

    expect(output.playedSounds).toEqual([])
  })

  it('stays silent without web audio', async () => {
    const soundEffects = createSoundEffects(SOUND_URLS, fakeEnvironment(null))
    await settleLoading()

    expect(() => soundEffects.play('confirm')).not.toThrow()
  })
})
