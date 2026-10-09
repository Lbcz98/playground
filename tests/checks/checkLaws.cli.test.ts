import { spawnSync } from 'node:child_process'
import { afterAll, describe, expect, it } from 'vitest'
import { addRenderResult } from '../../scripts/check-laws'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CASES } from './corpus/cases'

// Own folder (git-ignored, inside the repo so `@/…` resolves): the other corpus tests clean `.checks-corpus` in parallel.
const DIR = fileURLToPath(new URL('../../.checks-corpus-cli', import.meta.url))
afterAll(() => rmSync(DIR, { recursive: true, force: true }))

const run = (args: string[], env: Record<string, string> = {}, id = 'clean-home') => {
  const entry = `${DIR}/s.tsx`
  mkdirSync(DIR, { recursive: true })
  for (const [name, code] of Object.entries(CASES.find((c) => c.id === id)!.files)) {
    mkdirSync(dirname(`${DIR}/${name}`), { recursive: true })
    writeFileSync(`${DIR}/${name}`, code)
  }
  const r = spawnSync('npx', ['vite-node', '--config', 'vitest.config.ts', 'scripts/check-laws-cli.ts', '--', entry, ...args], {
    encoding: 'utf8',
    env: { ...process.env, VITEST: '', ...env },
  })
  return { code: r.status, out: r.stdout + r.stderr, stdout: r.stdout }
}

// The command line itself: reading the arguments, printing, the exit status. What the run decides is locked
// in-process (checkRun.test.ts, the corpus), through the same `runChecks` this command calls.
describe('check:laws, the command', () => {
  it('--json prints { schemaVersion, reports, findings } on stdout and exits 0 on a clean screen', () => {
    const r = run(['--json', '--no-render'])
    expect(r.code).toBe(0)
    expect(JSON.parse(r.stdout)).toMatchObject({ schemaVersion: 1, reports: [{ problems: [], advisories: [], notRead: [], coverage: { notRead: 0 } }], findings: [] })
  }, 120_000)
  it('prints one line per problem and exits 1 on a broken screen', () => {
    const r = run(['--no-render'], {}, 'focus-two')
    expect(r.code).toBe(1)
    expect(r.stdout).toMatch(/^\.checks-corpus-cli\/s\.tsx:\d+  \[focus\.single\] 2 focused elements/m)
  }, 120_000)
  it('says how to call it and exits 2 with no file', () => {
    const r = spawnSync('npx', ['vite-node', '--config', 'vitest.config.ts', 'scripts/check-laws-cli.ts', '--', '--json'], { encoding: 'utf8', env: { ...process.env, VITEST: '' } })
    expect({ code: r.status, stdout: r.stdout }).toEqual({ code: 2, stdout: '' })
    expect(r.stderr).toMatch(/^usage: npm run check:laws -- /m)
  }, 120_000)
})

describe('addRenderResult — severity routing', () => {
  it('puts warn findings in advisories and block findings in problems', () => {
    const rep = { file: 'f', problems: [], advisories: [], deviations: [], warnings: [], notRead: [], coverage: { read: 0, notRead: 0 }, reuses: [], proposals: [], flow: { edges: [] } }
    addRenderResult(rep, {
      issues: [
        { ruleId: 'render.legibility', severity: 'warn', message: 'overlap' },
        { ruleId: 'frame.layout', severity: 'block', message: 'cut' },
      ],
    })
    expect(rep.advisories.map((a: { law: string }) => a.law)).toEqual(['render.legibility'])
    expect(rep.problems.map((a: { law: string }) => a.law)).toEqual(['frame.layout'])
  })
})
