/** Phase 9E: a primitive says which components it considered and why none would do. */
import { describe, expect, it } from 'vitest'
import { validateBlueprintAgainstManifest, type ValidationIssue } from './manifest-zod'
import { consideredComponents, reuseProblem } from './primitives'
import { SCREENFLOW_MANIFEST as M } from './screenflow-manifest'
import { homeTemplate } from '@/shared/templates/home'
import { interpretPrototype, treeToBlueprint } from '@/interpreter/interpret'

type Doc = Record<string, any>
const GOOD = { considered: 'Notification, Text', why: 'nenhum deles pinta o título na cor de destaque' }

function withPrimitive(reuse: unknown, mode: 'exploratory' | 'faithful' = 'exploratory', type = 'primitive:Text'): Doc {
  const doc: Doc = { ...(structuredClone(homeTemplate.blueprint) as unknown as Doc), mode }
  const node: Doc = { type, props: type === 'primitive:Text' ? { text: 'GOL!', color: 'danger' } : {} }
  if (reuse !== undefined) node.reuse = reuse
  doc.root.children[0].children.push(node)
  return doc
}
const issues = (doc: unknown): ValidationIssue[] => {
  const v = validateBlueprintAgainstManifest(doc, M, 'exploratory')
  return v.ok ? [] : v.issues
}
const reuseIssue = (doc: unknown) => issues(doc).find((i) => i.ruleId === 'primitives.reuse')

describe('considered names real components', () => {
  it('reads ids and names, case-insensitive, split on commas and "e"/"and"', () => {
    expect(consideredComponents(M, 'Notification, text e Wide Button').found).toEqual(['Notification', 'Text', 'WideButton'])
    expect(consideredComponents(M, '<MainMenu>; ContentCard').found).toEqual(['MainMenu', 'ContentCard'])
  })

  it('does not count the vocabulary itself, or an invented name', () => {
    expect(consideredComponents(M, 'primitive:Box, Proposal, Scoreboard')).toEqual({ found: [], unknown: ['primitive:Box', 'Proposal', 'Scoreboard'] })
  })
})

describe('the validator', () => {
  it('accepts a primitive whose reuse names real components and a reason', () => {
    expect(reuseIssue(withPrimitive(GOOD))).toBeUndefined()
  })

  it.each([
    ['missing', undefined, /a primitive has no "reuse"/],
    ['not an object', 'Text', /"reuse" is not an object/],
    ['an extra key', { ...GOOD, score: 1 }, /remove "score"/],
    ['no reason', { considered: 'Text', why: ' ' }, /must say in one short sentence/],
    ['an invented component', { considered: 'Scoreboard', why: 'x' }, /names "Scoreboard", which is not a component of ScreenFlow\. Name the components you looked at, by id: Stack, Text/],
    ['a real one and an invented one', { considered: 'Text, Placar', why: 'x' }, /names "Placar"/],
    ['itself', { considered: 'primitive:Text', why: 'x' }, /"primitive:Text", which is not a component/],
    ['nothing named', { considered: ' , ', why: 'x' }, /names no component/],
  ])('rejects a reuse that is %s, as a composition choice', (_, reuse, message) => {
    const found = reuseIssue(withPrimitive(reuse))
    expect(found).toMatchObject({ ruleId: 'primitives.reuse', kind: 'invalid-reuse' })
    expect(found?.path.slice(-1)).toEqual(['reuse'])
    expect(found?.message).toMatch(message)
  })

  it('checks every primitive type', () => {
    for (const type of ['primitive:Box', 'primitive:Stack', 'primitive:Text']) expect(reuseIssue(withPrimitive(undefined, 'exploratory', type)), type).toBeDefined()
  })

  it('accepts reuse only on a primitive: on a component it is an unknown key', () => {
    const doc = withPrimitive(GOOD)
    doc.root.children[0].children[0].reuse = GOOD // the rail
    expect(issues(doc).some((i) => /<InteractivityMenu>: unknown node key "reuse" — only a primitive says why no component would do/.test(i.message))).toBe(true)
  })

  it('a Faithful screen never accepts reuse, on anything', () => {
    const doc = structuredClone(homeTemplate.blueprint) as unknown as Doc
    doc.root.reuse = GOOD
    const v = validateBlueprintAgainstManifest(doc, M, 'faithful')
    expect(!v.ok && v.issues.some((i) => /unknown node key "reuse" — the Blueprint DSL has no such key/.test(i.message))).toBe(true)
  })

  it('the helper and the validator agree', () => {
    expect(reuseProblem(M, GOOD)).toBeNull()
    expect(reuseProblem(M, undefined)).toMatch(/has no "reuse"/)
  })
})

describe('the interpreter: reported, not repaired', () => {
  it('keeps a primitive with an invalid reuse, with a warning', () => {
    const r = interpretPrototype(withPrimitive({ considered: 'Scoreboard', why: 'x' }))
    const text = r.ok ? r.screens[0].tree.children[0].children.find((c) => c.type === 'primitive:Text') : undefined
    expect(text).toBeDefined()
    expect(text?.reuse).toBeUndefined()
    expect(r.ok && r.issues.some((i) => i.ruleId === 'primitives.reuse' && i.level === 'warn' && /Kept <primitive:Text>, reported, not repaired/.test(i.message))).toBe(true)
  })

  it('keeps a valid reuse on the node, and treeToBlueprint carries it back out', () => {
    const r = interpretPrototype(withPrimitive(GOOD))
    const text = r.ok ? r.screens[0].tree.children[0].children.find((c) => c.type === 'primitive:Text') : undefined
    expect(text?.reuse).toEqual(GOOD)
    expect(treeToBlueprint(r.ok ? r.screens[0].tree : (null as never)).root.children?.[0].children?.find((c) => c.type === 'primitive:Text')?.reuse).toEqual(GOOD)
  })

  it('ignores reuse on a component', () => {
    const doc = withPrimitive(GOOD)
    doc.root.children[0].children[0].reuse = GOOD
    const r = interpretPrototype(doc)
    expect(r.ok && r.screens[0].tree.children[0].children[0].reuse).toBeUndefined()
    expect(r.ok && r.issues.some((i) => /Ignored "reuse" on <InteractivityMenu>/.test(i.message))).toBe(true)
  })
})
