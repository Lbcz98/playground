import { PRIMITIVE_MAX_CHAIN, PRIMITIVE_MAX_PER_SCREEN } from '../../../src/shared/design-system/primitives'
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
    reuses?: number // entries in the report's `reuses`; default 0
    proposals?: number // entries in the report's `proposals`; default 0
    problemFile?: string // a problem must be attributed to a file ending with this
    messages?: RegExp[] // each must match some problem message
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

// ── primitives and local components (T03) ─────────────────────────────────────────────────────────
const PRIM_IMPORT = "import { Box, Text } from '@/primitives'"
const REUSE = '{/* @reuse WideButton: it is a surface, not a button */}'
const box = (inner = '', reuse = REUSE): string => `${reuse}<Box>${inner}</Box>`
const withPrims = (inner: string): { files: Record<string, string>; entry: string } =>
  one('s.tsx', screen(`<MainMenu />${inner}`, { imports: PRIM_IMPORT.replace(/Box, Text|Box|Text/, (m) => m.split(', ').filter((n) => inner.includes(`<${n}`)).join(', ')) }))
const nested = (n: number): string => (n === 0 ? '' : box(nested(n - 1)))
const MAX_PER_SCREEN = PRIMITIVE_MAX_PER_SCREEN
const MAX_CHAIN = PRIMITIVE_MAX_CHAIN
const PROPOSAL = (extra = ''): string => `/**
 * @proposal
 * why: The kit stepper is horizontal and static.
 * description: A vertical accordion stepper that expands the active step.
 * figma: https://figma.com/file/12345
 * proposedApi:
 *   activeStep: "number"
 *   onStepChange: "function"${extra}
 */`
const STEPPER = (doc: string, body = '<Box />'): string => `import { Box } from '@/primitives'\n${doc}\nexport function Stepper() {\n  return ${body}\n}\n`
const withLocal = (component: string): { files: Record<string, string>; entry: string } =>
  ({
    files: { 's.tsx': screen('<MainMenu /><Stepper />', { imports: "import { Stepper } from './components/Stepper'" }), 'components/Stepper.tsx': component },
    entry: 's.tsx',
  })
const FORMS = 'allowed forms are listed in the message'

// ── flow across screens with <Link> (T04) ─────────────────────────────────────────────────────────
// The designer folder of a case is its id, so a link is `/<case id>/<screen>`.
const RAIL = ref('interactivity-buttons-right')
const BTN_HOME = '<InteractivityButton title="Opções de áudio" interactionState="default" />'
const BTN_RAIL = '<InteractivityButton title="Opções de áudio" interactionState="selected" />'
const linked = (code: string, btn: string, href: string, before = ''): string =>
  code.replace("import { Stack }", "import Link from 'next/link'\nimport { Stack }").replace(btn, `${before}<Link href="${href}">${btn}</Link>`)
const DEV_LINK = '{/* @deviation flow.next-level: the stats page opens straight from Home */}'
const linkCase = (id: string, title: string, to: string, expect: CorpusCase['expect'], o: { code?: string; target?: string; before?: string; files?: Record<string, string> } = {}): CorpusCase => ({
  id,
  title,
  files: { 'home.tsx': linked(o.code ?? HOME, BTN_HOME, to.replace('$', id), o.before), 'rail.tsx': o.target ?? RAIL, 'cards.tsx': CARDS, ...o.files },
  entry: 'home.tsx',
  expect,
})
const chain = (id: string, n: number): Record<string, string> =>
  Object.fromEntries(
    Array.from({ length: n }, (_, i) => {
      const home = i % 2 === 0
      const code = home ? HOME : RAIL
      return [`s${i + 1}.tsx`, i === n - 1 ? code : linked(code, home ? BTN_HOME : BTN_RAIL, `/${id}/s${i + 2}`)]
    }),
  )

const FLOW_CASES: CorpusCase[] = [
  linkCase('link-home-to-rail', 'a link from Home (level 1) to the rail (level 2) is read as one edge', '/$/rail', { exit: 0, laws: [] }),
  linkCase('link-skips-level', 'a link from level 1 to level 3 is flow.next-level', '/$/cards', { exit: 1, laws: ['flow.next-level'], messages: [/line \d+: .*goTo/] }),
  linkCase('link-skips-level-declared', 'the same skip, declared on the node before the <Link>, passes', '/$/cards', { exit: 0, laws: [], deviations: ['flow.next-level'] }, { before: DEV_LINK }),
  linkCase('link-skips-level-jsdoc', 'flow.next-level declared in the JSDoc is not honored: it names the node', '/$/cards', { exit: 1, laws: ['blueprint.dsl', 'flow.next-level'], deviations: ['flow.next-level'], messages: [/declared on that node/] }, {
    code: HOME.replace('export function', '/** @deviation flow.next-level: opens the stats page */\nexport function'),
  }),
  linkCase('link-missing-screen', 'a link to a screen that does not exist lists the real ones', '/$/nope', { exit: 1, laws: ['blueprint.dsl'], messages: [/does not exist.*cards, home, rail/] }),
  linkCase('link-cross-designer', "a link into another designer's folder is a problem", '/someone-else/rail', { exit: 1, laws: ['blueprint.dsl'], messages: [/another designer's folder/] }),
  {
    id: 'link-href-computed',
    title: 'a computed href is not read, not a problem',
    ...one('home.tsx', HOME.replace("import { Stack }", "import Link from 'next/link'\nimport { Stack }").replace(BTN_HOME, `<Link href={\`/x/\${'rail'}\`}>${BTN_HOME}</Link>`)),
    expect: { exit: 0, laws: [], notRead: 1 },
  },
  {
    id: 'link-wraps-two',
    title: 'a <Link> around two kit elements is not read, not a problem',
    ...one('home.tsx', HOME.replace("import { Stack }", "import Link from 'next/link'\nimport { Stack }").replace(BTN_HOME, `<Link href="/link-wraps-two/rail">${BTN_HOME}${BTN_HOME}</Link>`)),
    expect: { exit: 0, laws: [], notRead: 1 },
  },
  { id: 'folder-eight-screens', title: 'a chain of 8 valid screens: flow not checked as one, no error', files: chain('folder-eight-screens', 8), entry: 's1.tsx', expect: { exit: 0, laws: [], notRead: 1 } },
  { id: 'folder-chain-six', title: 'a chain of 6 valid screens is checked whole', files: chain('folder-chain-six', 6), entry: 's1.tsx', expect: { exit: 0, laws: [] } },
]

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
    title: 'a file with no <Screen> is a local file: checked through the screens of its folder, and there is none',
    ...one('s.tsx', 'export default function S() { return null }\n'),
    expect: { exit: 0, laws: [], note: 'the real run: nothing is checked, nothing is said. `checkLaws` on the file itself is layers.stack (src/shared/export/checkLaws.test.ts), but the run never hands it over' },
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
    expect: { exit: 1, laws: ['layers.stack'], render: true, note: 'layers.stack render finding blocks, under its own rule id' },
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
    expect: { exit: 1, laws: ['frame.layout'], render: true, note: 'cut-off content blocks, under its own rule id' },
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
    expect: { exit: 1, laws: ['frame.layout'], render: true, notRead: 1, note: 'the render audit still runs on a screen with logic' },
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
  {
    id: 'primitive-box-with-reuse',
    title: 'a Box with @reuse passes and is reported',
    ...withPrims(box()),
    expect: { exit: 0, laws: [], reuses: 1 },
  },
  {
    id: 'primitive-box-without-reuse',
    title: 'a Box with no @reuse is primitives.reuse',
    ...withPrims('<Box />'),
    expect: { exit: 1, laws: ['primitives.reuse'], messages: [/line \d+: .* In TSX: write \{\/\* @reuse <KitComponent>: <why no kit component would do> \*\/\} right before the primitive\.$/] },
  },
  {
    id: 'reuse-unknown-component',
    title: 'a @reuse naming something that is not a kit component is primitives.reuse',
    ...withPrims(box('', '{/* @reuse FancyCard: nothing like it */}')),
    expect: { exit: 1, laws: ['primitives.reuse'], reuses: 1, messages: [/FancyCard.* In TSX: fix the component name in \{\/\* @reuse <KitComponent>: <why> \*\/\} right before the primitive\.$/] },
  },
  {
    id: 'primitive-text-words',
    title: 'a Text with plain words and @reuse is read, not skipped',
    ...withPrims(`{/* @reuse WideButton: plain label */}<Text>Hello</Text>`),
    expect: { exit: 0, laws: [], reuses: 1 },
  },
  {
    id: 'primitive-budget-count',
    title: 'one primitive more than the per-screen budget is primitives.budget',
    ...withPrims(Array.from({ length: MAX_PER_SCREEN + 1 }, () => box()).join('')),
    expect: { exit: 1, laws: ['primitives.budget'], reuses: MAX_PER_SCREEN + 1, messages: [/@proposal/] },
  },
  {
    id: 'primitive-budget-chain',
    title: 'one primitive more than the chain budget is primitives.budget',
    ...withPrims(nested(MAX_CHAIN + 1).replace(/^(\{[^}]*\})/, '$1')),
    expect: { exit: 1, laws: ['primitives.budget'], reuses: MAX_CHAIN + 1 },
  },
  {
    id: 'primitive-budget-at-limits',
    title: 'exactly at both limits passes',
    ...withPrims(nested(MAX_CHAIN) + Array.from({ length: MAX_PER_SCREEN - MAX_CHAIN }, () => box()).join('')),
    expect: { exit: 0, laws: [], reuses: MAX_PER_SCREEN },
  },
  {
    id: 'local-component-with-proposal',
    title: 'a local component with a @proposal passes and the proposal is reported',
    ...withLocal(STEPPER(PROPOSAL(), `<Box />`).replace('<Box />', '<Stack gap="sm" />').replace("import { Box }", "import { Stack }")),
    expect: { exit: 0, laws: [], proposals: 1 },
  },
  {
    id: 'local-component-without-proposal',
    title: 'a local component with no @proposal is registry.new-component',
    ...withLocal(STEPPER('/** a stepper */', '<Stack gap="sm" />').replace("import { Box }", "import { Stack }")),
    expect: { exit: 1, laws: ['registry.new-component'], problemFile: 'components/Stepper.tsx', messages: [/no @proposal/] },
  },
  {
    id: 'local-component-incomplete-proposal',
    title: 'a @proposal missing its why and API names what to add',
    ...withLocal(`import { Stack } from '@/primitives'\n/**\n * @proposal\n * description: A stepper.\n */\nexport function Stepper() {\n  return <Stack gap="sm" />\n}\n`),
    expect: { exit: 1, laws: ['registry.new-component'], problemFile: 'components/Stepper.tsx', messages: [/why: <why the kit lacks it>.*proposedApi/] },
  },
  {
    id: 'local-component-hex',
    title: 'a raw hex inside the component file is tokens.only, attributed to that file',
    ...withLocal(STEPPER(PROPOSAL(), `<Stack gap="sm" />`).replace("import { Box }", "import { Stack }") + "export const COLOR = '#e10600'\n"),
    expect: { exit: 1, laws: ['tokens.only'], problemFile: 'components/Stepper.tsx', proposals: 1 },
  },
  {
    id: 'local-component-host-element',
    title: 'a host element inside the component file is component.api, attributed to that file',
    ...withLocal(STEPPER(PROPOSAL(), `<div />`)),
    expect: { exit: 1, laws: ['component.api'], problemFile: 'components/Stepper.tsx', proposals: 1 },
  },
  {
    id: 'local-component-second-focus',
    title: 'a focused kit component inside a local component counts toward focus.single',
    ...withLocal(
      `import { ContentCard, ContentCardHeader } from '@/ui-kit/ContentCard'\n${PROPOSAL()}\nexport function Stepper() {\n  return (\n    <ContentCard interactionState="focus">\n      <ContentCardHeader title="São Paulo" />\n    </ContentCard>\n  )\n}\n`,
    ),
    expect: { exit: 1, laws: ['focus.single'], proposals: 1, messages: [/2 focused elements: MainMenu .*ContentCard \(.*components\/Stepper\.tsx line \d+, inside <Stepper>\)/] },
  },
  {
    id: 'local-component-resting-card',
    title: 'the same card at rest inside a local component leaves the screen its one focus',
    ...withLocal(
      `import { ContentCard, ContentCardHeader } from '@/ui-kit/ContentCard'\n${PROPOSAL()}\nexport function Stepper() {\n  return (\n    <ContentCard interactionState="default">\n      <ContentCardHeader title="São Paulo" />\n    </ContentCard>\n  )\n}\n`,
    ),
    expect: { exit: 0, laws: [], proposals: 1 },
  },
  {
    id: 'local-component-holds-focus',
    title: 'the one focus of a rail drawn inside a local component is the focus the level asks for',
    files: {
      's.tsx': RAIL.replace('<InteractivityButton title="Vote no Craque do Jogo" interactionState="focus" />', '<Pick />').replace("import { Screen }", "import { Pick } from './components/Pick'\nimport { Screen }"),
      'components/Pick.tsx': `import { InteractivityButton } from '@/ui-kit/InteractivityButton'\n${PROPOSAL()}\nexport function Pick() {\n  return <InteractivityButton title="Vote" interactionState="focus" />\n}\n`,
    },
    entry: 's.tsx',
    expect: { exit: 0, laws: [], proposals: 1, note: 'the validator reads <Pick> as a Proposal and finds nothing focused among the buttons it sees; the static pass saw the focus inside it' },
  },
  {
    id: 'local-component-focus-wrong-level',
    title: 'the one focus drawn inside a local component, on a component the level does not start on, is level.initial-focus',
    files: {
      's.tsx': RAIL.replace('<InteractivityButton title="Vote no Craque do Jogo" interactionState="focus" />', '<Pick />').replace("import { Screen }", "import { Pick } from './components/Pick'\nimport { Screen }"),
      'components/Pick.tsx': `import { ContentCard, ContentCardHeader } from '@/ui-kit/ContentCard'\n${PROPOSAL()}\nexport function Pick() {\n  return (\n    <ContentCard interactionState="focus">\n      <ContentCardHeader title="Vote" />\n    </ContentCard>\n  )\n}\n`,
    },
    entry: 's.tsx',
    expect: { exit: 1, laws: ['level.initial-focus'], proposals: 1, messages: [/Level 2 \(Trilho focado\): nothing is focused/], note: 'the validator, blind inside <Pick>, says nothing is focused; the source reading (a card, not a rail button) keeps its finding' },
  },
  {
    id: 'focus-wrong-level',
    title: 'the focus on a component its level does not start on is level.initial-focus',
    ...one('s.tsx', RAIL.replace('model="interactivity-buttons-right" level={2}', 'model="interactivity-cards-right" level={3}')),
    expect: { exit: 1, laws: ['level.initial-focus'], messages: [/Level 3 \(Interatividade única\): focus is on .*<InteractivityButton>/] },
  },
  {
    id: 'focus-wrong-level-declared',
    title: 'the same focus, declared, passes: level.initial-focus is a pattern',
    ...one('s.tsx', RAIL.replace('model="interactivity-buttons-right" level={2}', 'model="interactivity-cards-right" level={3}').replace('export function', '/** @deviation level.initial-focus: the rail opens on its card */\nexport function')),
    expect: { exit: 0, laws: [], deviations: ['level.initial-focus'] },
  },
  {
    id: 'stack-is-a-container',
    title: 'Stack from @/primitives stays the kit container: no @reuse, not a primitive',
    ...one('s.tsx', screen('<MainMenu />')),
    expect: {
      exit: 0,
      laws: [],
      reuses: 0,
      note: 'Finding: there are two Stacks. The kit Stack (@/primitives, a layout container, in the DTV manifest) is what TSX `Stack` always means; the blueprint vocabulary also has primitive:Stack, which rules.ts lists under primitives.reuse/budget/registry.new-component appliesTo. fromTsx PRIMITIVE_TAGS maps only Box and Text, so primitive:Stack is unreachable from TSX and a Stack needs no @reuse. Decided by the user: keep Stack a container, rules.ts untouched.',
    },
  },
  ...FLOW_CASES,
]
