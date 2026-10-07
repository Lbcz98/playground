import { spawnSync } from 'node:child_process'
import { afterAll, describe, expect, it } from 'vitest'
import { addRenderResult } from '../../scripts/check-laws'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { CASES } from './corpus/cases'

// Own folder (git-ignored, inside the repo so `@/…` resolves): the other corpus tests clean `.checks-corpus` in parallel.
const DIR = fileURLToPath(new URL('../../.checks-corpus-cli', import.meta.url))
afterAll(() => rmSync(DIR, { recursive: true, force: true }))

const run = (args: string[], env: Record<string, string> = {}, id = 'clean-home') => {
  const entry = `${DIR}/s.tsx`
  mkdirSync(DIR, { recursive: true })
  writeFileSync(entry, CASES.find((c) => c.id === id)!.files['s.tsx'])
  const r = spawnSync('npx', ['vite-node', '--config', 'vitest.config.ts', 'scripts/check-laws.ts', '--', entry, ...args], {
    encoding: 'utf8',
    env: { ...process.env, VITEST: '', ...env },
  })
  return { code: r.status, out: r.stdout + r.stderr, stdout: r.stdout }
}

describe('check:laws --require-render', () => {
  it('without Chromium and without the flag: exit 0, and says the render check did not run', () => {
    const r = run([], { CHROMIUM_PATH: '/nonexistent' })
    expect(r.code).toBe(0)
    expect(r.out).toMatch(/render check did not run/)
  }, 120_000)
  it('without Chromium and with the flag: exit 1, naming the cause', () => {
    const r = run(['--require-render'], { CHROMIUM_PATH: '/nonexistent' })
    expect(r.code).toBe(1)
    expect(r.out).toMatch(/Chromium could not start/)
  }, 120_000)
  it('--json prints problems and advisories apart', () => {
    const r = run(['--json', '--no-render'])
    expect(r.code).toBe(0)
    expect(JSON.parse(r.stdout)[0]).toMatchObject({ problems: [], advisories: [] })
  }, 120_000)
})

describe('check:laws on a real advisory screen', () => {
  it('exit 0 and a non-empty advisories array when only legibility is found', () => {
    const r = run(['--json'], {}, 'render-text-overlap')
    const rep = JSON.parse(r.stdout)[0]
    expect(r.code).toBe(0)
    expect(rep.problems).toEqual([])
    expect(rep.advisories.length).toBeGreaterThan(0)
    expect(rep.advisories[0].law).toBe('render.legibility')
  }, 180_000)
})

describe('addRenderResult — severity routing', () => {
  it('puts warn findings in advisories and block findings in problems', () => {
    const rep = { file: 'f', problems: [], advisories: [], deviations: [], warnings: [] }
    addRenderResult(rep, {
      issues: [
        { ruleId: 'render.legibility', severity: 'warn', message: 'overlap' },
        { ruleId: 'frame.layout', severity: 'block', message: 'cut' },
      ],
    })
    expect(rep.advisories.map((a: { law: string }) => a.law)).toEqual(['render.legibility'])
    expect(rep.problems.map((a: { law: string }) => a.law)).toEqual(['render'])
  })
})
