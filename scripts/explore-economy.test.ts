import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs
import { economy, flag, headlessExit } from './explore-economy.mjs'

const dir = mkdtempSync(join(tmpdir(), 'explore-economy-'))
const on = join(dir, 'on.json'), off = join(dir, 'off.json'), bad = join(dir, 'bad.json')
writeFileSync(on, '{"headless_exit":true,"loop_cap":true}')
writeFileSync(off, '{"headless_exit":false}')
writeFileSync(bad, '{nope')

describe('explore-economy', () => {
  it('reads a switch; a missing file, key or broken JSON is false', () => {
    expect(flag('loop_cap', on)).toBe(true)
    expect(flag('loop_cap', off)).toBe(false)
    expect(flag('lean_pack', on)).toBe(false)
    expect(economy(join(dir, 'none.json'))).toEqual({})
    expect(economy(bad)).toEqual({})
  })

  it('exits headless only with the switch on and a non-interactive run', () => {
    expect(headlessExit({ EXPLORE_HEADLESS: '1' }, [], on)).toBe(true)
    expect(headlessExit({}, ['--headless'], on)).toBe(true)
    expect(headlessExit({}, [], on)).toBe(false)
    expect(headlessExit({ EXPLORE_HEADLESS: '1' }, [], off)).toBe(false)
  })

  it('ships with every switch known', () => {
    const shipped = economy()
    for (const k of ['headless_exit', 'loop_cap', 'lean_pack']) expect(typeof shipped[k]).toBe('boolean')
  })
})
