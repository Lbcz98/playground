import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { CASES } from '../tests/checks/corpus/cases'
import { MARKER } from './findings'
import { renderReport, MAX_CHARS, type LawsJson } from './pr-report'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
// Own git-ignored folder inside the repo (so `@/…` resolves). Its name is the designer folder links point into.
const DIR = join(ROOT, '.checks-corpus-pr')
afterAll(() => rmSync(DIR, { recursive: true, force: true }))

const files = (id: string): Record<string, string> => CASES.find((c) => c.id === id)!.files
/** One designer folder with every feature: links, logic, a reuse, a proposal, one deviation, one legibility warning. */
function buildFolder(): string[] {
  const parts: [string, string, string][] = [
    ['link-home-to-rail', 'home.tsx', 'home.tsx'],
    ['link-home-to-rail', 'rail.tsx', 'rail.tsx'],
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
  return parts.filter(([, , to]) => !to.startsWith('components/')).map(([, , to]) => join(DIR, to))
}

const laws = (entries: string[], env: Record<string, string> = {}) => {
  const r = spawnSync('npx', ['vite-node', '--config', 'vitest.config.ts', 'scripts/check-laws-cli.ts', '--', '--json', '--require-render', ...entries], {
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
    for (const s of ['Blocking problems', 'Legibility warnings', 'Declared deviations', 'Primitives and proposals', 'Not read', 'Flow edges']) expect(md).toContain(`### ${s}`)
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

  it('a flow.ts that sends a key to a state that does not exist exits 1 and the comment lists it', () => {
    const dir = join(DIR, 'broken-flow')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'home.tsx'), files('clean-home')['s.tsx'])
    writeFileSync(join(dir, 'flow.ts'), "export default { start: 'home', transitions: [{ from: 'home', key: 'up', to: 'nowhere' }] }\n")
    const r = laws([dir, '--no-render'])
    expect(r.code).toBe(1)
    expect(renderReport(r.json, ROOT)).toMatch(/### Blocking problems \(1\)\n\n- `.checks-corpus-pr\/broken-flow\/flow.ts` \[[\w.-]+\] .*nowhere/)
  }, 180_000)

  it('with CHROMIUM_PATH=/nonexistent the laws step exits 1', () => {
    const entry = join(DIR, 'norender.tsx')
    mkdirSync(DIR, { recursive: true })
    writeFileSync(entry, files('clean-home')['s.tsx'])
    const r = laws([entry], { CHROMIUM_PATH: '/nonexistent' })
    expect(r.code).toBe(1)
    // A render audit that did not run, when it was required, blocks: the comment has to say so too.
    expect(renderReport(r.json, ROOT)).toMatch(/### Blocking problems \(1\)\n\n- `.checks-corpus-pr\/norender.tsx` \[render.not-run\] .*Chromium could not start/)
  }, 180_000)
})

describe('renderReport — pure', () => {
  const rep = (file: string, over: object = {}) => ({
    file: `${ROOT}${file}`, problems: [], advisories: [], deviations: [], warnings: [], notRead: [], coverage: { read: 3, notRead: 0 }, reuses: [], proposals: [], flow: { edges: [] }, ...over,
  })
  const json = (reports: object[]) => ({ schemaVersion: 1, reports, findings: [] }) as unknown as LawsJson
  const a = rep('web/protos/x/a.tsx', { deviations: [{ ruleId: 'r.a', why: 'because', line: 7 }, { ruleId: 'r.b', why: 'also', line: 9 }] })
  const b = rep('web/protos/x/b.tsx', { advisories: [{ law: 'render.legibility', message: 'texts overlap' }] })

  it('is byte-identical across runs and independent of input order', () => {
    const one = renderReport(json([a, b]), ROOT)
    expect(renderReport(json([b, a]), ROOT)).toBe(one)
    expect(renderReport(json([a, { ...b }]), ROOT)).toBe(one)
    expect(one).toContain('- `r.a` — because (`web/protos/x/a.tsx:7`)')
  })
  it('lists a finding of a flow among the blocking problems, with its rule id, file and line, and counts it', () => {
    const finding = { rule: 'flow.next-level', file: `${ROOT}web/protos/x/flow.ts`, line: 4, message: 'home —enter→ detail\nskips a level' }
    const md = renderReport({ schemaVersion: 1, reports: [], findings: [finding] }, ROOT)
    expect(md).toContain('### Blocking problems (1)\n\n- `web/protos/x/flow.ts:4` [flow.next-level] home —enter→ detail skips a level')
    expect(md).toContain('1 blocking problems')
  })
  it('the CLI reads every .json of a folder, and an empty folder is an empty report', () => {
    const dir = join(DIR, 'findings')
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    const cli = () => spawnSync('npx', ['vite-node', '--config', 'vitest.config.ts', 'scripts/pr-report.ts', '--', dir], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, VITEST: '' } })
    expect(cli().stdout).toContain('0 screens checked · 0 blocking problems')
    const finding = (rule: string) => ({ schemaVersion: 1, reports: [], findings: [{ rule, file: `${ROOT}web/protos/x/flow.ts`, message: 'm' }] })
    writeFileSync(join(dir, 'laws.json'), JSON.stringify(finding('flow.next-level')))
    writeFileSync(join(dir, 'flow-1.json'), JSON.stringify(finding('focus.single')))
    expect(cli().stdout).toContain('### Blocking problems (2)')
    writeFileSync(join(dir, 'flow-2.json'), '') // a step that crashed leaves an empty file: the report is not built
    expect(cli().status).not.toBe(0)
  }, 60_000)
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
