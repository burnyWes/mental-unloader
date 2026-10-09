import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MOTIF } from '../scripts/checkMarkMotif.mjs'

const publicFile = (fileName: string) =>
  new URL(`../public/${fileName}`, import.meta.url)

const PNG_WIDTH_OFFSET = 16
const PNG_HEIGHT_OFFSET = 20
const PNG_COLOUR_TYPE_OFFSET = 25
const OPAQUE_TRUE_COLOUR = 2

function pngHeader(fileName: string) {
  const png = readFileSync(publicFile(fileName))
  return {
    width: png.readUInt32BE(PNG_WIDTH_OFFSET),
    height: png.readUInt32BE(PNG_HEIGHT_OFFSET),
    colourType: png.readUInt8(PNG_COLOUR_TYPE_OFFSET),
  }
}

const EXPECTED_EDGES = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
  ['apple-touch-icon.png', 180],
] as const

const MASKABLE_CONTENT_SCALE = 0.8
const SAFE_ZONE_RADIUS = 0.4

function farthestReachFromTheCentre(contentScale: number) {
  return Math.max(
    ...Object.values(MOTIF).flatMap(({ points, thickness }) =>
      points.map(
        ([x, y]) =>
          (Math.hypot(x - 0.5, y - 0.5) + thickness / 2) * contentScale,
      ),
    ),
  )
}

describe('icons', () => {
  it.each(EXPECTED_EDGES)('draws %s with %i pixels per edge', (file, edge) => {
    const { width, height } = pngHeader(file)

    expect([width, height]).toEqual([edge, edge])
  })

  it('draws the home screen icon of iOS without transparency', () => {
    expect(pngHeader('apple-touch-icon.png').colourType).toBe(
      OPAQUE_TRUE_COLOUR,
    )
  })

  it('offers a vector icon for the browser tab', () => {
    expect(existsSync(publicFile('favicon.svg'))).toBe(true)
  })

  it('keeps the motif of the maskable icon inside the safe zone', () => {
    expect(farthestReachFromTheCentre(MASKABLE_CONTENT_SCALE)).toBeLessThan(
      SAFE_ZONE_RADIUS,
    )
  })
})
