import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { CASES } from '../tests/checks/corpus/cases'
import { renderReport, MARKER, MAX_CHARS, type LawsJson } from './pr-report'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
// Own git-ignored folder inside the repo (so `@/…` resolves).
const DIR = join(ROOT, '.checks-corpus-pr')
afterAll(() => rmSync(DIR, { recursive: true, force: true }))

const files = (id: string): Record<string, string> => CASES.find((c) => c.id === id)!.files
/** One designer folder with every feature: a flow folder, logic, a reuse, a proposal, one deviation, one legibility warning. */
function buildFolder(): string[] {
  const parts: [string, string, string][] = [
    ['flow-folder-home-rail', 'home.tsx', 'flow/home.tsx'],
    ['flow-folder-home-rail', 'rail.tsx', 'flow/rail.tsx'],
    ['flow-folder-home-rail', 'flow.ts', 'flow/flow.ts'],
    ['logic-map-clean', 's.tsx', 'logic.tsx'],
    ['primitive-box-with-reuse', 's.tsx', 'prim.tsx'],
    ['local-component-with-proposal', 's.tsx', 'local.tsx'],
    ['local-component-with-proposal', 'components/Stepper.tsx', 'components/Stepper.tsx'],
    ['deviation-declared-ok', 's.tsx', 'deviation.tsx'],
    ['render-text-overlap', 's.tsx', 'legibility.tsx'],
  ]
  rmSync(DIR, { recursive: true, force: true })
  for (const [id, from, to] of parts) {
    mkdirSync(dirname(join(DIR, to)), { recursive: true })
    writeFileSync(join(DIR, to), files(id)[from].replaceAll(id, '.checks-corpus-pr'))
  }
  // The flow goes in as its folder; a state file alone would bring the whole flow with it anyway.
  return [join(DIR, 'flow'), ...parts.filter(([, , to]) => !/^(components|flow)\//.test(to)).map(([, , to]) => join(DIR, to))]
}

const laws = (entries: string[], env: Record<string, string> = {}) => {
  const r = spawnSync('npx', ['vite-node', '--config', 'vitest.config.ts', 'scripts/check-laws.ts', '--', '--json', '--require-render', ...entries], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, VITEST: '', ...env },
  })
  return { code: r.status, json: JSON.parse(r.stdout) as LawsJson }
}

describe('pr-report on a real check:laws --json run (needs Chromium)', () => {
  it('a folder with every feature renders the committed snapshot and every section', async () => {
    const r = laws(buildFolder())
    expect(r.code).toBe(0) // legibility and declared deviations do not block
    const md = renderReport(r.json, ROOT)
    for (const s of ['Blocking problems', 'Legibility warnings', 'Declared deviations', 'Primitives and proposals', 'Not read', 'Flows']) expect(md).toContain(`### ${s}`)
    expect(md.startsWith(MARKER)).toBe(true)
    expect(md).toContain('render.legibility')
    expect(md).toContain('layout.root-align')
    await expect(md).toMatchFileSnapshot('../tests/checks/__snapshots__/pr-report.md')
  }, 300_000)

  it('a blocking fixture exits 1 and its problem is listed', () => {
    const entry = join(DIR, 'blocking.tsx')
    mkdirSync(DIR, { recursive: true })
    writeFileSync(entry, files('tokens-raw-hex')['s.tsx'])
    const r = laws([entry])
    expect(r.code).toBe(1)
    expect(renderReport(r.json, ROOT)).toMatch(/### Blocking problems \(\d+\)\n\n- `.checks-corpus-pr\/blocking.tsx/)
  }, 180_000)

  it('with CHROMIUM_PATH=/nonexistent the laws step exits 1', () => {
    const entry = join(DIR, 'norender.tsx')
    mkdirSync(DIR, { recursive: true })
    writeFileSync(entry, files('clean-home')['s.tsx'])
    expect(laws([entry], { CHROMIUM_PATH: '/nonexistent' }).code).toBe(1)
  }, 180_000)
})

describe('renderReport — pure', () => {
  const rep = (file: string, over: object = {}) => ({
    file: `${ROOT}${file}`, problems: [], advisories: [], deviations: [], warnings: [], notRead: [], coverage: { read: 3, notRead: 0 }, reuses: [], proposals: [], ...over,
  })
  const json = (reports: object[]) => ({ schemaVersion: 1, reports }) as unknown as LawsJson
  const a = rep('web/protos/x/a.tsx', { deviations: [{ ruleId: 'r.a', why: 'because' }, { ruleId: 'r.b', why: 'also' }] })
  const b = rep('web/protos/x/b.tsx', { advisories: [{ law: 'render.legibility', message: 'texts overlap' }] })

  it('is byte-identical across runs and independent of input order', () => {
    const one = renderReport(json([a, b]), ROOT)
    expect(renderReport(json([b, a]), ROOT)).toBe(one)
    expect(renderReport(json([a, { ...b }]), ROOT)).toBe(one)
    expect(one).toContain('- `r.a` — because (`web/protos/x/a.tsx`)')
  })
  it('lists a flow folder, and counts what is wrong with its flow.ts as blocking', () => {
    const flows = [{ dir: `${ROOT}web/protos/x/trip`, states: ['home', 'rail'], problems: [{ law: 'flow.next-level', message: 'home —enter→ detail skips a level' }] }]
    const md = renderReport({ ...json([a]), flows } as unknown as LawsJson, ROOT)
    expect(md).toContain('### Blocking problems (1)\n\n- `web/protos/x/trip/flow.ts` [flow.next-level] home —enter→ detail skips a level')
    expect(md).toContain('### Flows (1)\n\n- `web/protos/x/trip/flow.ts` — 2 states: home, rail')
  })
  it('rejects another schema version, naming it', () => {
    expect(() => renderReport({ schemaVersion: 2, reports: [] } as unknown as LawsJson)).toThrow(/schemaVersion 2/)
  })
  it('truncates at the limit with "and N more"', () => {
    const many = rep('web/protos/x/big.tsx', { notRead: Array.from({ length: 3000 }, (_, i) => ({ line: i, kind: 'map', message: 'x'.repeat(40) })) })
    const md = renderReport(json([many]), ROOT)
    expect(md.length).toBeLessThanOrEqual(MAX_CHARS)
    expect(md).toMatch(/…and \d+ more/)
    expect(md.startsWith(MARKER)).toBe(true)
  })
})
