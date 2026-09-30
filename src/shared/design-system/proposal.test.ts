/** Phase 9E: a Proposal — a component the registry lacks, declared, described, and never built. */
import { describe, expect, it } from 'vitest'
import { MAX_PROPOSED_PROPS, validateBlueprintAgainstManifest, type ValidationIssue } from './manifest-zod'
import { SCREENFLOW_MANIFEST as M } from './screenflow-manifest'
import { homeTemplate } from '@/shared/templates/home'
import { interpretPrototype } from '@/interpreter/interpret'

type Doc = Record<string, any>
const DECLARED = { ruleId: 'registry.new-component', why: 'o registro não tem placar com gols' }
const PROPS = { description: 'Placar ao vivo com gols', proposedApi: { homeTeam: 'string', homeScore: 'number', awayScore: 'number' } }

function withProposal(node: Doc = { props: PROPS, deviation: DECLARED }, mode: 'exploratory' | 'faithful' = 'exploratory'): Doc {
  const doc: Doc = { ...(structuredClone(homeTemplate.blueprint) as unknown as Doc), mode }
  doc.root.children[0].children.push({ type: 'Proposal', ...node })
  return doc
}
const issues = (doc: unknown, policy: 'exploratory' | 'faithful' = 'exploratory'): ValidationIssue[] => {
  const v = validateBlueprintAgainstManifest(doc, M, policy)
  return v.ok ? [] : v.issues
}

describe('a declared Proposal', () => {
  it('passes, and is kept with its declaration by the interpreter', () => {
    expect(issues(withProposal())).toEqual([])
    const r = interpretPrototype(withProposal())
    const node = r.ok ? r.screens[0].tree.children[0].children.find((c) => c.type === 'Proposal') : undefined
    expect(node?.props).toEqual(PROPS)
    expect(node?.deviation).toEqual(DECLARED)
    expect(node?.children).toEqual([])
  })
})

describe('what a Proposal must be', () => {
  it('declares registry.new-component — undeclared, it is a composition choice nobody made', () => {
    const [issue, ...rest] = issues(withProposal({ props: PROPS }))
    expect(rest).toEqual([])
    expect(issue).toMatchObject({ ruleId: 'registry.new-component', kind: 'undeclared-deviation', path: ['root', 'children', 0, 'children', 2] })
    expect(issue.message).toMatch(/<Proposal> \("Placar ao vivo com gols"\) is a component the registry lacks/)
  })

  it('declares nothing else', () => {
    const found = issues(withProposal({ props: PROPS, deviation: { ruleId: 'layout.slots', why: 'x' } }))
    expect(found.some((i) => /a Proposal declares "registry\.new-component" and nothing else \(got "layout\.slots"\)/.test(i.message))).toBe(true)
    expect(found.some((i) => i.ruleId === 'registry.new-component' && i.kind === 'undeclared-deviation')).toBe(true)
  })

  it('is declared on its node, never on the screen', () => {
    const doc = withProposal({ props: PROPS })
    doc.screen.deviation = [DECLARED]
    expect(issues(doc).some((i) => /breaks at one node, so it is declared on that node/.test(i.message))).toBe(true)
  })

  it('is a leaf: no children', () => {
    const found = issues(withProposal({ props: PROPS, deviation: DECLARED, children: [{ type: 'primitive:Text', props: { text: 'x' }, reuse: { considered: 'Text', why: 'x' } }] }))
    expect(found.some((i) => i.ruleId === 'component.api' && /<Proposal>: cannot have children/.test(i.message))).toBe(true)
  })

  it('has a description and a proposed API', () => {
    const found = issues(withProposal({ props: {}, deviation: DECLARED }))
    expect(found.some((i) => /prop "description" is required/.test(i.message))).toBe(true)
    expect(found.some((i) => /prop "proposedApi" is required/.test(i.message))).toBe(true)
  })

  it.each([
    ['an empty map', {}],
    ['more than 12 props', Object.fromEntries(Array.from({ length: MAX_PROPOSED_PROPS + 1 }, (_, i) => [`p${i}`, 'string']))],
    ['a key that is not an identifier', { 'home score': 'number' }],
    ['a key starting with a digit', { '1st': 'number' }],
    ['a value that is not a string', { homeScore: 3 }],
    ['an empty value', { homeScore: ' ' }],
    ['a value over 80 characters', { homeScore: 'x'.repeat(81) }],
    ['a list instead of a map', ['homeScore']],
  ])('rejects a proposedApi that is %s', (_, api) => {
    const found = issues(withProposal({ props: { ...PROPS, proposedApi: api }, deviation: DECLARED }))
    expect(found.some((i) => i.ruleId === 'component.api' && i.path.includes('proposedApi'))).toBe(true)
  })

  it(`accepts ${MAX_PROPOSED_PROPS} identifier-like props with short descriptions`, () => {
    const api = Object.fromEntries(Array.from({ length: MAX_PROPOSED_PROPS }, (_, i) => [`prop${i}`, 'string — a label']))
    expect(issues(withProposal({ props: { ...PROPS, proposedApi: api }, deviation: DECLARED }))).toEqual([])
  })

  it('rejects an unknown prop', () => {
    expect(issues(withProposal({ props: { ...PROPS, render: 'x' }, deviation: DECLARED })).some((i) => /unknown prop "render"/.test(i.message))).toBe(true)
  })
})

describe('never on a Faithful screen, never built', () => {
  it('is not a real component on a Faithful screen, and the interpreter drops it', () => {
    expect(issues(withProposal(undefined, 'faithful'), 'faithful').some((i) => /<Proposal> is not a real component/.test(i.message))).toBe(true)
    const r = interpretPrototype(withProposal(undefined, 'faithful'))
    expect(r.ok && JSON.stringify(r.screens[0].tree)).not.toContain('Proposal')
  })

  it('an undeclared Proposal stays on the canvas, reported, not repaired', () => {
    const r = interpretPrototype(withProposal({ props: PROPS }))
    expect(r.ok && r.screens[0].tree.children[0].children.some((c) => c.type === 'Proposal')).toBe(true)
    expect(r.ok && r.issues.some((i) => i.ruleId === 'registry.new-component' && i.level === 'warn' && /Kept <Proposal>, reported, not repaired/.test(i.message))).toBe(true)
  })
})
