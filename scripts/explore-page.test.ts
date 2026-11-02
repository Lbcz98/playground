import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs, so `node` runs it without a build
import { checkShotsFolder, commitShot } from './explore-page.mjs'

describe('commitShot', () => {
  it('writes a new picture and skips the same bytes the next time', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'shot-')), 'a.png')
    const buf = Buffer.from('png-bytes')
    expect(commitShot(file, buf)).toBe(file)
    expect(readFileSync(file)).toEqual(buf)
    expect(commitShot(file, buf)).toBe(`inalterado: ${file}`)
    expect(commitShot(file, Buffer.from('other'))).toBe(file)
    expect(readFileSync(file).toString()).toBe('other')
  })
})

describe('the screenshot folder', () => {
  it('takes a temporary folder or one under docs/explorations, and refuses the repo root and its other folders', () => {
    expect(() => checkShotsFolder(join(tmpdir(), 'explore-shots'))).not.toThrow()
    expect(() => checkShotsFolder('docs/explorations/clima/shots')).not.toThrow()
    for (const bad of ['1', './shots', 'scripts/shots', '.']) expect(() => checkShotsFolder(bad), bad).toThrow(/dentro do repositório/)
  })

  it('stops a command line with a clean erro: line before any browser opens', () => {
    for (const script of ['explore-shots.mjs', 'check-explore-layout.mjs']) {
      const args = script === 'explore-shots.mjs' ? ['docs/explorations/qualquer', 'scripts/x'] : ['docs/explorations/qualquer', '--shots', 'scripts/x']
      const r = spawnSync('node', [fileURLToPath(new URL(script, import.meta.url)), ...args], { encoding: 'utf8', cwd: fileURLToPath(new URL('..', import.meta.url)) })
      expect(r.status, script).toBe(1)
      expect(r.stderr, script).toMatch(/^erro: pasta de capturas dentro do repositório/)
    }
  })
})
