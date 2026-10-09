import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { reportLines, runChecks } from '../../scripts/check-laws'
import { CASES } from './corpus/cases'
import { cleanCorpus, writeCase } from './run'

afterAll(cleanCorpus)
afterEach(() => void vi.unstubAllEnvs())

const entryOf = (id: string): string => writeCase(CASES.find((c) => c.id === id)!)

describe('the check run: what check:laws, the edit hook and CI execute', () => {
  it('a clean screen: one report, no finding, exit 0', async () => {
    const run = await runChecks([entryOf('clean-home')], { render: false })
    expect(run.reports.map((r) => r.problems)).toEqual([[]])
    expect({ findings: run.findings, exitCode: run.exitCode }).toEqual({ findings: [], exitCode: 0 })
  }, 120_000)

  it('a local component is checked through the screens of its folder, not as a screen', async () => {
    const screen = entryOf('local-component-with-proposal')
    const run = await runChecks([screen.replace(/s\.tsx$/, 'components/Stepper.tsx')], { render: false })
    expect(run.reports.map((r) => r.file)).toEqual([screen])
    expect(run.exitCode).toBe(0)
  }, 120_000)

  it('a data file is checked through the screens of its folder too', async () => {
    const screen = entryOf('import-own-data')
    const run = await runChecks([screen.replace(/s\.tsx$/, 'data.ts')], { render: false })
    expect(run.reports.map((r) => r.file)).toEqual([screen])
  }, 120_000)
})

describe('a flow folder', () => {
  it('a flow.ts problem is a finding and exit 1, though every state holds its laws', async () => {
    const home = Object.values(CASES.find((c) => c.id === 'clean-home')!.files)[0]
    const flowTs = writeCase({ id: 'run-flow', title: '', files: { 'home.tsx': home, 'flow.ts': "export default { start: 'nowhere', transitions: [] }" }, entry: 'flow.ts', expect: { exit: 1, laws: [] } })
    const run = await runChecks([flowTs], { render: false })
    expect(run.reports.map((r) => [r.file.replace(/^.*\//, ''), r.problems])).toEqual([['home.tsx', []]])
    expect(run.findings).toEqual([{ rule: 'blueprint.dsl', file: flowTs, message: expect.stringMatching(/"nowhere"/) }])
    expect(run.exitCode).toBe(1)
  }, 120_000)
})

describe('a render audit that cannot run (no Chromium)', () => {
  it('not required: exit 0, and every report and the notes say it did not run', async () => {
    vi.stubEnv('CHROMIUM_PATH', '/nonexistent')
    const run = await runChecks([entryOf('clean-home')])
    expect(run.reports[0].warnings.join()).toMatch(/render check did not run: Chromium could not start/)
    expect(run.notes.join()).toMatch(/^Chromium could not start .* the render check was skipped\.$/)
    expect({ findings: run.findings, exitCode: run.exitCode }).toEqual({ findings: [], exitCode: 0 })
  }, 120_000)

  it('required: a render.not-run finding per screen, naming the cause, and exit 1 with no problem in any report', async () => {
    vi.stubEnv('CHROMIUM_PATH', '/nonexistent')
    const entry = entryOf('clean-home')
    const run = await runChecks([entry], { requireRender: true })
    expect(run.findings).toEqual([{ rule: 'render.not-run', file: entry, message: expect.stringMatching(/Chromium could not start/) }])
    expect(run.notes.join()).toMatch(/Chromium could not start .* — --require-render: failing$/)
    expect({ problems: run.reports[0].problems, exitCode: run.exitCode }).toEqual({ problems: [], exitCode: 1 })
  }, 120_000)
})

describe('the run as the lines check:laws prints and the edit hook hands back', () => {
  it('names each file from the repo root, with the line, the rule and what holds', async () => {
    const run = await runChecks([entryOf('clean-home'), entryOf('focus-two')], { render: false })
    const lines = reportLines(run)
    expect(lines[0]).toMatch(/^\.checks-corpus\/w\w+\/clean-home\/\S+\.tsx  laws hold, no pattern broken undeclared \(tsc, tokens, layers, focus, rules book\)$/)
    expect(lines.slice(1).join('\n')).toMatch(/^\.checks-corpus\/w\w+\/focus-two\/s\.tsx:\d+  \[focus\.single\] 2 focused elements/m)
    expect(lines.join('\n')).not.toMatch(/focus-two\/s\.tsx  laws hold/)
  }, 120_000)
})
