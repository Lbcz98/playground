import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { checkLaws } from '../../../scripts/check-laws'
import { DTV_TEMPLATES } from '../../../scripts/storybook/dtv-templates'
import type { BlueprintDocument } from '../blueprint'
import { exportBlueprintToTsx } from './toTsx'

/** Inside the repo so `@/…` and the kit resolve; git-ignored; removed afterwards. */
const OUT = join(fileURLToPath(new URL('../../..', import.meta.url)), '.export-test-laws')
const write = (name: string, body: string): string => {
  const file = join(OUT, name)
  writeFileSync(file, body)
  return file
}
const screen = (inner: string, model = 'home', level = 1): string => `
import { Stack } from '@/primitives'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { MainMenu } from '@/ui-kit/MainMenu'
import { Screen } from '@/ui-kit/Screen'
export default function S() {
  return (
    <Screen model="${model}" level={${level}}>
      <Stack gap="sm">${inner}</Stack>
    </Screen>
  )
}
`

beforeAll(() => mkdirSync(OUT, { recursive: true }))
afterAll(() => rmSync(OUT, { recursive: true, force: true }))

const STATIC = { skipValidator: true }
const lawsOf = (file: string): string[] => checkLaws(file, STATIC).problems.map((p) => p.law)

describe('check:laws', () => {
  it('passes a screen with one focus (the menu) and a rail at rest', () => {
    const file = write('ok.tsx', screen('<MainMenu /><InteractivityButton title="a" interactionState="default" />'))
    expect(checkLaws(file, STATIC).problems).toEqual([])
  })

  it('counts the kit defaults: an InteractivityButton with no state is focused', () => {
    const file = write('two.tsx', screen('<MainMenu /><InteractivityButton title="a" />'))
    expect(lawsOf(file)).toEqual(['focus.single'])
  })

  it('lets focus move to a rail card when the menu gives it up', () => {
    const file = write('moved.tsx', screen('<MainMenu focusedItem={null} /><InteractivityButton title="a" />'))
    expect(checkLaws(file, STATIC).problems).toEqual([])
  })

  it('flags raw values, inline style and host elements as tokens.only / component.api', () => {
    const file = write('raw.tsx', screen('<MainMenu /><div style={{ color: "#e10600", gap: "13px" }} />'))
    const laws = new Set(lawsOf(file))
    expect(laws.has('tokens.only')).toBe(true)
    expect(laws.has('component.api')).toBe(true)
  })

  it('flags a prop the kit does not have (tsc is component.api)', () => {
    const file = write('prop.tsx', screen('<MainMenu bogus="x" />'))
    expect(lawsOf(file)).toContain('component.api')
  })

  it('needs a Screen naming a real layer model; level 0 allows no focus', () => {
    expect(lawsOf(write('nomodel.tsx', screen('<MainMenu />', 'nope')))).toContain('layers.stack')
    expect(lawsOf(write('none.tsx', 'export default function S() { return null }'))).toContain('layers.stack')
    const clean = `import { Screen } from '@/ui-kit/Screen'\nexport default function S() { return <Screen model="alert" level={0}>{null}</Screen> }\n`
    expect(lawsOf(write('l0.tsx', clean))).toEqual([])
  })

  it('lists declared deviations without judging them', () => {
    const file = write('dev.tsx', `/** @deviation layout.no-static-center: asked for */\n${screen('<MainMenu />')}`)
    expect(checkLaws(file, STATIC).deviations).toEqual([{ ruleId: 'layout.no-static-center', why: 'asked for' }])
  })
})

describe('check:laws — the rules book, on the screen read back as a blueprint', () => {
  const home = DTV_TEMPLATES.find((t) => t.id === 'cards-left' || t.id === 'interactivity-cards-right')!.blueprint as BlueprintDocument
  const base = exportBlueprintToTsx(home).code

  it('is clean on an exported reference screen', () => {
    expect(checkLaws(write('ref.tsx', base)).problems).toEqual([])
  }, 120_000)

  it('reports a pattern broken without a declaration, and accepts it declared', () => {
    const broken = base.replace('align="stretch"', 'align="end"')
    expect(broken).not.toBe(base)
    const undeclared = checkLaws(write('undeclared.tsx', broken)).problems
    expect(undeclared.map((p) => p.law)).toEqual(['layout.root-align'])
    expect(undeclared[0].message).toMatch(/declare it|declare i/)
    const declared = broken.replace('export function', '/** @deviation layout.root-align: the card sits at the end */\nexport function')
    expect(checkLaws(write('declared.tsx', declared)).problems).toEqual([])
  }, 120_000)

  it('reports a deviation declared for a rule nothing breaks', () => {
    const forNothing = base.replace('export function', '/** @deviation layout.root-align: not broken */\nexport function')
    const problems = checkLaws(write('nothing.tsx', forNothing)).problems
    expect(problems.map((p) => p.message).join('\n')).toMatch(/declared for nothing/)
  }, 120_000)
})
