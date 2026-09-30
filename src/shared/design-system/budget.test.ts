/** Phase 9E: the primitive budget — 3 in a chain, 6 per screen, text counted, on the interpreted tree. */
import { describe, expect, it } from 'vitest'
import { PRIMITIVE_MAX_CHAIN, PRIMITIVE_MAX_PER_SCREEN, budgetProblems } from './primitives'
import { homeTemplate } from '@/shared/templates/home'
import { interpretPrototype } from '@/interpreter/interpret'

type N = { type: string; children: N[] }
const n = (type: string, ...children: N[]): N => ({ type, children })
const chain = (length: number, leaf = 'primitive:Text'): N => (length === 1 ? n(leaf) : n('primitive:Box', chain(length - 1, leaf)))

describe('the constants', () => {
  it('are the decided starting values', () => {
    expect(PRIMITIVE_MAX_CHAIN).toBe(3)
    expect(PRIMITIVE_MAX_PER_SCREEN).toBe(6)
  })
})

describe('the chain', () => {
  it(`allows ${PRIMITIVE_MAX_CHAIN} primitives nested in primitives, and reports the one past it`, () => {
    expect(budgetProblems(n('Stack', chain(PRIMITIVE_MAX_CHAIN)))).toEqual([])
    const [over, ...rest] = budgetProblems(n('Stack', chain(PRIMITIVE_MAX_CHAIN + 1)))
    expect(rest).toEqual([])
    expect(over).toMatchObject({ ruleId: 'primitives.budget', kind: 'budget-exceeded', path: ['root', 'children', 0, 'children', 0, 'children', 0, 'children', 0] })
    expect(over.message).toMatch(/primitive number 4 in a chain .* at most 3\. .*replace the chain with one Proposal/)
  })

  it('is broken by a registry component in between: the depth of the tree does not count', () => {
    const tree = n('Stack', n('primitive:Box', n('primitive:Box', n('Stack', n('primitive:Box', n('primitive:Box', n('primitive:Text')))))))
    expect(budgetProblems(tree)).toEqual([])
  })

  it('reports each chain once, at the first primitive past the limit', () => {
    expect(budgetProblems(n('Stack', chain(6))).filter((p) => /chain/.test(p.message))).toHaveLength(1)
  })
})

describe('the count per screen', () => {
  it(`allows ${PRIMITIVE_MAX_PER_SCREEN}, text included, and reports the screen past it`, () => {
    const texts = (k: number) => n('Stack', ...Array.from({ length: k }, () => n('primitive:Text')))
    expect(budgetProblems(texts(PRIMITIVE_MAX_PER_SCREEN))).toEqual([])
    const [over] = budgetProblems(texts(PRIMITIVE_MAX_PER_SCREEN + 1))
    expect(over).toMatchObject({ ruleId: 'primitives.budget', kind: 'budget-exceeded', path: ['root'] })
    expect(over.message).toMatch(/uses 7 primitives — at most 6, text included\. .*group the rest into a Proposal/)
  })

  it('a Proposal and registry components do not count', () => {
    const tree = n('Stack', ...Array.from({ length: PRIMITIVE_MAX_PER_SCREEN }, () => n('primitive:Text')), n('Proposal'), n('Text'), n('Button'))
    expect(budgetProblems(tree)).toEqual([])
  })
})

describe('on the interpreted tree', () => {
  const reuse = { considered: 'Text', why: 'x' }
  /** Home with `k` primitive:Texts next to the rail, and one more hidden under a catalog Text (a leaf: the interpreter drops it). */
  function doc(k: number, hidden: boolean): Record<string, any> {
    const d: Record<string, any> = { ...(structuredClone(homeTemplate.blueprint) as object), mode: 'exploratory' }
    for (let i = 0; i < k; i++) d.root.children[0].children.push({ type: 'primitive:Text', props: { text: `t${i}` }, reuse })
    if (hidden) d.root.children[0].children.push({ type: 'Text', props: { children: 'x' }, children: [{ type: 'primitive:Text', props: { text: 'dropped' }, reuse }] })
    return d
  }

  it('a primitive the repairs drop is not counted', () => {
    const r = interpretPrototype(doc(PRIMITIVE_MAX_PER_SCREEN, true))
    expect(r.ok && budgetProblems(r.screens[0].tree)).toEqual([])
  })

  it('the interpreter warns about an excess — reported, not repaired — and keeps every primitive', () => {
    const r = interpretPrototype(doc(PRIMITIVE_MAX_PER_SCREEN + 1, false))
    expect(r.ok && r.issues.some((i) => i.ruleId === 'primitives.budget' && i.level === 'warn' && /reported, not repaired/.test(i.message))).toBe(true)
    expect(r.ok && JSON.stringify(r.screens[0].tree).match(/primitive:Text/g)?.length).toBe(PRIMITIVE_MAX_PER_SCREEN + 1)
  })
})
