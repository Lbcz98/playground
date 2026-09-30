/**
 * Phase 9E: composing a new overlay — "model": "composed" with shades from the fixed
 * pieces, only where the screen declares layers.overlay-model. The four cases (declared,
 * not declared, a law declared, a Faithful screen), the shape, and the level rules.
 */
import { describe, expect, it } from 'vitest'
import { validateBlueprintAgainstManifest, type ValidationIssue } from './manifest-zod'
import { COMPOSED_MODEL, DTV_SCREEN_LAYERS, modelOfScreen } from './screen-layers'
import { SCREENFLOW_MANIFEST as M } from './screenflow-manifest'
import { homeTemplate } from '@/shared/templates/home'
import { interpretPrototype } from '@/interpreter/interpret'
import { auditFrameLayout } from '@/shared/layout/frame'

type Doc = Record<string, any>
const dev = (ruleId: string) => ({ ruleId, why: 'o pedido pede uma sombra só no topo' })

function composed(mode: 'exploratory' | 'faithful', declare?: string, screen: Doc = { shades: ['scrim', 'top-right'] }): Doc {
  const doc: Doc = { ...(structuredClone(homeTemplate.blueprint) as unknown as Doc), mode }
  doc.screen = { model: COMPOSED_MODEL, level: 1, ...screen, ...(declare ? { deviation: [dev(declare)] } : {}) }
  return doc
}
const issues = (doc: unknown, policy: 'exploratory' | 'faithful' = 'exploratory'): ValidationIssue[] => {
  const v = validateBlueprintAgainstManifest(doc, M, policy)
  return v.ok ? [] : v.issues
}
const interpretedScreen = (doc: Doc) => {
  const r = interpretPrototype(doc)
  if (!r.ok) throw new Error(r.error)
  return { spec: r.screens[0].tree.screen, issues: r.issues }
}

describe('declared on the screen', () => {
  it('passes, and the interpreter keeps the composed overlay for the canvas to paint', () => {
    expect(issues(composed('exploratory', 'layers.overlay-model'))).toEqual([])
    const { spec, issues: notes } = interpretedScreen(composed('exploratory', 'layers.overlay-model'))
    expect(spec).toMatchObject({ model: COMPOSED_MODEL, level: 1, shades: ['scrim', 'top-right'] })
    expect(notes.some((i) => i.level === 'info' && /Kept the composed overlay \(scrim \+ top-right\)/.test(i.message))).toBe(true)
    expect(modelOfScreen(DTV_SCREEN_LAYERS, spec)?.shades).toEqual(['scrim', 'top-right'])
  })
})

describe('not declared', () => {
  it('is an undeclared deviation, and the interpreter falls back to a layer model', () => {
    const [issue] = issues(composed('exploratory'))
    expect(issue).toMatchObject({ ruleId: 'layers.overlay-model', kind: 'undeclared-deviation', path: ['screen', 'model'] })
    const { spec, issues: notes } = interpretedScreen(composed('exploratory'))
    expect(spec?.model).toBe('home')
    expect(spec).not.toHaveProperty('shades')
    expect(notes.some((i) => i.level === 'warn' && /Replaced the composed overlay with Home/.test(i.message))).toBe(true)
  })
})

describe('a law declared instead', () => {
  it('is refused, the composed overlay stays undeclared, and the interpreter falls back', () => {
    const found = issues(composed('exploratory', 'layers.stack'))
    expect(found.some((i) => /"layers\.stack" \(Video, overlay, content\) is a law/.test(i.message))).toBe(true)
    expect(found.some((i) => i.ruleId === 'layers.overlay-model' && i.kind === 'undeclared-deviation')).toBe(true)
    expect(interpretedScreen(composed('exploratory', 'layers.stack')).spec?.model).toBe('home')
  })

  it('the layer stack stays a law on a composed screen: the content layer is still transparent', () => {
    const doc = composed('exploratory', 'layers.overlay-model')
    const found = issues(doc)
    expect(found).toEqual([])
    // A painted root is still repaired: the composed overlay changes the shades, never the stack.
    const { issues: notes } = interpretedScreen({ ...doc, root: { ...doc.root, props: { ...doc.root.props, surface: 'surface' } } })
    expect(notes.some((i) => i.ruleId === 'layers.stack')).toBe(true)
  })
})

describe('a Faithful screen', () => {
  it('rejects shades, and the interpreter removes them with a warning and falls back', () => {
    const found = issues(composed('faithful', 'layers.overlay-model'), 'faithful')
    expect(found.some((i) => /composes no "shades"/.test(i.message))).toBe(true)
    const { spec, issues: notes } = interpretedScreen(composed('faithful', 'layers.overlay-model'))
    expect(spec).not.toHaveProperty('shades')
    expect(spec?.model).toBe('home')
    expect(notes.some((i) => i.level === 'warn' && /Removed "shades" from the screen/.test(i.message))).toBe(true)
  })
})

describe('the shape of a composed overlay', () => {
  it.each([
    ['no shades', { shades: undefined }, /lists its "shades"/],
    ['an empty list', { shades: [] }, /lists its "shades"/],
    ['an unknown piece', { shades: ['scrim', 'glow'] }, /"glow" is not a shade piece/],
    ['a piece twice', { shades: ['scrim', 'scrim'] }, /listed twice/],
    ['no level the rule defines', { shades: ['scrim'], level: 9 }, /names its level/],
  ])('rejects %s', (_, screen, message) => {
    const found = issues(composed('exploratory', 'layers.overlay-model', screen as Doc))
    expect(found.some((i) => i.ruleId === 'blueprint.dsl' && message.test(i.message))).toBe(true)
  })

  it('shades only go with "composed"', () => {
    const doc = structuredClone(homeTemplate.blueprint) as unknown as Doc
    doc.mode = 'exploratory'
    doc.screen = { ...doc.screen, shades: ['scrim'] }
    expect(issues(doc).some((i) => /"shades" only goes with "model": "composed"/.test(i.message))).toBe(true)
  })

  it('a malformed one is never painted: the interpreter falls back even when declared', () => {
    expect(interpretedScreen(composed('exploratory', 'layers.overlay-model', { shades: ['glow'] })).spec?.model).toBe('home')
  })
})

describe('the level rules hold on a composed screen', () => {
  it('a composed level-3 screen is held to the level-3 module limit', () => {
    const doc: Doc = {
      version: 1,
      mode: 'exploratory',
      screen: { model: COMPOSED_MODEL, level: 3, shades: ['bottom'], deviation: [dev('layers.overlay-model')] },
      root: { type: 'Stack', props: { direction: 'vertical', justify: 'end' }, children: [{ type: 'Stack' }, { type: 'Stack' }] },
    }
    expect(issues(doc).some((i) => i.ruleId === 'level.module-limit' && i.kind === 'undeclared-deviation')).toBe(true)
  })

  it('the canvas QA reads the composed level too', () => {
    const tree = interpretPrototype(composed('exploratory', 'layers.overlay-model'))
    const checks = tree.ok ? auditFrameLayout({ root: tree.screens[0].tree }, M) : []
    expect(checks.find((c) => c.id === 'layers')?.problems.some((p) => /composes its own overlay/.test(p))).toBe(true)
  })
})
