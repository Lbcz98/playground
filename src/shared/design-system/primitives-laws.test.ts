/**
 * Phase 9E: the laws apply to primitives exactly as to components — tokens only,
 * semantic tier, the 8pt grid, the component API — and declaring one waives nothing.
 */
import { describe, expect, it } from 'vitest'
import { validateBlueprintAgainstManifest, type ValidationIssue } from './manifest-zod'
import type { DesignSystemManifest } from './manifest'
import { SCREENFLOW_MANIFEST as M } from './screenflow-manifest'
import { W3C_MANIFEST as W } from '@/shared/fixtures/w3cManifest'
import { homeTemplate } from '@/shared/templates/home'
import { interpretPrototype } from '@/interpreter/interpret'

type Doc = Record<string, any>
const reuse = { considered: 'Text, Notification', why: 'nenhum deles tem cor de título' }

/** An Exploratory built-in Home with one primitive added next to the rail. */
function onHome(type: string, props: Record<string, unknown>, extra: Record<string, unknown> = {}): Doc {
  const doc: Doc = { ...(structuredClone(homeTemplate.blueprint) as unknown as Doc), mode: 'exploratory' }
  doc.root.children[0].children.push({ type, props, reuse, ...extra })
  return doc
}
/** An Exploratory imported-system screen (W3C: its root is a Container) with one primitive in it. */
function onW3C(type: string, props: Record<string, unknown>): Doc {
  return { version: 1, mode: 'exploratory', root: { type: 'Container', props: { padding: 'spacing-core-none' }, children: [{ type, props, reuse: { considered: 'Text', why: 'x' } }] } }
}
const issues = (doc: unknown, manifest: DesignSystemManifest = M): ValidationIssue[] => {
  const v = validateBlueprintAgainstManifest(doc, manifest, 'exploratory')
  return v.ok ? [] : v.issues
}
const has = (found: ValidationIssue[], ruleId: string, message?: RegExp) =>
  found.some((i) => i.ruleId === ruleId && (!message || message.test(i.message)))

describe('tokens only', () => {
  it('rejects a raw hex on a primitive:Text — the r10 case', () => {
    const found = issues(onHome('primitive:Text', { text: 'GOL!', color: '#e10600' }))
    expect(has(found, 'tokens.only', /prop "color" = "#e10600" is a raw value/)).toBe(true)
  })

  it('rejects a raw px on a primitive:Box, and a raw rgb', () => {
    expect(has(issues(onHome('primitive:Box', { padding: '12px' })), 'tokens.only')).toBe(true)
    expect(has(issues(onHome('primitive:Box', { background: 'rgb(225, 6, 0)' })), 'tokens.only')).toBe(true)
  })

  it('the interpreter drops the raw value and keeps the default', () => {
    const r = interpretPrototype(onHome('primitive:Text', { text: 'GOL!', color: '#e10600' }))
    const text = r.ok ? r.screens[0].tree.children[0].children.find((c) => c.type === 'primitive:Text') : undefined
    expect(text?.props.color).toBeUndefined()
    expect(r.ok && r.issues.some((i) => i.ruleId === 'tokens.only' && /Ignored color="#e10600"/.test(i.message))).toBe(true)
  })
})

describe('the semantic tier', () => {
  it('rejects a core color token on a primitive of an imported system', () => {
    const found = issues(onW3C('primitive:Text', { text: 'GOL!', color: 'core-neutral-white' }), W)
    expect(has(found, 'tokens.semantic-tier', /is a core token/)).toBe(true)
  })
})

describe('the 8pt grid', () => {
  it('reports an off-grid spacing step on a primitive (the frame audit sees primitives)', () => {
    const found = issues(onW3C('primitive:Box', { padding: 'spacing-core-md' }), W)
    expect(has(found, 'grid.8pt', /"spacing-core-md" is 20px — off the 8pt grid/)).toBe(true)
  })

  it('offers only on-grid spacing steps in a primitive’s schema', () => {
    const found = issues(onW3C('primitive:Stack', { gap: 'spacing-core-md' }), W)
    expect(has(found, 'grid.8pt')).toBe(true)
  })
})

describe('the component API', () => {
  it('rejects an unknown prop, a bad enum value and children on a text', () => {
    expect(has(issues(onHome('primitive:Box', { shadow: 'lg' })), 'component.api', /unknown prop "shadow"/)).toBe(true)
    expect(has(issues(onHome('primitive:Stack', { direction: 'diagonal' })), 'component.api', /not an allowed value/)).toBe(true)
    expect(has(issues(onHome('primitive:Text', { text: 'x' }, { children: [{ type: 'primitive:Text', props: { text: 'y' } }] })), 'component.api', /cannot have children/)).toBe(true)
  })

  it('requires the text of a primitive:Text (the vocabulary’s required props are checked)', () => {
    expect(has(issues(onHome('primitive:Text', {})), 'component.api', /prop "text" is required/)).toBe(true)
    expect(has(issues(onHome('primitive:Text', { text: 'x' })), 'component.api', /is required/)).toBe(false)
  })
})

describe('a law declared on a primitive waives nothing', () => {
  it.each(['tokens.only', 'grid.8pt', 'component.api', 'primitives.reuse', 'primitives.budget'])('%s', (law) => {
    const found = issues(onHome('primitive:Text', { text: 'GOL!', color: '#e10600' }, { deviation: { ruleId: law, why: 'o pedido pede' } }))
    expect(found.some((i) => /is a law — it holds in every mode/.test(i.message)), law).toBe(true)
    expect(has(found, 'tokens.only'), law).toBe(true)
  })
})
