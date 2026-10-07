import { DTV_TEMPLATES } from '../../../scripts/storybook/dtv-templates'
import type { BlueprintDocument } from '../../../src/shared/blueprint'
import { exportBlueprintToTsx } from '../../../src/shared/export/toTsx'

export interface CorpusCase {
  id: string // unique, kebab-case
  title: string
  files: Record<string, string> // relative path -> TSX/TS source
  entry: string // the file check:laws is run on
  expect: {
    exit: 0 | 1
    laws: string[] // problem rule ids, sorted
    notRead?: number // minimum count of "not read" warnings
    deviations?: string[] // declared rule ids
    render?: boolean // needs Chromium; the case self-skips without it
    note?: string // why the expectation is what it is
  }
}

const ref = (id: string): string => exportBlueprintToTsx(DTV_TEMPLATES.find((t) => t.id === id)!.blueprint as BlueprintDocument).code
const HOME = ref('home')
const CARDS = ref('interactivity-cards-right')

const screen = (inner: string, o: { model?: string; level?: number; imports?: string } = {}): string => `
import { Stack } from '@/primitives'
import { MainMenu } from '@/ui-kit/MainMenu'
import { Screen } from '@/ui-kit/Screen'
${inner.includes('<InteractivityButton') ? "import { InteractivityButton } from '@/ui-kit/InteractivityButton'" : ''}
${o.imports ?? ''}
export default function S() {
  return (
    <Screen model="${o.model ?? 'home'}" level={${o.level ?? 1}}>
      <Stack gap="sm">${inner}</Stack>
    </Screen>
  )
}
`
const one = (name: string, code: string): { files: Record<string, string>; entry: string } => ({ files: { [name]: code }, entry: name })
const BROKEN = CARDS.replace('align="stretch"', 'align="end"')
const DEV = '/** @deviation layout.root-align: the card sits at the end */\nexport function'

export const CASES: CorpusCase[] = [
  { id: 'clean-home', title: 'an exported reference screen is clean', ...one('s.tsx', HOME), expect: { exit: 0, laws: [] } },
  {
    id: 'tokens-raw-hex',
    title: 'a raw hex color is tokens.only',
    ...one('s.tsx', `${screen('<MainMenu />')}\nexport const COLOR = '#e10600'\n`),
    expect: { exit: 1, laws: ['tokens.only'], note: 'a hex outside any prop is seen only by the static scan (as a prop, tsc and the validator also object)' },
  },
  {
    id: 'tokens-inline-style',
    title: 'inline style is tokens.only',
    ...one('s.tsx', screen('<MainMenu /><Stack style={{ gap: 4 }} />')),
    expect: { exit: 1, laws: ['component.api', 'tokens.only'] },
  },
  {
    id: 'host-element',
    title: 'a host element is component.api',
    ...one('s.tsx', screen('<MainMenu /><div />')),
    expect: { exit: 1, laws: ['component.api'] },
  },
  {
    id: 'foreign-import',
    title: 'an import outside the kit is component.api',
    files: { 's.tsx': screen('<MainMenu />', { imports: "import './data'" }), 'data.ts': 'export const x = 1\n' },
    entry: 's.tsx',
    expect: { exit: 1, laws: ['component.api'] },
  },
  {
    id: 'no-screen',
    title: 'a file with no <Screen> is layers.stack',
    ...one('s.tsx', 'export default function S() { return null }\n'),
    expect: { exit: 1, laws: ['layers.stack'] },
  },
  { id: 'unknown-model', title: 'an unknown layer model is layers.stack', ...one('s.tsx', screen('<MainMenu />', { model: 'nope' })), expect: { exit: 1, laws: ['blueprint.dsl', 'layers.overlay-model', 'layers.stack'], note: 'one mistake is reported three times: the static pass and two validator rules' } },
  {
    id: 'focus-two',
    title: 'two focused components is focus.single',
    ...one('s.tsx', screen('<MainMenu /><InteractivityButton title="a" />')),
    expect: { exit: 1, laws: ['focus.single', 'level.initial-focus'], note: 'the validator repeats the static focus finding as level.initial-focus' },
  },
  { id: 'focus-zero', title: 'no focused component is focus.single', ...one('s.tsx', screen('<MainMenu focusedItem={null} />')), expect: { exit: 1, laws: ['focus.single', 'level.initial-focus'] } },
  {
    id: 'level0-no-focus',
    title: 'level 0 allows no focus',
    ...one('s.tsx', `import { Screen } from '@/ui-kit/Screen'\nexport default function S() { return <Screen model="alert" level={0}>{null}</Screen> }\n`),
    expect: { exit: 1, laws: ['level.root-direction'], notRead: 1, note: 'static pass allows zero focus at level 0, but the validator rejects this screen (root Stack not at the end) and {null} is not read; the clean level-0 screen is not reachable with a bare Stack' },
  },
  { id: 'pattern-undeclared', title: 'a pattern broken without @deviation is a problem', ...one('s.tsx', BROKEN), expect: { exit: 1, laws: ['layout.root-align'] } },
  {
    id: 'deviation-declared-ok',
    title: 'the same pattern break, declared, passes',
    ...one('s.tsx', BROKEN.replace('export function', DEV)),
    expect: { exit: 0, laws: [], deviations: ['layout.root-align'] },
  },
  {
    id: 'deviation-unused',
    title: 'a deviation declared for a rule nothing breaks is a problem',
    ...one('s.tsx', CARDS.replace('export function', DEV)),
    expect: { exit: 1, laws: ['blueprint.dsl'], deviations: ['layout.root-align'], note: 'reported under blueprint.dsl, not under the declared rule id' },
  },
  {
    id: 'logic-map-not-read',
    title: 'a .map is listed as not read',
    ...one('s.tsx', screen('<MainMenu />{[1, 2].map((n) => <Stack key={n} gap="sm" />)}')),
    expect: { exit: 0, laws: [], notRead: 1, note: 'the .map is blind to the validator' },
  },
  {
    id: 'render-covering-fill',
    title: 'a container painting a background over the frame is layers.stack (render)',
    ...one('s.tsx', HOME.replace('<Stack direction="column"', '<Stack background="primary" direction="column"')),
    expect: { exit: 1, laws: ['render'], render: true, note: 'check:laws reports every render finding as law "render" today (T01 splits it)' },
  },
  {
    id: 'render-clipped',
    title: 'more rows than the card holds is cut off (render)',
    ...one('s.tsx', CARDS.replace(/<TableCell type="team" name="ARG"[^>]*\/>/, (row) => row.repeat(12))),
    expect: { exit: 1, laws: ['render'], render: true, note: 'cut-off content; reported as law "render" today' },
  },
]
