/**
 * Phase 9F: a manual edit is held to the same validation as a generation. On an Exploratory screen a pattern the
 * person breaks by hand is stamped with its real rule and origin 'user'; a law never is; a Faithful screen is never
 * stamped automatically; and a stamp goes away with the break. The model's declarations are never touched.
 */
import { describe, expect, it } from 'vitest'
import { cloneTree, makeNode, type CanvasNode } from '@/model/nodeTree'
import { interpretPrototype } from '@/interpreter/interpret'
import { homeTemplate } from '@/shared/templates/home'
import { SCREENFLOW_MANIFEST as M } from '@/shared/design-system/screenflow-manifest'
import { declareAsMine, stampManualEdit } from './manualStamp'

const homeTree = (): CanvasNode => {
  const r = interpretPrototype(structuredClone(homeTemplate.blueprint), M)
  if (!r.ok) throw new Error(r.error)
  return r.screens[0].tree
}
/** Edit `before` with `recipe`, then stamp it as the store does. */
const edit = (before: CanvasNode, recipe: (draft: CanvasNode) => void, mode: 'faithful' | 'exploratory' = 'exploratory') => {
  const after = cloneTree(before)
  recipe(after)
  stampManualEdit(before, after, mode, M)
  return after
}
/** A card zone with no card: `layout.slots`, reported at the stray header itself. */
const strayHeader = (t: CanvasNode) => t.children[0].children.push(makeNode('ContentCardHeader'))
const header = (t: CanvasNode) => t.children[0].children.at(-1)!
/** Every stamp made by hand, wherever it sits. */
const userStamps = (t: CanvasNode): string[] => [
  ...(t.screen?.deviation ?? []).filter((d) => d.origin === 'user').map((d) => d.ruleId),
  ...(function walk(n: CanvasNode): string[] {
    return [...(n.deviation?.origin === 'user' ? [n.deviation.ruleId] : []), ...n.children.flatMap(walk)]
  })(t),
]
const rootStart = (t: CanvasNode) => (t.props = { ...t.props, align: 'start' })

describe('stampManualEdit — Exploratory', () => {
  it('a node-level pattern broken by hand is stamped on that node, origin user', () => {
    const after = edit(homeTree(), strayHeader)
    expect(header(after).deviation).toEqual({ ruleId: 'layout.slots', why: 'Edited by hand', origin: 'user' })
    expect(after.children[0].deviation).toBeUndefined()
    expect(after.screen?.deviation).toBeUndefined()
  })

  it('a screen-level pattern broken by hand is stamped in the screen list', () => {
    const after = edit(homeTree(), rootStart)
    expect(after.screen?.deviation).toEqual([{ ruleId: 'layout.root-align', why: 'Edited by hand', origin: 'user' }])
    expect(after.deviation).toBeUndefined()
  })

  it('a break a declaration already covers gets no stamp', () => {
    const before = homeTree()
    before.screen = { ...before.screen!, deviation: [{ ruleId: 'layout.root-align', why: 'the model asked' }] }
    before.props = { ...before.props, align: 'start' }
    const after = edit(before, (t) => (t.props = { ...t.props, align: 'end' }))
    expect(after.screen?.deviation).toEqual([{ ruleId: 'layout.root-align', why: 'the model asked' }])
  })

  it('a break the model left undeclared is not blamed on an unrelated edit', () => {
    const before = homeTree()
    before.props = { ...before.props, align: 'start' } // model residue, undeclared
    const after = edit(before, (t) => (t.children[0].props = { ...t.children[0].props, gap: 'md' }))
    expect(after.screen?.deviation).toBeUndefined()
  })

  it('moving a node with a break the model left does not make that break the person’s', () => {
    const before = homeTree()
    before.children[0].children.push(makeNode('ContentCardHeader')) // model residue, undeclared
    const after = edit(before, (t) => {
      const h = t.children[0].children.pop()!
      t.children[0].children.unshift(h) // moved: same node, new path
    })
    expect(userStamps(after)).toEqual([])
  })

  it('a law broken by hand is never stamped', () => {
    const after = edit(homeTree(), (t) => (t.props = { ...t.props, gap: '13px' }))
    expect(after.screen?.deviation).toBeUndefined()
    expect(after.deviation).toBeUndefined()
  })

  it('an edit that removes the break clears the user stamp, on a node and on the screen', () => {
    const broken = edit(edit(homeTree(), strayHeader), rootStart)
    expect(userStamps(broken).sort()).toEqual(['layout.root-align', 'layout.slots'])
    // Put the header inside a card: the slot break is gone, the node stays.
    const fixed = edit(broken, (t) => {
      const h = t.children[0].children.pop()!
      t.children[0].children.push(makeNode('ContentCard', {}, [h]))
      t.props = { ...t.props, align: 'stretch' }
    })
    expect(userStamps(fixed)).toEqual([])
    expect(fixed.screen?.deviation).toBeUndefined()
  })

  it('a model declaration a manual edit made unused stays (Unused in the report)', () => {
    const before = homeTree()
    before.screen = { ...before.screen!, deviation: [{ ruleId: 'layout.root-align', why: 'the model asked' }] }
    before.props = { ...before.props, align: 'start' }
    const after = edit(before, (t) => (t.props = { ...t.props, align: 'stretch' }))
    expect(after.screen?.deviation).toEqual([{ ruleId: 'layout.root-align', why: 'the model asked' }])
  })

  it('one declaration per node: a second node-level break on a node that declares another rule stays undeclared', () => {
    const after = edit(homeTree(), (t) => {
      strayHeader(t)
      header(t).deviation = { ruleId: 'flow.link-roles', why: 'the model asked' }
    })
    expect(header(after).deviation).toEqual({ ruleId: 'flow.link-roles', why: 'the model asked' })
  })
})

describe('stampManualEdit — Faithful', () => {
  it('never stamps: the break stays undeclared and the screen stays as it is', () => {
    const after = edit(homeTree(), rootStart, 'faithful')
    expect(after.screen?.deviation).toBeUndefined()
    expect(userStamps(edit(homeTree(), strayHeader, 'faithful'))).toEqual([])
  })
})

describe('declareAsMine — the explicit "Declare as my deviation"', () => {
  it('stamps a node-level entry on its node and a screen-level one on the screen, origin user', () => {
    const tree = homeTree()
    strayHeader(tree)
    rootStart(tree)
    const at = ['root', 'children', 0, 'children', tree.children[0].children.length - 1]
    declareAsMine(tree, { ruleId: 'layout.slots', scope: 'node', path: at })
    declareAsMine(tree, { ruleId: 'layout.root-align', scope: 'screen', path: ['root', 'props', 'align'] })
    expect(header(tree).deviation).toEqual({ ruleId: 'layout.slots', why: 'Edited by hand', origin: 'user' })
    expect(tree.screen?.deviation).toEqual([{ ruleId: 'layout.root-align', why: 'Edited by hand', origin: 'user' }])
  })

  it('never replaces a node’s existing declaration', () => {
    const tree = homeTree()
    strayHeader(tree)
    header(tree).deviation = { ruleId: 'flow.link-roles', why: 'the model asked' }
    declareAsMine(tree, { ruleId: 'layout.slots', scope: 'node', path: ['root', 'children', 0, 'children', tree.children[0].children.length - 1] })
    expect(header(tree).deviation).toEqual({ ruleId: 'flow.link-roles', why: 'the model asked' })
  })
})
