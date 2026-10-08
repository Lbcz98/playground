import { afterEach, describe, expect, it, vi } from 'vitest'
import { paintsBackground } from './measureDom'

const withBackground = (backgroundColor: string, backgroundImage = 'none') => {
  vi.stubGlobal('getComputedStyle', () => ({ backgroundColor, backgroundImage }))
  return paintsBackground({} as Element)
}

describe('paintsBackground', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    ['rgb(0, 0, 0)', true],
    ['rgba(0, 0, 0, 0.6)', true],
    ['rgba(0, 0, 0, 0.3)', false],
    ['rgb(0 0 0 / 0.6)', true],
    ['color(srgb 0 0 0 / 0.6)', true],
    ['color(srgb 0 0 0 / 0.3)', false],
    ['color(srgb 0.1 0.2 0.3)', true],
    ['transparent', false],
  ])('%s -> %s', (color, expected) => {
    expect(withBackground(color)).toBe(expected)
  })

  it('counts an image or gradient as painting', () => {
    expect(withBackground('rgba(0, 0, 0, 0)', 'linear-gradient(red, blue)')).toBe(true)
  })
})
