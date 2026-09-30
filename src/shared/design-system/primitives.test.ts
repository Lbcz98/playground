/** Phase 9E: the Exploratory vocabulary — code, Exploratory only, and under every law. */
import { describe, expect, it } from 'vitest'
import { compileManifestSchemas, validateBlueprintAgainstManifest, type ValidationIssue } from './manifest-zod'
import { EXPLORATORY_TYPES, PRIMITIVE_TYPES, withVocabulary } from './primitives'
import { SCREENFLOW_MANIFEST as M } from './screenflow-manifest'
import { W3C_MANIFEST as W } from '@/shared/fixtures/w3cManifest'
import { homeTemplate } from '@/shared/templates/home'
import { interpretPrototype } from '@/interpreter/interpret'

type Doc = Record<string, any>
const home = (): Doc => structuredClone(homeTemplate.blueprint) as unknown as Doc
/** Home with a primitive:Text next to the rail. */
const withText = (props: Record<string, unknown> = { text: 'Placar' }): Doc => {
  const doc = home()
  doc.root.children[0].children.push({ type: 'primitive:Text', props, reuse: { considered: 'Text', why: 'o Text do catálogo não tem cor de destaque' } })
  return doc
}
const issuesOf = (doc: unknown, policy: 'faithful' | 'exploratory'): ValidationIssue[] => {
  const v = validateBlueprintAgainstManifest(doc, M, policy)
  return v.ok ? [] : v.issues
}

describe('the vocabulary is code, not manifest data', () => {
  it('leaves the manifest untouched and builds one view per manifest object', () => {
    const before = Object.keys(M.components)
    const view = withVocabulary(M)
    expect(Object.keys(M.components)).toEqual(before)
    for (const type of EXPLORATORY_TYPES) {
      expect(M.components[type]).toBeUndefined()
      expect(view.components[type]).toBeDefined()
    }
    expect(withVocabulary(M)).toBe(view)
  })

  it('works for an imported system too, from its own tokens', () => {
    const text = withVocabulary(W).components['primitive:Text']
    expect(text.props.color.tokenGroup).toBe('colors')
    expect(Object.keys(withVocabulary(W).components)).toEqual([...Object.keys(W.components), ...EXPLORATORY_TYPES])
  })
})

describe('the schema cache: Exploratory only, and immutable across policies', () => {
  it('only the Exploratory compile has the vocabulary', () => {
    const m = structuredClone(M)
    for (const type of EXPLORATORY_TYPES) expect(compileManifestSchemas(m, 'faithful')[type]).toBeUndefined()
    for (const type of EXPLORATORY_TYPES) expect(compileManifestSchemas(m, 'exploratory')[type]).toBeDefined()
  })

  it('the Faithful compile still lacks primitives, and still rejects them, after an Exploratory compile', () => {
    const m = structuredClone(M)
    const faithfulBefore = compileManifestSchemas(m, 'faithful')
    const keysBefore = Object.keys(faithfulBefore)
    compileManifestSchemas(m, 'exploratory')
    expect(validateBlueprintAgainstManifest(withText(), m, 'exploratory').ok).toBe(true)

    const faithfulAfter = compileManifestSchemas(m, 'faithful')
    expect(faithfulAfter).toBe(faithfulBefore)
    expect(Object.keys(faithfulAfter)).toEqual(keysBefore)
    const v = validateBlueprintAgainstManifest(withText(), m, 'faithful')
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.issues.some((i) => /<primitive:Text> is not a real component/.test(i.message))).toBe(true)
  })
})

describe('Faithful: no primitive, no Proposal', () => {
  it.each(EXPLORATORY_TYPES)('%s is not a real component on a Faithful screen', (type) => {
    const doc = home()
    doc.root.children[0].children.push({ type, props: {} })
    const found = issuesOf(doc, 'faithful')
    expect(found.some((i) => i.ruleId === 'component.api' && new RegExp(`<${type}> is not a real component`).test(i.message))).toBe(true)
  })

  it('the Faithful “Allowed” list is the manifest’s own, as before', () => {
    const doc = home()
    doc.root.children[0].children.push({ type: 'primitive:Box' })
    const message = issuesOf(doc, 'faithful').find((i) => /not a real component/.test(i.message))!.message
    expect(message.slice(message.indexOf('Allowed:'))).not.toMatch(/primitive:|Proposal/)
    expect(message.slice(message.indexOf('Allowed:'))).toContain(Object.keys(M.components).join(', '))
  })

  it('the interpreter drops them from a Faithful screen', () => {
    const r = interpretPrototype(withText())
    expect(r.ok && JSON.stringify(r.screens[0].tree)).not.toContain('primitive:')
    expect(r.ok && r.issues.some((i) => /Dropped unknown component <primitive:Text>/.test(i.message))).toBe(true)
  })
})

describe('Exploratory: the primitives render and interpret', () => {
  it('a primitive:Text with valid tokens passes and is kept by the interpreter', () => {
    const doc = { ...withText({ text: 'GOL!', color: 'danger', size: 'size-xl', weight: 'weight-bold' }), mode: 'exploratory' }
    expect(issuesOf(doc, 'exploratory').filter((i) => i.ruleId !== 'primitives.reuse')).toEqual([])
    const r = interpretPrototype(doc)
    const text = r.ok ? r.screens[0].tree.children[0].children.find((c) => c.type === 'primitive:Text') : undefined
    expect(text?.props).toMatchObject({ text: 'GOL!', color: 'danger', size: 'size-xl', weight: 'weight-bold' })
  })

  it('every primitive has only token-bound, enum or text props', () => {
    for (const type of PRIMITIVE_TYPES) {
      for (const p of Object.values(withVocabulary(M).components[type].props)) {
        const ok = !!p.tokenGroup || !!p.options || p.name === 'text'
        expect(ok, `${type}.${p.name}`).toBe(true)
      }
    }
  })
})
