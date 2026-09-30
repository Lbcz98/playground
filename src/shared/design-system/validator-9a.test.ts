/** Phase 9A: the schema cache, structured issues and full descent of the strict validator. */
import { describe, expect, it } from 'vitest'
import { compileManifestSchemas, validateBlueprintAgainstManifest } from './manifest-zod'
import { SCREENFLOW_MANIFEST } from './screenflow-manifest'
import { homeTemplate } from '@/shared/templates/home'
import { SCREEN_TEMPLATES } from '@/shared/templates'
import { W3C_MANIFEST } from '@/shared/fixtures/w3cManifest'
import { RULES } from './rules'
import { DTV_SCREEN_LAYERS } from './screen-layers'

const fresh = () => structuredClone(SCREENFLOW_MANIFEST)
const valid = () => structuredClone(homeTemplate.blueprint) as unknown as { root: Record<string, unknown> }

describe('schema cache (manifest × policy)', () => {
  it('compiles once per manifest object and policy', () => {
    const m = fresh()
    expect(compileManifestSchemas(m)).toBe(compileManifestSchemas(m, 'faithful'))
    expect(compileManifestSchemas(m, 'exploratory')).toBe(compileManifestSchemas(m, 'exploratory'))
    expect(compileManifestSchemas(m, 'exploratory')).not.toBe(compileManifestSchemas(m, 'faithful'))
    expect(compileManifestSchemas(fresh())).not.toBe(compileManifestSchemas(m))
  })

  it('keeps the faithful validator rejecting `reuse` after an exploratory compile', () => {
    const m = fresh()
    const doc = valid()
    expect(validateBlueprintAgainstManifest(doc, m)).toEqual({ ok: true })

    compileManifestSchemas(m, 'exploratory')
    doc.root.reuse = { considered: 'Stack', why: 'test' }
    const v = validateBlueprintAgainstManifest(doc, m)
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.issues.map((i) => i.message).join('\n')).toMatch(/unknown node key "reuse"/)
  })

  it('returns the same verdict on a cache hit', () => {
    const m = fresh()
    const doc = { version: 1, root: { type: 'Stack', children: [{ type: 'Carousel' }] } }
    expect(validateBlueprintAgainstManifest(doc, m)).toEqual(validateBlueprintAgainstManifest(doc, m))
  })
})

/** Every reference screen, plus each one broken in the ways a model breaks them. */
function corpus(): unknown[] {
  const docs: unknown[] = []
  for (const t of SCREEN_TEMPLATES) {
    const base = t.blueprint as unknown as { root: Record<string, unknown> }
    const broken = (edit: (root: Record<string, unknown>, doc: Record<string, unknown>) => void) => {
      const doc = structuredClone(base) as unknown as Record<string, unknown>
      edit(doc.root as Record<string, unknown>, doc)
      docs.push(doc)
    }
    docs.push(structuredClone(base))
    broken((root) => (root.props = { ...(root.props as object), padding: '10px', align: 'center', justify: 'center' }))
    broken((root) => (root.children = [...((root.children as unknown[]) ?? []), { type: 'Carousel' }, { type: 'Stack' }, { type: 'Stack' }]))
    broken((root) => (root.reuse = { considered: 'Stack', why: 'x' }))
    broken((_, doc) => ((doc.screen = { model: 'nope', level: 7 }), (doc.focus = 'x')))
  }
  return docs
}

describe('structured issues', () => {
  const ids = new Set<string>(RULES.map((r) => r.id))

  it('names a rule of the book on every issue, over broken copies of every reference screen', () => {
    let invalid = 0
    for (const doc of corpus()) {
      const v = validateBlueprintAgainstManifest(doc, SCREENFLOW_MANIFEST)
      if (v.ok) continue
      invalid += 1
      for (const issue of v.issues) expect(ids.has(issue.ruleId), issue.ruleId).toBe(true)
    }
    expect(invalid).toBe(SCREEN_TEMPLATES.length * 4)
  })

  it('names the tier a token breaks', () => {
    const on = (props: Record<string, unknown>) =>
      validateBlueprintAgainstManifest({ version: 1, root: { type: 'Container', children: [{ type: 'Text', props }] } }, W3C_MANIFEST)
    const core = on({ textColor: 'core-neutral-white' })
    const raw = on({ textColor: '#ffffff' })
    expect(!core.ok && core.issues.find((i) => i.path.join('.') === 'root.children.0.props.textColor')?.ruleId).toBe('tokens.semantic-tier')
    expect(!raw.ok && raw.issues.find((i) => i.path.join('.') === 'root.children.0.props.textColor')?.ruleId).toBe('tokens.only')
  })

  it('pins a bad list item by Zod’s path', () => {
    const doc = valid()
    const menu = findType(doc.root, 'MainMenu')!
    menu.props = { ...(menu.props as object), miscellaneousItems: [{ title: 'ok' }, { title: 5 }] }
    const v = validateBlueprintAgainstManifest(doc, SCREENFLOW_MANIFEST)
    expect(v.ok).toBe(false)
    if (v.ok) return
    const issue = v.issues.find((i) => i.path.includes('miscellaneousItems'))
    expect(issue?.ruleId).toBe('component.api')
    expect(issue?.path.slice(-4)).toEqual(['props', 'miscellaneousItems', 1, 'title'])
  })

  it('places a further screen’s issues and a skipped level under that screen', () => {
    const deep = DTV_SCREEN_LAYERS.models.find((m) => m.level === 3)!
    const v = validateBlueprintAgainstManifest(
      {
        version: 1,
        screen: { model: 'home', level: 1 },
        root: { type: 'Stack', children: [{ type: 'Button', goTo: 'deep' }] },
        screens: [{ id: 'deep', screen: { model: deep.id, level: 3 }, root: { type: 'Stack', props: { padding: '10px' } } }],
      },
      SCREENFLOW_MANIFEST,
    )
    expect(v.ok).toBe(false)
    if (v.ok) return
    const jump = v.issues.find((i) => i.ruleId === 'flow.next-level')
    expect(jump?.path).toEqual(['root', 'children', 0, 'goTo'])
    const raw = v.issues.find((i) => i.ruleId === 'tokens.only')
    expect(raw?.path).toEqual(['screens', 0, 'root', 'props', 'padding'])
    expect(raw?.message).toMatch(/^Screen "deep": /)
  })

  it('tells the plan’s pattern rules apart', () => {
    const v = validateBlueprintAgainstManifest(
      { version: 1, screen: { model: 'home', level: 1 }, root: { type: 'Stack', props: { align: 'center', justify: 'center' } } },
      SCREENFLOW_MANIFEST,
    )
    expect(v.ok).toBe(false)
    if (v.ok) return
    const rule = (prop: string) => v.issues.find((i) => i.path.join('.') === `root.props.${prop}`)?.ruleId
    expect(rule('align')).toBe('layout.root-align')
    expect(rule('justify')).toBe('layout.no-static-center')
  })
})

describe('full descent', () => {
  it('reports the children of an unknown or untyped node in the same pass', () => {
    const v = validateBlueprintAgainstManifest(
      {
        version: 1,
        root: {
          type: 'Stack',
          children: [
            { type: 'Carousel', children: [{ type: 'Text', props: { bogus: 1 } }, { type: 'ContentCardBody' }] },
            { children: [{ type: 'Gallery' }] },
          ],
        },
      },
      SCREENFLOW_MANIFEST,
    )
    expect(v.ok).toBe(false)
    if (v.ok) return
    const at = (path: string) => v.issues.filter((i) => i.path.join('.') === path).map((i) => i.ruleId)
    expect(at('root.children.0.type')).toEqual(['component.api'])
    expect(at('root.children.0.children.0.props.bogus')).toEqual(['component.api'])
    expect(at('root.children.1.type')).toEqual(['blueprint.dsl'])
    expect(at('root.children.1.children.0.type')).toEqual(['component.api'])
    // No parent is known, so the card zone isn't misreported as standing alone.
    expect(v.issues.some((i) => i.path.join('.').startsWith('root.children.0.children.1') && i.ruleId === 'layout.slots')).toBe(false)
  })
})

function findType(node: Record<string, unknown>, type: string): Record<string, unknown> | undefined {
  if (node.type === type) return node
  for (const child of (node.children as Record<string, unknown>[]) ?? []) {
    const hit = findType(child, type)
    if (hit) return hit
  }
  return undefined
}
