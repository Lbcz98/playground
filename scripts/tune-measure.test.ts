import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs, so `node` runs it without a build
import { fold, mix, ratio } from './tune-measure.mjs'

describe('tune-measure maths', () => {
  it('matches the WCAG 2 reference ratios', () => {
    expect(ratio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 5)
    expect(ratio([255, 255, 255], [255, 255, 255])).toBeCloseTo(1, 5)
    expect(ratio([119, 119, 119], [255, 255, 255])).toBeCloseTo(4.48, 2) // #777 on white: the classic just-failing grey
    expect(ratio([0, 0, 0], [255, 255, 255])).toBeCloseTo(ratio([255, 255, 255], [0, 0, 0]), 10)
  })
  it('composites a translucent colour on what is under it', () => {
    expect(mix([255, 255, 255, 0.5], [0, 0, 0])).toEqual([127.5, 127.5, 127.5])
    expect(mix([10, 20, 30, 1], [200, 200, 200])).toEqual([10, 20, 30])
  })
  it('says a fact once: rows equal but for one field are folded, its values joined once each', () => {
    const rows = [{ state: 'a', el: 'p', ratio: 9 }, { state: 'b', el: 'p', ratio: 9 }, { state: 'b', el: 'p', ratio: 9 }, { state: 'c', el: 'p', ratio: 3 }]
    expect(fold(rows, 'state')).toEqual([{ state: 'a, b', el: 'p', ratio: 9 }, { state: 'c', el: 'p', ratio: 3 }])
  })
})
