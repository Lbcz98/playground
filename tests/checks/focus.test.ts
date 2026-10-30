import { afterAll, describe, expect, it } from 'vitest'
import { checkLaws, runChecks } from '../../scripts/check-laws'
import { renderAuditFiles } from '../../scripts/render-audit'
import { browserDescribe } from './browser'
import { CASES, type CorpusCase } from './corpus/cases'
import { cleanCorpus, writeCase } from './run'

afterAll(cleanCorpus)
const base = CASES.find((c) => c.id === 'local-component-holds-focus')!
const variant = (id: string, instances: string, extra: Record<string, string> = {}): CorpusCase => ({
  ...base, id, files: { ...base.files, 's.tsx': base.files['s.tsx'].replace('<Pick />', instances), ...extra },
})

describe('source focus counts instances and guards only their ancestry', () => {
  it('counts two independent instances of the same imported component', () => {
    const report = checkLaws(writeCase(variant('focus-twins', '<Pick /><Pick />')))
    expect(report.problems.filter((p) => p.law === 'focus.single')).toEqual([
      expect.objectContaining({ message: expect.stringContaining('2 focused elements:') }),
    ])
  }, 120_000)

  it('counts repeated instances at each depth', () => {
    const c = variant('focus-nested', '<Pair /><Pair />', {
      'components/Pair.tsx': "import { Pick } from './Pick'\nexport function Pair() { return <><Pick /><Pick /></> }",
    })
    c.files['s.tsx'] = c.files['s.tsx'].replace("import { Pick } from './components/Pick'", "import { Pair } from './components/Pair'")
    const report = checkLaws(writeCase(c), { skipValidator: true })
    expect(report.problems.find((p) => p.law === 'focus.single')?.message).toContain('4 focused elements:')
  }, 120_000)

  it('terminates a recursive import without dropping the next independent instance', () => {
    const c = variant('focus-cycle', '<Pick /><Pick />', {
      'components/Pick.tsx': base.files['components/Pick.tsx'].replace('return <InteractivityButton', 'return <><Again /><InteractivityButton').replace(' />\n}', ' /></>\n}') + "\nimport { Again } from './Again'\n",
      'components/Again.tsx': "import { Pick } from './Pick'\nexport function Again(): React.ReactNode { return <Pick /> }",
    })
    const report = checkLaws(writeCase(c), { skipValidator: true })
    expect(report.problems.find((p) => p.law === 'focus.single')?.message).toContain('2 focused elements:')
  }, 120_000)
})

browserDescribe('standalone runtime focus', () => {
  it('the audit reproduction fails requireRender with two local instances', async () => {
    const run = await runChecks([writeCase(variant('focus-twins-render', '<Pick /><Pick />'))], { requireRender: true })
    expect(run.notes).toEqual([])
    expect(run.findings).toEqual([])
    expect(run.exitCode).toBe(1)
    expect(run.reports[0].problems).toEqual(expect.arrayContaining([
      expect.objectContaining({ law: 'focus.single', message: expect.stringContaining('2 focused elements:') }),
      expect.objectContaining({ law: 'focus.single', source: 'render' }),
    ]))
  }, 180_000)

  it.each([
    ['mapped', '{[1, 2].map((n) => <Pick key={n} />)}', 2],
    ['conditional', '{Boolean(0) && <Pick />}', 0],
  ] as const)('checks %s content that source counting cannot resolve', async (id, content, count) => {
    const run = await runChecks([writeCase(variant(`focus-${id}`, content))], { requireRender: true })
    expect(run.notes).toEqual([])
    expect(run.reports[0].problems.filter((p) => p.law === 'focus.single')).toEqual([
      expect.objectContaining({ source: 'render', message: expect.stringContaining(`${count} elements are drawn focused`) }),
    ])
    expect(run.exitCode).toBe(1)
  }, 180_000)

  it('allows zero focus at level 0 and ignores focus-look-only labels', async () => {
    const home = CASES.find((c) => c.id === 'clean-home')!
    const code = home.files[home.entry]
    const empty = { ...home, id: 'focus-level-zero', files: { [home.entry]: code.replace('model="home" level={1}', 'model="alert" level={0}').replace('focusedItem="program"', 'focusedItem={null}') } }
    const label = { ...home, id: 'focus-look-only', files: { [home.entry]: "import { LabelVideo } from '@/ui-kit/LabelVideo'\n" + code.replace('</Screen>', '<LabelVideo interactionState="focus" />\n</Screen>') } }
    const results = await renderAuditFiles([writeCase(empty), writeCase(label)])
    for (const r of results) {
      expect(r.error).toBeUndefined()
      expect(r.issues.filter((i) => i.ruleId === 'focus.single')).toEqual([])
    }
  }, 180_000)
})
