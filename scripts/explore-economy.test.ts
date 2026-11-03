import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs
import { EXPLORER_CAP, economy, explorerCap, flag, headlessExit } from './explore-economy.mjs'

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
    for (const k of ['headless_exit', 'loop_cap', 'lean_pack', 'explorer_cap']) expect(typeof shipped[k]).toBe('boolean')
  })

  it('the command documents the switches and asks the script before waiting for comments', () => {
    for (const f of ['.claude/commands/explore.md', '.claude/commands/explore-playbook.md']) {
      expect(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), f).toContain('Bash(node scripts/explore-economy.mjs:*)')
    }
    const cmd = readFileSync(new URL('../.claude/commands/explore.md', import.meta.url), 'utf8')
    for (const k of ['headless_exit', 'loop_cap', 'lean_pack', 'explorer_cap']) expect(cmd).toContain(`\`${k}\``)
    expect(cmd).toContain('node scripts/explore-economy.mjs headless')
  })

  it('explorer_cap adds one short line, and off or missing adds nothing', () => {
    const cap = join(dir, 'cap.json')
    writeFileSync(cap, '{"explorer_cap":true}')
    const base = 'steps 6 and 7 stay as they are'
    expect(explorerCap(cap)).toBe(EXPLORER_CAP)
    expect(EXPLORER_CAP.length).toBeLessThan(180)
    expect(EXPLORER_CAP).toContain('2 look-and-fix rounds')
    expect(base + explorerCap(off)).toBe(base)
    expect(base + explorerCap(join(dir, 'none.json'))).toBe(base)
    expect(explorerCap(bad)).toBe('')
    expect(readFileSync(new URL('./explore-pack.mjs', import.meta.url), 'utf8')).not.toContain('explorer_cap')
  })
})
