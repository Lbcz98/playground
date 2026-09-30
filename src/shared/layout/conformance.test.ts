/**
 * Blueprint conformance — test plan Phase 3 (docs/test-plan-storybook-sot.md).
 *
 * One table, one rule per row: each broken Blueprint must be REJECTED by the
 * strict validator (the agent's retry signal) with a message naming the rule,
 * and REPORTED by the interpreter (the renderer's safety net). Where the
 * interpreter can repair it, the repaired screen must then pass the validator —
 * so a screen that reaches the canvas is always one the agent could have sent.
 *
 * The finer cases of each rule live next to it (frame.test.ts,
 * validateBlueprint.test.ts, screen-layers.test.ts, interpret.test.ts); this
 * file is the checklist that every rule is enforced end to end.
 */
import { describe, expect, it } from 'vitest'
import { interpretBlueprint, interpretPrototype, treeToBlueprint as toBlueprint } from '@/interpreter/interpret'
import type { BlueprintDocument } from '@/shared/blueprint'
import { validateBlueprintAgainstManifest } from '@/shared/design-system/manifest-zod'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { SCREEN_TEMPLATES, screenTemplate } from '@/shared/templates'

const manifest = SCREENFLOW_MANIFEST

function errorsOf(input: unknown): string[] {
  const result = validateBlueprintAgainstManifest(input, manifest)
  return result.ok ? [] : result.issues.map((i) => i.message)
}

/**
 * The nível 3 Content Card screen: root Stack → [Stack(row, on the model's side) →
 * ContentCard(Header, Body(TableCell×3), Footer), RoundedButton(anchored, focused)].
 */
type Doc = BlueprintDocument & Record<string, unknown>
const base = (): Doc => structuredClone(screenTemplate('interactivity-cards-right')!.blueprint) as Doc
const card = (doc: Doc) => doc.root.children![0].children![0]
const zones = (doc: Doc) => card(doc).children!
const body = (doc: Doc) => zones(doc)[1]

interface Case {
  rule: string
  break: (doc: Doc) => void
  /** What the validator must say. */
  rejects: RegExp
  /** What the interpreter must report. */
  reports: RegExp
  /** The interpreter's repair passes the validator. False: the retry loop is the only fix. */
  repairs: boolean
}

const CASES: Case[] = [
  // Registry strictness — only what the manifest defines.
  {
    rule: 'an unknown component',
    break: (d) => d.root.children!.push({ type: 'Carousel' }),
    rejects: /<Carousel> is not a real component/,
    reports: /Dropped unknown component <Carousel>/,
    repairs: true,
  },
  {
    rule: 'an unknown prop',
    break: (d) => Object.assign(card(d).props!, { shadow: 'lg' }),
    rejects: /unknown prop "shadow"/,
    reports: /shadow/,
    repairs: true,
  },
  {
    rule: 'an enum value the catalog does not offer',
    // A value no state list will ever hold, so the case survives the catalog growing.
    break: (d) => Object.assign(card(d).props!, { interactionState: 'blinking' }),
    rejects: /interactionState/,
    reports: /interactionState/,
    repairs: true,
  },

  // Engine-derived focus — the DSL has no focus field; one focused element per screen.
  {
    rule: 'a document-level focus side',
    break: (d) => Object.assign(d, { focus: 'left' }),
    rejects: /Unknown key "focus".*engine reads focus/,
    reports: /Ignored "focus".*engine reads focus/,
    repairs: true,
  },
  {
    rule: 'a focus key on a node',
    break: (d) => Object.assign(card(d), { focus: 'right' }),
    rejects: /unknown node key "focus"/,
    reports: /Ignored "focus" on <ContentCard>/,
    repairs: true,
  },
  {
    rule: 'two focused elements',
    break: (d) => Object.assign(card(d).props!, { interactionState: 'focus' }),
    rejects: /focus/,
    reports: /Focus starts on the rounded button/,
    repairs: true,
  },

  // Frame: 1280×720 safe area, 16px gutters, the 8pt grid, no static centering, one anchor.
  {
    rule: 'a root that adds its own outer margin',
    break: (d) => Object.assign(d.root.props!, { padding: 'lg' }),
    rejects: /padding/,
    reports: /padding/,
    repairs: true,
  },
  {
    rule: 'a root gutter that is not 16px',
    break: (d) => Object.assign(d.root.props!, { gap: 'lg' }),
    rejects: /gap|gutter/,
    reports: /gap|gutter/,
    repairs: true,
  },
  {
    rule: 'off-grid spacing (the 20px step)',
    break: (d) =>
      body(d).children!.push({
        type: 'Stack',
        props: { direction: 'horizontal', gap: 'md' },
        children: [{ type: 'Text', props: { content: 'a' } }],
      }),
    rejects: /grid/,
    reports: /grid|snap|gap/,
    repairs: true,
  },
  {
    rule: 'a statically centered master layout',
    break: (d) => Object.assign(d.root.props!, { align: 'center' }),
    rejects: /stretch/,
    reports: /stretch/,
    repairs: true,
  },
  {
    rule: 'a root that aligns to a side instead of stretching',
    break: (d) => Object.assign(d.root.props!, { align: 'end' }),
    rejects: /always stretches/,
    reports: /"stretch" on the root/,
    repairs: true,
  },
  {
    rule: 'two anchored groups',
    break: (d) => d.root.children!.push({ type: 'RoundedButton', props: { label: 'Voltar' }, anchor: true }),
    rejects: /anchor/,
    reports: /Un-anchored an extra/,
    // Un-anchoring one leaves a second content module on a level-3 screen, which
    // only the agent can resolve (group them, or pick another model).
    repairs: false,
  },

  // The Content Card (the 4-layer widget: card + Header / Body / Footer).
  {
    rule: 'a card zone outside a card',
    break: (d) => d.root.children!.splice(1, 0, { type: 'ContentCardHeader', props: { title: 'x' } }),
    rejects: /only goes directly inside <ContentCard>/,
    reports: /ContentCardHeader/,
    repairs: true,
  },
  {
    rule: 'card zones out of order',
    break: (d) => zones(d).reverse(),
    rejects: /order/,
    reports: /order/,
    repairs: true,
  },
  {
    rule: 'a card zone given twice',
    break: (d) => zones(d).push({ type: 'ContentCardFooter', props: { caption: 'again' } }),
    rejects: /ContentCardFooter/,
    reports: /ContentCardFooter/,
    repairs: true,
  },
  {
    rule: 'a Table Cell outside a card body',
    break: (d) => zones(d).splice(1, 0, { type: 'TableCell', props: { cellType: 'team', label: 'EQU' } }),
    rejects: /TableCell/,
    reports: /TableCell/,
    repairs: true,
  },
  {
    rule: 'a card height off the 8pt grid',
    break: (d) => Object.assign(card(d).props!, { height: 270 }),
    rejects: /height/,
    reports: /height/,
    repairs: true,
  },
  {
    rule: 'a card taller than the spec allows',
    break: (d) => Object.assign(card(d).props!, { height: 480 }),
    rejects: /height/,
    reports: /height/,
    repairs: true,
  },

  // The layer rule (Camadas): video → overlay → content.
  {
    rule: 'a layer model that does not exist',
    break: (d) => Object.assign(d.screen!, { model: 'carousel' }),
    rejects: /model/,
    reports: /model|Home/,
    repairs: false,
  },
  {
    rule: 'a level the model does not have',
    break: (d) => Object.assign(d.screen!, { level: 1 }),
    rejects: /level/,
    reports: /level/,
    repairs: true,
  },
  {
    rule: 'more content modules than the level allows',
    break: (d) => d.root.children!.splice(1, 0, structuredClone(card(d))),
    rejects: /module/,
    reports: /Still breaks a layout rule.*module/,
    repairs: false,
  },
  {
    rule: 'a root that paints over the video',
    break: (d) => Object.assign(d.root.props!, { surface: 'surface' }),
    rejects: /transparent|surface/,
    reports: /surface/,
    repairs: true,
  },
]

describe('Phase 3 — the reference screens are the golden cases', () => {
  it.each(SCREEN_TEMPLATES.map((t) => [t.id, t] as const))('%s passes, and round-trips through the interpreter untouched', (_id, template) => {
    expect(errorsOf(template.blueprint)).toEqual([])
    const result = interpretPrototype(template.blueprint, manifest)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.issues.filter((i) => i.level === 'warn')).toEqual([])
    // Back to the wire format, every screen and link included.
    const [head, ...rest] = result.screens
    const again: BlueprintDocument = {
      ...toBlueprint(head.tree),
      id: head.id,
      name: head.name,
      ...(rest.length ? { screens: rest.map((s) => ({ id: s.id, name: s.name, screen: s.tree.screen, root: toBlueprint(s.tree).root })) } : {}),
    }
    expect(errorsOf(again)).toEqual([])
  })

  it('the base case for the table is itself clean', () => {
    expect(errorsOf(base())).toEqual([])
  })
})

describe.each(CASES.map((c) => [c.rule, c] as const))('Phase 3 — %s', (_rule, c) => {
  const broken = base()
  c.break(broken)

  it('is rejected by the strict validator, naming the rule', () => {
    const errors = errorsOf(broken)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.join('\n')).toMatch(c.rejects)
  })

  it(c.repairs ? 'is reported and repaired by the interpreter' : 'is reported by the interpreter', () => {
    const result = interpretBlueprint(broken, manifest)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.issues.map((i) => i.message).join('\n')).toMatch(c.reports)
    if (c.repairs) expect(errorsOf(toBlueprint(result.tree))).toEqual([])
  })
})

describe('Phase 3 — the grid exceptions are allowed', () => {
  it.each([
    ['3xs', 4],
    ['xs', 12],
    ['2xs', 8],
  ])('a leaf cluster with a %s (%ipx) gap passes', (gap) => {
    const doc = base()
    body(doc).children!.push({
      type: 'Stack',
      props: { direction: 'horizontal', gap },
      children: [{ type: 'Text', props: { content: 'a' } }],
    })
    expect(errorsOf(doc)).toEqual([])
  })
})
