/**
 * Phase 9D: the interpreter leaves a pattern break alone only when the node or the
 * screen declares that exact rule, the rule is a pattern, and the screen is
 * Exploratory. Four cases per rule: declared, not declared, a law declared, and a
 * Faithful screen. Laws are always repaired.
 */
import { describe, expect, it } from 'vitest'
import { interpretBlueprint, interpretPrototype, treeToBlueprint, type InterpretIssue } from './interpret'
import { DTV_SCREEN_LAYERS } from '@/shared/design-system/screen-layers'
import { homeTemplate } from '@/shared/templates/home'
import type { CanvasNode, ScreenEntry } from '@/model/nodeTree'

type Doc = Record<string, any>
type Mode = 'exploratory' | 'faithful'
type Dev = { ruleId: string; why: string } | undefined

const home = (mode: Mode): Doc => ({ ...structuredClone(homeTemplate.blueprint), mode }) as Doc
const model = (level: number) => DTV_SCREEN_LAYERS.models.find((m) => m.level === level)!.id
const dev = (ruleId: string): Dev => ({ ruleId, why: 'the request asks for it' })

interface Outcome {
  tree: CanvasNode
  issues: InterpretIssue[]
  screens: ScreenEntry[]
  linkCount: number
}

function interpret(doc: Doc): Outcome {
  const r = interpretPrototype(doc)
  if (!r.ok) throw new Error(r.error)
  return { tree: r.screens[0].tree, issues: r.issues, screens: r.screens, linkCount: r.linkCount }
}

const find = (node: CanvasNode, type: string): CanvasNode | undefined =>
  node.type === type ? node : node.children.map((c) => find(c, type)).find(Boolean)
const walk = (node: CanvasNode): CanvasNode[] => [node, ...node.children.flatMap(walk)]
const kept = (o: Outcome, rule: string) => o.issues.some((i) => i.ruleId === rule && i.level === 'info' && i.message.startsWith('Kept '))

interface Case {
  rule: string
  /** A law of the book to declare instead. */
  law: string
  /** The document, with `dev` declared where the rule is meant to be declared. */
  make: (dev: Dev, mode: Mode) => Doc
  /** Whether the strict behaviour happened: the repair, or the "still breaks" warning. */
  applied: (o: Outcome) => boolean
  /** Whether the declaration is where the tree still carries it. */
  carries: (o: Outcome) => boolean
}

const onRoot = (doc: Doc, d: Dev): Doc => {
  if (d) doc.root.deviation = d
  return doc
}

const CASES: Case[] = [
  {
    rule: 'layout.root-align',
    law: 'frame.layout',
    make: (d, mode) => {
      const doc = home(mode)
      doc.root.props = { ...doc.root.props, align: 'start' }
      return onRoot(doc, d)
    },
    applied: (o) => o.tree.props.align === 'stretch',
    carries: (o) => o.tree.deviation?.ruleId === 'layout.root-align',
  },
  {
    rule: 'layout.no-static-center',
    law: 'frame.layout',
    make: (d, mode) => {
      const doc = home(mode)
      doc.root.props = { ...doc.root.props, justify: 'center' }
      return onRoot(doc, d)
    },
    applied: (o) => o.tree.props.justify !== 'center',
    carries: (o) => o.tree.deviation?.ruleId === 'layout.no-static-center',
  },
  {
    rule: 'layout.anchor',
    law: 'layout.anchor-structure',
    make: (d, mode) => {
      const doc = home(mode)
      doc.root.children.push({ type: 'Button', props: { label: 'A' }, anchor: true }, { type: 'Button', props: { label: 'B' }, anchor: true })
      return onRoot(doc, d)
    },
    applied: (o) => o.tree.children.filter((c) => c.anchor).length === 1,
    carries: (o) => o.tree.deviation?.ruleId === 'layout.anchor',
  },
  {
    rule: 'level.root-direction',
    law: 'frame.layout',
    make: (d, mode) => {
      const doc = home(mode)
      doc.root.props = { ...doc.root.props, direction: 'horizontal' }
      return onRoot(doc, d)
    },
    applied: (o) => o.tree.props.direction === 'vertical',
    carries: (o) => o.tree.deviation?.ruleId === 'level.root-direction',
  },
  {
    rule: 'level.initial-focus',
    law: 'focus.single',
    make: (d, mode) => {
      const doc = home(mode)
      // Focus on a rail card, where Home says it starts on the main menu.
      doc.root.children[0].children[0].children[0].props = { title: 'Um', interactionState: 'focus' }
      return onRoot(doc, d)
    },
    applied: (o) => o.issues.some((i) => i.ruleId === 'level.initial-focus' && i.level === 'warn'),
    carries: (o) => o.tree.deviation?.ruleId === 'level.initial-focus',
  },
  {
    rule: 'layout.slots',
    law: 'component.api',
    make: (d, mode) => {
      const doc = home(mode)
      const card: Doc = { type: 'ContentCard', children: [{ type: 'ContentCardFooter' }, { type: 'ContentCardHeader' }] }
      if (d) card.deviation = d
      doc.root.children.push(card)
      return doc
    },
    applied: (o) => find(o.tree, 'ContentCard')!.children.map((c) => c.type)[0] === 'ContentCardHeader',
    carries: (o) => find(o.tree, 'ContentCard')!.deviation?.ruleId === 'layout.slots',
  },
  {
    rule: 'layout.slots',
    law: 'component.api',
    make: (d, mode) => {
      const doc = home(mode)
      doc.root.children.push({ type: 'ContentCardHeader' }) // a card zone with no card
      return onRoot(doc, d)
    },
    applied: (o) => !o.tree.children.some((c) => c.type === 'ContentCardHeader'),
    carries: (o) => o.tree.deviation?.ruleId === 'layout.slots',
  },
  {
    rule: 'flow.next-level',
    law: 'blueprint.dsl',
    make: (d, mode) => {
      const doc = home(mode)
      const button = doc.root.children[0].children[0].children[0] // the rail's first card: level 1 → 3 skips a level
      button.goTo = 'deep'
      if (d) button.deviation = d
      return { ...doc, id: 'home', screens: [{ id: 'deep', mode, screen: { model: model(3), level: 3 }, root: { type: 'Stack', children: [] } }] }
    },
    applied: (o) => o.linkCount === 0,
    carries: (o) => find(o.tree, 'InteractivityButton')!.deviation?.ruleId === 'flow.next-level',
  },
  {
    rule: 'flow.link-roles',
    law: 'blueprint.dsl',
    make: (d, mode) => {
      const doc = home(mode)
      const menu = doc.root.children[0].children[1] // the main menu carries no link
      menu.goTo = 'rail'
      if (d) menu.deviation = d
      return { ...doc, id: 'home', screens: [{ id: 'rail', mode, screen: { model: model(2), level: 2 }, root: { type: 'Stack', children: [] } }] }
    },
    applied: (o) => o.linkCount === 0,
    carries: (o) => find(o.tree, 'MainMenu')!.deviation?.ruleId === 'flow.link-roles',
  },
  {
    rule: 'level.module-limit',
    law: 'tokens.only',
    // Only reported, never repaired: the "still breaks" warning is what a declaration silences.
    make: (d, mode) =>
      onRoot(
        { version: 1, mode, screen: { model: model(3), level: 3 }, root: { type: 'Stack', props: { direction: 'vertical', justify: 'end' }, children: [{ type: 'Stack' }, { type: 'Stack' }] } },
        d,
      ),
    applied: (o) => o.issues.some((i) => i.ruleId === 'level.module-limit' && i.level === 'warn' && i.message.startsWith('Still breaks')),
    carries: (o) => o.tree.deviation?.ruleId === 'level.module-limit',
  },
]

describe.each(CASES)('$rule', (c) => {
  it('is repaired when nothing declares it', () => {
    const o = interpret(c.make(undefined, 'exploratory'))
    expect(c.applied(o)).toBe(true)
    expect(kept(o, c.rule)).toBe(false)
  })

  it('is left alone, with a notice, when the node or screen declares that exact rule', () => {
    const o = interpret(c.make(dev(c.rule), 'exploratory'))
    expect(c.applied(o)).toBe(false)
    expect(kept(o, c.rule)).toBe(true)
    expect(c.carries(o)).toBe(true)
    expect(o.issues.find((i) => i.ruleId === c.rule && i.message.startsWith('Kept '))?.message).toMatch(/declares a deviation from "[a-z.-]+" \(the request asks for it\)/)
  })

  it('is still repaired when a law is declared instead — the declaration is refused', () => {
    const o = interpret(c.make(dev(c.law), 'exploratory'))
    expect(c.applied(o)).toBe(true)
    expect(kept(o, c.rule)).toBe(false)
    expect(o.issues.some((i) => i.level === 'warn' && /is a law — it holds in every mode/.test(i.message))).toBe(true)
    expect(walk(o.tree).some((n) => n.deviation)).toBe(false)
  })

  it('is still repaired when a different pattern is declared instead', () => {
    const other = c.rule === 'layout.root-align' ? 'level.module-limit' : 'layout.root-align'
    const o = interpret(c.make(dev(other), 'exploratory'))
    expect(c.applied(o)).toBe(true)
    expect(kept(o, c.rule)).toBe(false)
  })

  it('is repaired on a Faithful screen, and the deviation is removed with a warning', () => {
    const o = interpret(c.make(dev(c.rule), 'faithful'))
    expect(c.applied(o)).toBe(true)
    expect(o.issues.some((i) => i.level === 'warn' && /Removed "deviation" from <\w+> — a Faithful screen keeps every pattern/.test(i.message))).toBe(true)
    expect(walk(o.tree).some((n) => n.deviation)).toBe(false)
    expect(o.screens.every((s) => s.mode === 'faithful')).toBe(true)
  })
})

describe('where a declaration reaches', () => {
  it('the screen declares for the whole screen', () => {
    const doc = home('exploratory')
    doc.root.props = { ...doc.root.props, align: 'start' }
    doc.screen.deviation = [dev('layout.root-align')]
    const o = interpret(doc)
    expect(o.tree.props.align).toBe('start')
    expect(kept(o, 'layout.root-align')).toBe(true)
    expect(o.tree.screen?.deviation).toEqual([dev('layout.root-align')])
  })

  it('a declaring ancestor covers a slot break below it; a sibling does not', () => {
    const grandchild = (declaredOn: 'ancestor' | 'sibling') => {
      const doc = home('exploratory')
      const inner = doc.root.children[0]
      if (declaredOn === 'ancestor') inner.deviation = dev('layout.slots')
      else doc.root.children.push({ type: 'Stack', deviation: dev('layout.slots'), children: [] })
      inner.children.push({ type: 'ContentCardHeader' })
      return interpret(doc)
    }
    expect(walk(grandchild('ancestor').tree).some((n) => n.type === 'ContentCardHeader')).toBe(true)
    expect(walk(grandchild('sibling').tree).some((n) => n.type === 'ContentCardHeader')).toBe(false)
  })

  it('a link is kept by a declaration on the link or on an element above it — never by one on the screen (node-only rule)', () => {
    const make = (where: 'link' | 'above' | 'screen') => {
      const doc = home('exploratory')
      const rail = doc.root.children[0].children[0]
      rail.children[0].goTo = 'deep'
      if (where === 'link') rail.children[0].deviation = dev('flow.next-level')
      if (where === 'above') rail.deviation = dev('flow.next-level')
      if (where === 'screen') doc.screen.deviation = [dev('flow.next-level')]
      return { ...doc, id: 'home', screens: [{ id: 'deep', mode: 'exploratory', screen: { model: model(3), level: 3 }, root: { type: 'Stack', children: [] } }] }
    }
    for (const where of ['link', 'above'] as const) expect(interpret(make(where)).linkCount, where).toBe(1)
    const screen = interpret(make('screen'))
    expect(screen.linkCount).toBe(0)
    expect(screen.issues.some((i) => i.level === 'warn' && /breaks at one node, so it is declared on that node/.test(i.message))).toBe(true)
  })

  it('mode is per screen: each entry records the mode it ran in', () => {
    const doc = { ...home('exploratory'), screens: [{ id: 'b', mode: 'faithful', screen: home('faithful').screen, root: { type: 'Stack', children: [] } }] }
    expect(interpret(doc).screens.map((s) => s.mode)).toEqual(['exploratory', 'faithful'])
    expect(interpret(structuredClone(homeTemplate.blueprint)).screens[0].mode).toBe('faithful') // no mode: Faithful rules
  })
})

describe('a declaration the interpreter cannot honour', () => {
  const on = (deviation: unknown): Outcome => {
    const doc = home('exploratory')
    doc.root.props = { ...doc.root.props, align: 'start' }
    doc.root.deviation = deviation
    return interpret(doc)
  }

  it.each([
    ['a convention', dev('copy.button-label'), /is a convention/],
    ['an unknown rule', dev('layout.invented'), /is not a rule of ScreenFlow/],
    ['the 9E overlay rule', dev('layers.overlay-model'), /arrives in 9E/],
    ['a bad shape', { ruleId: 'layout.root-align' }, /must be exactly/],
  ])('%s is ignored with a warning, and the repair happens', (_, deviation, message) => {
    const o = on(deviation)
    expect(o.tree.props.align).toBe('stretch')
    expect(o.tree.deviation).toBeUndefined()
    expect(o.issues.some((i) => i.level === 'warn' && message.test(i.message))).toBe(true)
  })

  it('a screen-level entry that is a law is ignored too, and one that is valid is kept', () => {
    const doc = home('exploratory')
    doc.screen.deviation = [dev('tokens.only'), dev('layout.root-align')]
    const o = interpret(doc)
    expect(o.tree.screen?.deviation).toEqual([dev('layout.root-align')])
    expect(o.issues.some((i) => i.level === 'warn' && /deviation\[0\].*is a law/.test(i.message))).toBe(true)
  })

  it('a Faithful screen’s own deviation list is removed with a warning', () => {
    const doc = home('faithful')
    doc.screen.deviation = [dev('layout.root-align')]
    const o = interpret(doc)
    expect(o.tree.screen?.deviation).toBeUndefined()
    expect(o.issues.some((i) => i.level === 'warn' && /Removed "deviation" from the screen/.test(i.message))).toBe(true)
  })
})

describe('the audit runs on the interpreted tree', () => {
  it('a declaration that nothing breaks after the repairs is reported as unused, not applied', () => {
    const doc = home('exploratory')
    doc.root.deviation = dev('layout.root-align') // nothing breaks it
    const o = interpret(doc)
    expect(o.issues.some((i) => i.level === 'info' && i.ruleId === 'blueprint.dsl' && /declared here, but nothing under it breaks that rule/.test(i.message))).toBe(true)
  })

  it('a break that a repair resolves is not reported as declared', () => {
    const doc = home('exploratory')
    doc.root.props = { ...doc.root.props, padding: 'md' } // a law: repaired, never waivable
    doc.root.deviation = dev('layout.root-align')
    const o = interpret(doc)
    expect(kept(o, 'layout.root-align')).toBe(false)
  })

  it('treeToBlueprint carries a declared deviation back out', () => {
    const doc = home('exploratory')
    doc.root.props = { ...doc.root.props, align: 'start' }
    doc.root.deviation = dev('layout.root-align')
    const out = treeToBlueprint(interpret(doc).tree)
    expect(out.root.deviation).toEqual(dev('layout.root-align'))
  })

  it('interpretBlueprint reports the mode it ran in', () => {
    const r = interpretBlueprint(home('exploratory'))
    expect(r.ok && r.mode).toBe('exploratory')
    const f = interpretBlueprint(structuredClone(homeTemplate.blueprint))
    expect(f.ok && f.mode).toBe('faithful')
  })
})
