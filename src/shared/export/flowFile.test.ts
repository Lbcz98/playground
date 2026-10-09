import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { checkFlow } from '../../../scripts/check-laws'
import { parseFlowFile } from './flowFile'

const ok = (t: string) => `export default { start: 'a', transitions: [${t}] }`

describe('parseFlowFile', () => {
  it('reads start and transitions', () => {
    const r = parseFlowFile(ok(`{ from: 'a', key: 'up', to: 'b' }`))
    expect(r.problems).toEqual([])
    expect(r.flow).toEqual({ start: 'a', transitions: [{ from: 'a', key: 'up', to: 'b' }] })
  })
  it('sees through `satisfies`', () => {
    expect(parseFlowFile(`export default { start: 'a', transitions: [] } satisfies object`).flow?.start).toBe('a')
  })
  it('accepts back as an explicit transition', () => {
    expect(parseFlowFile(ok(`{ from: 'a', key: 'back', to: 'b' }`)).flow?.transitions[0].key).toBe('back')
  })
  it('refuses a key it does not know, an extra key, and a non-literal flow', () => {
    expect(parseFlowFile(ok(`{ from: 'a', key: 'ok', to: 'b' }`)).problems[0]).toMatch(/not one of/)
    expect(parseFlowFile(`export default { start: 'a', transitions: [], x: 1 }`).problems[0]).toMatch(/unknown key "x"/)
    expect(parseFlowFile(`const t = []\nexport default { start: 'a', transitions: t }`).problems[0]).toMatch(/plain object literal/)
    expect(parseFlowFile(`export const x = 1`).problems[0]).toMatch(/export default/)
  })
})

/** Inside the repo so `@/…` and the kit resolve; git-ignored; removed afterwards. */
const OUT = join(fileURLToPath(new URL('../../..', import.meta.url)), '.export-test-flow')
const home = (cards: number) => `
import { Stack } from '@/primitives'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { MainMenu } from '@/ui-kit/MainMenu'
import { Screen } from '@/ui-kit/Screen'
export default function H() {
  return (
    <Screen model="home-buttons-left" level={1} focusSide="left">
      <Stack direction="column" justify="end" gap="sm" padding="none" grow>
        <Stack direction="column" justify="end" gap="2xl">
          <InteractivityMenu align="start">${'<InteractivityButton title="x" interactionState="default" />'.repeat(cards)}</InteractivityMenu>
          <MainMenu focusedItem="schedule" />
        </Stack>
      </Stack>
    </Screen>
  )
}`
const rail = (cards: number) => `
import { Stack } from '@/primitives'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { InteractivityMenu } from '@/ui-kit/InteractivityMenu'
import { Screen } from '@/ui-kit/Screen'
export default function R() {
  return (
    <Screen model="interactivity-buttons-left" level={2} focusSide="left">
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow>
        <InteractivityMenu align="start"><InteractivityButton title="x" interactionState="focus" />${'<InteractivityButton title="x" interactionState="selected" />'.repeat(cards - 1)}</InteractivityMenu>
      </Stack>
    </Screen>
  )
}`
const detail = `
import { Stack } from '@/primitives'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { Screen } from '@/ui-kit/Screen'
export default function D() {
  return (
    <Screen model="interactivity-cards-left" level={3} focusSide="left" anchored={<RoundedButton label="Voltar" interactionState="focus" />}>
      <Stack direction="column" justify="end" align="stretch" gap="sm" padding="none" grow><Stack direction="row" gap="sm" /></Stack>
    </Screen>
  )
}`

function flowOf(name: string, files: Record<string, string>): string {
  const dir = join(OUT, name)
  mkdirSync(dir, { recursive: true })
  for (const [f, body] of Object.entries(files)) writeFileSync(join(dir, f), body)
  return dir
}
const T = (from: string, key: string, to: string) => `{ from: '${from}', key: '${key}', to: '${to}' }`
const flow = (start: string, ...t: string[]) => `export default { start: '${start}', transitions: [${t.join(',')}] }`
const messages = (dir: string) => checkFlow(dir).problems.map((p) => `${p.law}: ${p.message}`)

beforeAll(() => mkdirSync(OUT, { recursive: true }))
afterAll(() => rmSync(OUT, { recursive: true, force: true }))

describe('checkFlow', () => {
  it('passes a Home → rail → detail flow', () => {
    const dir = flowOf('good', {
      'home.tsx': home(3),
      'rail.tsx': rail(3),
      'detail.tsx': detail,
      'flow.ts': flow('home', T('home', 'up', 'rail'), T('rail', 'enter', 'detail'), T('rail', 'down', 'home')),
    })
    expect(messages(dir)).toEqual([])
  })

  it('names a state that has no file, and a key bound twice', () => {
    const dir = flowOf('missing', {
      'home.tsx': home(3),
      'rail.tsx': rail(3),
      'flow.ts': flow('home', T('home', 'up', 'rail'), T('home', 'up', 'rail'), T('rail', 'enter', 'nowhere')),
    })
    const m = messages(dir).join('\n')
    expect(m).toMatch(/"nowhere" is not a state/)
    expect(m).toMatch(/binds up twice/)
  })

  it('flags a state nothing leads to', () => {
    const dir = flowOf('orphan', {
      'home.tsx': home(3),
      'rail.tsx': rail(3),
      'detail.tsx': detail,
      'flow.ts': flow('home', T('home', 'up', 'rail')),
    })
    expect(messages(dir).join('\n')).toMatch(/State "detail" is never reached/)
  })

  it('refuses a jump from Home straight to a third-level page', () => {
    const dir = flowOf('jump', {
      'home.tsx': home(3),
      'detail.tsx': detail,
      'flow.ts': flow('home', T('home', 'enter', 'detail')),
    })
    expect(messages(dir).join('\n')).toMatch(/flow\.next-level: .*jumps from level 1 to level 3/)
  })

  it('holds the rail to the same cards on Home and in the entered page', () => {
    const dir = flowOf('rail-count', {
      'home.tsx': home(3),
      'rail.tsx': rail(2),
      'flow.ts': flow('home', T('home', 'up', 'rail'), T('rail', 'down', 'home')),
    })
    expect(messages(dir).join('\n')).toMatch(/flow\.rail-consistency/)
  })

  const real = (...extra: string[]) => ({
    'home-bug.tsx': home(3),
    'home-program.tsx': home(3),
    'rail-program.tsx': rail(3),
    detail: detail,
    'flow.ts': flow('home-bug', T('home-bug', 'left', 'home-program'), T('home-program', 'up', 'rail-program'), T('rail-program', 'down', 'home-program'), T('rail-program', 'enter', 'detail'), ...extra),
  })
  const files = (name: string, extra: string[] = [], swap?: (f: Record<string, string>) => void) => {
    const { detail: d, ...f } = real(...extra) as Record<string, string>
    f['detail.tsx'] = d
    swap?.(f)
    return flowOf(name, f)
  }

  it('passes the real-app sequence with the home-bar Back two-step', () => {
    expect(messages(files('real', [T('home-program', 'back', 'home-bug'), T('home-bug', 'back', 'hidden')]))).toEqual([])
  })

  it('flow.level-keys: Enter from Home to the rail is refused', () => {
    const dir = files('keys', [], (f) => (f['flow.ts'] = f['flow.ts'].replace("key: 'up'", "key: 'enter'")))
    expect(messages(dir).join('\n')).toMatch(/flow\.level-keys: .*home-program —enter→ rail-program/)
  })

  it('flow.no-wrap: left/right that loops back to the first item is refused', () => {
    const ring = [T('home-program', 'right', 'home-bug'), T('home-bug', 'right', 'home-program')]
    expect(messages(files('wrap', ring)).join('\n')).toMatch(/flow\.no-wrap: .*wraps around/)
    expect(messages(files('nowrap', [T('home-program', 'right', 'home-bug')])).join('\n')).not.toMatch(/no-wrap/)
  })

  it('flow.back-steps: a declared Back from the rail or into a rail is refused', () => {
    const m = messages(files('back', [T('rail-program', 'back', 'home-program'), T('home-program', 'back', 'rail-program')])).join('\n')
    expect(m).toMatch(/flow\.back-steps: .*rail-program —back→ home-program/)
    expect(m).toMatch(/flow\.back-steps: .*home-program —back→ rail-program/)
  })

  it('flow.focus-memory: moving the focus inside a level-3 page is not a new page to return from', () => {
    const dir = files('inside', [T('detail', 'up', 'detail-card'), T('detail-card', 'down', 'detail')], (f) => (f['detail-card.tsx'] = f['detail.tsx']))
    expect(messages(dir).join('\n')).not.toMatch(/focus-memory/)
  })

  it('flow.focus-memory: a page not opened by Enter from a rail has no card to return to', () => {
    const dir = files('memory', [], (f) => (f['flow.ts'] = f['flow.ts'].replace(T('rail-program', 'enter', 'detail'), T('home-bug', 'enter', 'detail'))))
    expect(messages(dir).join('\n')).toMatch(/flow\.focus-memory: State "detail"/)
  })
})
