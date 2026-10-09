import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { focusProblems, type FlowReport } from '../../scripts/flow-probe'
import { DTV_TEMPLATES } from '../../scripts/storybook/dtv-templates'
import type { BlueprintDocument } from '../../src/shared/blueprint'
import { exportBlueprintToTsx } from '../../src/shared/export/toTsx'

// Throwaway flow folders (git-ignored, inside the repo so `@/…` resolves), played by the real CLI.
const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DIR = `${ROOT}.checks-flow`
afterAll(() => rmSync(DIR, { recursive: true, force: true }))

const ref = (id: string): string => exportBlueprintToTsx(DTV_TEMPLATES.find((t) => t.id === id)!.blueprint as BlueprintDocument).code
const swap = (code: string, from: string, to: string): string => {
  expect(code).toContain(from)
  return code.replace(from, to)
}
const HOME = ref('home')
const RAIL = ref('interactivity-buttons-right')
const DETAIL = ref('interactivity-cards-right')
const FLOW = `export default {
  start: 'home',
  transitions: [
    { from: 'home', key: 'up', to: 'rail' },
    { from: 'rail', key: 'enter', to: 'detail' },
    { from: 'rail', key: 'down', to: 'home' },
  ],
}
`
const BACK_FOCUSED = '<RoundedButton label="Voltar" interactionState="focus" />'
const CARD_RESTING = '<ContentCard interactionState="default"'

const probe = (name: string, changed: Record<string, string>, ...flags: string[]) => {
  const dir = `${DIR}/${name}`
  mkdirSync(dir, { recursive: true })
  for (const [file, code] of Object.entries({ 'flow.ts': FLOW, 'home.tsx': HOME, 'rail.tsx': RAIL, 'detail.tsx': DETAIL, ...changed }))
    writeFileSync(`${dir}/${file}`, code)
  const r = spawnSync('npx', ['vite-node', '--config', 'vitest.config.ts', 'scripts/flow-probe.ts', '--', dir, ...flags], { encoding: 'utf8', cwd: ROOT, env: { ...process.env, VITEST: '' } })
  const noBrowser = /Chromium could not start|Playwright is not installed/.test(r.stderr)
  if (noBrowser) {
    expect(r.status, 'a flow that was not played does not pass').toBe(1)
    console.warn('flow probe: no Chromium, skipped')
  }
  const report = !noBrowser && flags.includes('--json') ? (JSON.parse(r.stdout) as FlowReport) : null
  return { skipped: noBrowser, code: r.status, stdout: r.stdout, stderr: r.stderr, report, rules: [...new Set(report?.problems.map((p) => p.rule))].sort() }
}

describe('check:flow plays a flow folder', () => {
  it('passes a clean flow: every state walked, forward and back', () => {
    const r = probe('clean', {}, '--json')
    if (r.skipped) return
    expect(r.report?.problems, r.stderr).toEqual([])
    expect(r.report?.states).toEqual(['home', 'rail', 'detail'])
    // up, esc, enter, esc, and down (back to a state already behind).
    expect(r.report?.presses).toBe(5)
    expect(r.code).toBe(0)
  }, 120_000)

  it('focus.single: two focused elements in one state', () => {
    const r = probe('two-focus', { 'rail.tsx': swap(RAIL, 'title="Opções de áudio" interactionState="selected"', 'title="Opções de áudio" interactionState="focus"') }, '--json')
    if (r.skipped) return
    expect(r.rules).toEqual(['focus.single'])
    expect(r.report?.problems[0]).toMatchObject({ rule: 'focus.single', state: 'rail' })
    expect(r.report?.problems[0].message).toMatch(/2 elements are drawn focused .*<InteractivityButton>.*rest the others/)
    expect(r.code).toBe(1)
  }, 120_000)

  it('level.initial-focus: level 3 entered with the focus already on the card (the audited case)', () => {
    const detail = swap(swap(DETAIL, BACK_FOCUSED, BACK_FOCUSED.replace('focus', 'default')), CARD_RESTING, CARD_RESTING.replace('default', 'focus'))
    const r = probe('card-start', { 'detail.tsx': detail }, '--json')
    if (r.skipped) return
    expect(r.rules).toEqual(['level.initial-focus'])
    expect(r.report?.problems[0]).toMatchObject({ rule: 'level.initial-focus', state: 'detail' })
    expect(r.report?.problems[0].message).toMatch(/focus is on <ContentCard>, not on <CloseButton> or <RoundedButton>/)
    expect(r.code).toBe(1)
  }, 120_000)

  it('level 3: the back button first, then a key moves the focus onto the card, and back again', () => {
    const card = swap(swap(DETAIL, BACK_FOCUSED, BACK_FOCUSED.replace('focus', 'default')), CARD_RESTING, CARD_RESTING.replace('default', 'focus'))
    const flow = FLOW.replace("    { from: 'rail', key: 'down', to: 'home' },", "    { from: 'rail', key: 'down', to: 'home' },\n    { from: 'detail', key: 'up', to: 'card' },\n    { from: 'card', key: 'down', to: 'detail' },")
    const r = probe('card-after', { 'flow.ts': flow, 'card.tsx': card }, '--json')
    if (r.skipped) return
    expect(r.report?.problems, r.stderr).toEqual([])
    expect(r.report?.states).toEqual(['home', 'rail', 'detail', 'card'])
    expect(r.code).toBe(0)
  }, 120_000)

  it('level.initial-focus: level 2 with the focus on a content card, not on a rail button', () => {
    const r = probe('wrong-start', { 'rail.tsx': swap(DETAIL, CARD_RESTING, CARD_RESTING.replace('default', 'focus')).replace(BACK_FOCUSED, BACK_FOCUSED.replace('focus', 'default')).replace('model="interactivity-cards-right"', 'model="interactivity-buttons-right"').replace('level={3}', 'level={2}') }, '--json')
    if (r.skipped) return
    expect(r.rules).toEqual(['level.initial-focus'])
    expect(r.report?.problems[0]).toMatchObject({ rule: 'level.initial-focus', state: 'rail' })
    expect(r.report?.problems[0].message).toMatch(/focus is on <ContentCard>, not on <InteractivityButton>/)
    expect(r.code).toBe(1)
  }, 120_000)

  it('the Home two-step: a declared back to the bug, then to hidden, which needs no file', () => {
    const flow = `export default {
  start: 'bug',
  transitions: [
    { from: 'bug', key: 'left', to: 'home' },
    { from: 'home', key: 'right', to: 'bug' },
    { from: 'home', key: 'back', to: 'bug' },
    { from: 'bug', key: 'back', to: 'hidden' },
  ],
}
`
    const r = probe('two-step', { 'flow.ts': flow, 'bug.tsx': swap(HOME, 'focusedItem="program"', 'focusedItem="channel-bug"') }, '--json')
    if (r.skipped) return
    expect(r.report?.problems, r.stderr).toEqual([])
    expect(r.report?.states).toEqual(['bug', 'home', 'hidden'])
    expect(r.code).toBe(0)
  }, 120_000)

  it('both, as text: the card focused next to the focused button (the audited case)', () => {
    const r = probe('card-and-button', { 'detail.tsx': swap(DETAIL, CARD_RESTING, CARD_RESTING.replace('default', 'focus')) })
    if (r.skipped) return
    expect(r.stdout).toMatch(/\[focus\.single\] detail: 2 elements/)
    expect(r.stdout).toMatch(/\[level\.initial-focus\] detail: level 3/)
    expect(r.code).toBe(1)
  }, 120_000)

  // The three below break what the player gives every flow; a state can only do it by going around the standard.
  const DEFAULT = 'export default ScreenView'
  const HOOKS = "import { useEffect, useState } from 'react'\n"

  it('flow.remount: a state whose root is not the <Screen> itself', () => {
    const r = probe('wrapped', { 'detail.tsx': swap(DETAIL, DEFAULT, 'const Wrapped = (): ReactNode => <ScreenView />\nexport default Wrapped') }, '--json')
    if (r.skipped) return
    expect(r.rules).toEqual(['flow.remount'])
    expect(r.report?.problems.map((p) => p.transition)).toEqual(['rail —enter→ detail', 'detail —back→ rail'])
    expect(r.code).toBe(1)
  }, 120_000)

  it('flow.blank-frame: a state that shows nothing before its <Screen>', () => {
    const late = `${HOOKS}function Late(): ReactNode {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 100)
    return () => clearTimeout(t)
  }, [])
  return on ? <ScreenView /> : null
}
const State = (): ReactNode => <Late />
export default State`
    const r = probe('late', { 'detail.tsx': swap(DETAIL, DEFAULT, late) }, '--json')
    if (r.skipped) return
    expect(r.rules).toContain('flow.blank-frame')
    expect(r.report?.problems.find((p) => p.rule === 'flow.blank-frame')).toMatchObject({ state: 'detail', transition: 'rail —enter→ detail' })
    expect(r.code).toBe(1)
  }, 120_000)

  it('flow.transition: a key that leads to a state that does not load', () => {
    const r = probe('ghost', { 'flow.ts': swap(FLOW, "{ from: 'rail', key: 'down', to: 'home' }", "{ from: 'rail', key: 'down', to: 'ghost' }") }, '--json')
    if (r.skipped) return
    expect(r.rules).toEqual(['flow.transition'])
    expect(r.report?.problems[0]).toMatchObject({ state: 'ghost', transition: 'rail —down→ ghost' })
    expect(r.code).toBe(1)
  }, 120_000)

  it('flow.focus-memory: a state that takes Back for itself', () => {
    const trap = `${HOOKS}function Trap(): ReactNode {
  useEffect(() => {
    const stop = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') e.stopImmediatePropagation()
    }
    window.addEventListener('keydown', stop, true)
    return () => window.removeEventListener('keydown', stop, true)
  }, [])
  return null
}
`
    const footer = '<ContentCardFooter caption="Atualizado há 1 min" />'
    const r = probe('own-keys', { 'detail.tsx': trap + swap(DETAIL, footer, `${footer}\n<Trap />`) }, '--json')
    if (r.skipped) return
    expect(r.rules).toEqual(['flow.focus-memory'])
    expect(r.report?.problems[0]).toMatchObject({ state: 'detail', transition: 'detail —back→ rail' })
    expect(r.report?.problems[0].message).toMatch(/Back on "detail" showed "detail", not "rail"/)
    expect(r.code).toBe(1)
  }, 120_000)
})

describe('focusProblems', () => {
  const read = (model: string, ...components: string[]) => ({ model, level: null, focused: components.map((component) => ({ component, text: '' })) })
  const rules = (model: string, source: string, ...components: string[]) => focusProblems('s', read(model, ...components), source).map((p) => p.rule)

  it('allows no focus only on level 0', () => {
    expect(rules('alert', '')).toEqual([])
    expect(rules('home', '')).toEqual(['focus.single'])
    expect(rules('home', '', 'MainMenu')).toEqual([])
  })
  it('a declared deviation covers the pattern, never the law', () => {
    const declared = '/** @deviation level.initial-focus: the card opens focused */'
    expect(rules('interactivity-buttons-right', '', 'ContentCard')).toEqual(['level.initial-focus'])
    expect(rules('interactivity-buttons-right', declared, 'ContentCard')).toEqual([])
    expect(rules('interactivity-buttons-right', declared, 'ContentCard', 'InteractivityButton')).toEqual(['focus.single'])
  })
  it('level 3 is entered on the back button; moving inside it may put the focus on the content card', () => {
    const moved = (...components: string[]) => focusProblems('s', read('interactivity-cards-right', ...components), '', false).map((p) => p.rule)
    expect(rules('interactivity-cards-right', '', 'RoundedButton')).toEqual([])
    expect(rules('interactivity-cards-right', '', 'ContentCard')).toEqual(['level.initial-focus'])
    expect(moved('ContentCard')).toEqual([])
    expect(moved('ContentCard', 'RoundedButton')).toEqual(['focus.single'])
    expect(rules('interactivity-cards-right', '', 'InteractivityButton')).toEqual(['level.initial-focus'])
  })
})
