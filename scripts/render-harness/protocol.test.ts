import { describe, expect, it } from 'vitest'
import { harnessUrl, targetOf } from './protocol'

describe('the render harness page address', () => {
  it('is the one the scripts have always opened', () => {
    expect(harnessUrl({ file: 'src/shared/x.tsx' })).toBe('/scripts/render-harness/index.html?file=/src/shared/x.tsx')
    expect(harnessUrl({ flow: 'web/protos/lucas/weather-flow' })).toBe('/scripts/render-harness/index.html?flow=/web/protos/lucas/weather-flow')
  })

  it('reads back, on the page, what the scripts asked for', () => {
    for (const target of [{ file: 'src/a b/é.tsx' }, { flow: 'web/protos/x/flow' }]) expect(targetOf(new URL(harnessUrl(target), 'http://harness').search)).toEqual(target)
    expect(targetOf('')).toBeUndefined()
  })
})
