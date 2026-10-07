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
    advisories?: string[] // advisory rule ids (render.legibility); default none
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

// The clipped screen with its extra rows gone and wide stat values: "11111111" and "55555555" collide in the team row.
const OVERLAP = CARDS.replace(/<TableCell type="team" name="ARG"[^>]*\/>/g, '').replace(
  "stats={['11', '5', '2']}",
  "stats={['11111111', '55555555', '22222222', '1111111', '111111', '11111111']}",
)

const ARG_ROW = /<TableCell type="team" name="ARG"[^>]*\/>/
const withRows = (n: number): string =>
  CARDS.replace(ARG_ROW, '{ROWS.map((r) => <TableCell key={r} type="team" name="ARG" position="2" stats={[\'7\', \'3\', \'1\']} />)}').replace(
    'export function',
    `const ROWS = [${Array.from({ length: n }, (_, i) => i).join(', ')}]\nexport function`,
  )
const withImport = (imp: string, extra: Record<string, string> = {}): { files: Record<string, string>; entry: string } => ({
  files: { 's.tsx': screen('<MainMenu />', { imports: imp }), ...extra },
  entry: 's.tsx',
})
const FORMS = 'allowed forms are listed in the message'

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
    ...one('s.tsx', screen('<MainMenu />', { imports: "import 'lodash'" })),
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
    expect: { exit: 1, laws: ['render'], render: true, note: 'layers.stack render finding blocks; reported as law "render"' },
  },
  {
    id: 'render-clean',
    title: 'a clean reference screen has no render problems and no advisories (render)',
    ...one('s.tsx', HOME),
    expect: { exit: 0, laws: [], advisories: [], render: true },
  },
  {
    id: 'render-clipped',
    title: 'more rows than the card holds is cut off (render)',
    ...one('s.tsx', CARDS.replace(/<TableCell type="team" name="ARG"[^>]*\/>/, (row) => row.repeat(12))),
    expect: { exit: 1, laws: ['render'], render: true, note: 'cut-off content blocks; reported as law "render"' },
  },
  {
    id: 'render-text-overlap',
    title: 'stat values too wide for their columns land on each other (render)',
    ...one('s.tsx', OVERLAP),
    expect: { exit: 0, laws: [], advisories: ['render.legibility'], render: true, note: 'text on text is advisory, never blocks. No squeezed-text case: no kit component with tokens collapses text below 4px' },
  },
  {
    id: 'logic-map-clean',
    title: 'a rail built with .map over a local array is clean, and the .map is counted as not read',
    ...one('s.tsx', withRows(1)),
    expect: { exit: 0, laws: [], notRead: 1 },
  },
  {
    id: 'logic-map-clipped',
    title: 'a .map that makes too many rows for the card is cut off (render)',
    ...one('s.tsx', withRows(12)),
    expect: { exit: 1, laws: ['render'], render: true, notRead: 1, note: 'the render audit still runs on a screen with logic' },
  },
  {
    id: 'import-own-data',
    title: 'a data module in the designer folder can be imported',
    ...withImport("import { items } from './data'\nexport const USED = items", { 'data.ts': 'export const items = [1, 2]\n' }),
    expect: { exit: 0, laws: [] },
  },
  {
    id: 'import-other-designer',
    title: "another designer's folder is component.api",
    ...withImport("import { x } from '../other/data'"),
    expect: { exit: 1, laws: ['component.api'], note: FORMS },
  },
  {
    id: 'import-escapes-folder',
    title: 'a path that escapes the folder is component.api',
    ...withImport("import { x } from '../../../package.json'"),
    expect: { exit: 1, laws: ['component.api'], note: FORMS },
  },
  {
    id: 'import-alias-store',
    title: 'any other @/ path is component.api',
    ...withImport("import { useStore } from '@/store/useStore'"),
    expect: { exit: 1, laws: ['component.api'], note: FORMS },
  },
  {
    id: 'import-npm-package',
    title: 'an npm package is component.api',
    ...withImport("import { clsx } from 'clsx'"),
    expect: { exit: 1, laws: ['component.api'], note: FORMS },
  },
  {
    id: 'import-svg',
    title: 'an .svg is component.api',
    ...withImport("import logo from './logo.svg'", { 'logo.svg': '<svg/>' }),
    expect: { exit: 1, laws: ['component.api'], note: FORMS },
  },
  {
    id: 'data-module-raw-value',
    title: 'a data file with no JSX may hold the text "12px"',
    ...withImport("import { W } from './data'\nexport const USED = W", { 'data.ts': "export const W = '12px'\n" }),
    expect: { exit: 0, laws: [] },
  },
  {
    id: 'screen-raw-value',
    title: 'the same text in a screen file is tokens.only',
    ...one('s.tsx', `${screen('<MainMenu />')}\nexport const W = '12px'\n`),
    expect: { exit: 1, laws: ['tokens.only'] },
  },
]
