import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { DTV_TEMPLATES } from '../../scripts/storybook/dtv-templates'
import type { BlueprintDocument } from '../../src/shared/blueprint'
import { exportBlueprintToTsx } from '../../src/shared/export/toTsx'
import { renderReport } from '../../scripts/pr-report'

// A realistic designer folder (git-ignored, inside the repo so `@/…` resolves), run through the real CLIs.
const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DIR = `${ROOT}.checks-corpus-e2e`
afterAll(() => rmSync(DIR, { recursive: true, force: true }))

const ref = (id: string): string => exportBlueprintToTsx(DTV_TEMPLATES.find((t) => t.id === id)!.blueprint as BlueprintDocument).code

const HOME = ref('home')
  .replace('import { Stack }', 'import { Box, Stack }')
  .replace('</InteractivityMenu>', '</InteractivityMenu>\n          {/* @reuse InteractivityButton: a plain surface, not a button */}\n          <Box />')
  .replace('</InteractivityMenu>', '  {TITLES.map((t) => <InteractivityButton key={t} title={t} interactionState="default" />)}\n          </InteractivityMenu>') // logic: not read
  .replace('/**\n * ScreenView', "const TITLES = ['Resumo']\n\n/**\n * ScreenView")
const RAIL = ref('interactivity-buttons-right')
// The way from one state to the next is the flow's own file, not something a screen carries.
const FLOW = `export default {
  start: 'home',
  transitions: [
    { from: 'home', key: 'up', to: 'rail' },
    { from: 'rail', key: 'enter', to: 'detail' },
  ],
}
`
const CARDS = ref('interactivity-cards-right')
const OVERLAP = CARDS.replace(/<TableCell type="team" name="ARG"[^>]*\/>/g, '').replace(
  "stats={['11', '5', '2']}",
  "stats={['11111111', '55555555', '22222222', '1111111', '111111', '11111111']}",
)
const PROPOSAL = `/**
 * @proposal
 * why: The kit stepper is horizontal and static.
 * description: A vertical stepper that expands the active step.
 * figma: https://figma.com/file/12345
 * proposedApi:
 *   activeStep: "number"
 */`
const STEPPER = `import { Stack } from '@/primitives'\n${PROPOSAL}\nexport function Stepper() {\n  return <Stack gap="sm" />\n}\n`
const DEVIATION = '/** @deviation layout.root-align: the card sits at the end */\nexport function'
const DETAIL = OVERLAP.replace("import { Stack } from '@/primitives'", "import { Stack } from '@/primitives'\nimport { Stepper } from '../components/Stepper'")
  .replace('export function', DEVIATION)
  .replace('align="stretch"', 'align="end"') // breaks layout.root-align, declared above
  .replace('<ContentCard ', '<Stepper />\n          <ContentCard ')
// web/protos/ana/: one flow folder (a state per file, and flow.ts) and the designer's own components/.
const FOLDER = (detail: string, flow: string): Record<string, string> => ({
  'jornada/home.tsx': HOME,
  'jornada/rail.tsx': RAIL,
  'jornada/detail.tsx': detail,
  'jornada/flow.ts': flow,
  'components/Stepper.tsx': STEPPER,
})

const laws = (name: string, detail: string, flow = FLOW) => {
  const dir = `${DIR}/${name}/web/protos/ana`
  for (const [f, code] of Object.entries(FOLDER(detail, flow))) {
    mkdirSync(dirname(`${dir}/${f}`), { recursive: true })
    writeFileSync(`${dir}/${f}`, code)
  }
  const r = spawnSync('npx', ['vite-node', '--config', 'vitest.config.ts', 'scripts/check-laws.ts', '--', `${dir}/jornada`, '--json', '--require-render'], {
    encoding: 'utf8',
    cwd: ROOT,
    env: { ...process.env, VITEST: '' },
    maxBuffer: 1 << 26,
  })
  return { code: r.status, stdout: r.stdout, stderr: r.stderr, json: r.stdout ? JSON.parse(r.stdout) : null }
}

describe('a realistic designer folder, end to end', () => {
  it('passes check:laws, and the PR report has every section', () => {
    const r = laws('ok', DETAIL)
    if (/Chromium could not start/.test(r.stderr)) return console.warn('e2e: no Chromium, skipped')
    expect(r.stderr + JSON.stringify(r.json?.reports.map((x: { problems: unknown }) => x.problems))).toBe(r.stderr + '[[],[],[]]')
    expect(r.code, r.stderr).toBe(0)
    const md = renderReport(r.json, ROOT)
    for (const h of ['Blocking problems (0)', 'Legibility warnings (', 'Declared deviations (1)', 'Primitives and proposals (2)', 'Not read (', 'Flows (1)'])
      expect(md).toContain(h)
    expect(md).toMatch(/Legibility warnings \([1-9]/)
    expect(md).toMatch(/Not read \([1-9]/)
    expect(md).toContain('reuse `.checks-corpus-e2e/ok/web/protos/ana/jornada/home.tsx:')
    expect(md).toContain('proposal `.checks-corpus-e2e/ok/web/protos/ana/components/Stepper.tsx`')
    expect(md).toContain('`.checks-corpus-e2e/ok/web/protos/ana/jornada/flow.ts` — 3 states: detail, home, rail')
  }, 300_000)

  it('exits 1 when one law is broken', () => {
    const r = laws('broken', DETAIL.replace(DEVIATION, 'export function'))
    if (/Chromium could not start/.test(r.stderr)) return console.warn('e2e: no Chromium, skipped')
    expect(r.code).toBe(1)
    expect(renderReport(r.json, ROOT)).toMatch(/Blocking problems \([1-9]/)
    expect(r.stdout).toContain('layout.root-align')
  }, 300_000)

  it('exits 1 when only the flow is broken, and the report names flow.ts among the blocking problems', () => {
    // Home (level 1) straight to the detail (level 3): the screens are fine, the transition is not.
    const r = laws('jump', DETAIL, FLOW.replace("{ from: 'home', key: 'up', to: 'rail' }", "{ from: 'home', key: 'up', to: 'rail' },\n    { from: 'home', key: 'enter', to: 'detail' }"))
    if (/Chromium could not start/.test(r.stderr)) return console.warn('e2e: no Chromium, skipped')
    expect(r.json.reports.flatMap((x: { problems: unknown[] }) => x.problems)).toEqual([])
    expect(r.code).toBe(1)
    expect(renderReport(r.json, ROOT)).toMatch(/Blocking problems \(1\)\n\n- `[^`]*jornada\/flow\.ts` \[flow\.next-level\]/)
  }, 300_000)
})

describe('web/protos/CLAUDE.md only names things that exist', () => {
  const doc = readFileSync(`${ROOT}web/protos/CLAUDE.md`, 'utf8')
  const scripts = JSON.parse(readFileSync(`${ROOT}package.json`, 'utf8')).scripts as Record<string, string>
  const source = ['scripts/check-laws.ts', 'src/shared/export/fromTsx.ts', 'scripts/pr-report.ts'].map((f) => readFileSync(`${ROOT}${f}`, 'utf8')).join('\n')
  const real = (p: string): boolean => [ROOT, `${ROOT}web/protos/`, `${ROOT}src/`].some((b) => existsSync(b + p) || existsSync(`${b}${p}.tsx`) || existsSync(`${b}${p}.ts`) || existsSync(`${b}${p}/index.ts`))

  it('npm run scripts exist', () => {
    // After `cd web &&` the script is one of web/package.json, otherwise one of the root's.
    const webScripts = JSON.parse(readFileSync(`${ROOT}web/package.json`, 'utf8')).scripts as Record<string, string>
    const runs = [...doc.matchAll(/(cd web && )?npm run ([\w:-]+)/g)].map((m) => ({ web: !!m[1], name: m[2] }))
    expect(runs.length).toBeGreaterThan(0)
    for (const r of runs) expect(r.web ? webScripts : scripts, `${r.web ? 'web: ' : ''}${r.name}`).toHaveProperty(r.name)
  })
  it('file paths exist', () => {
    const paths = [...doc.matchAll(/`([\w./@-]+\/[\w./-]+\.(?:tsx?|md|json|mjs))`|\]\(([\w./-]+)\)/g)].map((m) => m[1] ?? m[2])
    expect(paths.length).toBeGreaterThan(0)
    for (const p of paths) expect(real(p), p).toBe(true)
  })
  it('@ imports and @ tokens exist', () => {
    for (const m of doc.matchAll(/'(@\/[\w/-]+)'/g)) expect(real(m[1].slice(2)), m[1]).toBe(true)
    const tokens = [...new Set([...doc.matchAll(/(?<![\w/'])@([a-z]+)\b/g)].map((m) => m[1]))]
    expect(tokens).toEqual(expect.arrayContaining(['deviation', 'reuse', 'proposal']))
    for (const t of tokens) expect(source, `@${t}`).toContain(`@${t}`)
  })
})
