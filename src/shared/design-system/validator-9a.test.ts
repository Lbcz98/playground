/** Phase 9A: the schema cache, structured issues and full descent of the strict validator. */
import { describe, expect, it } from 'vitest'
import { compileManifestSchemas, validateBlueprintAgainstManifest } from './manifest-zod'
import { SCREENFLOW_MANIFEST } from './screenflow-manifest'
import { homeTemplate } from '@/shared/templates/home'

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
    if (!v.ok) expect(v.errors.join('\n')).toMatch(/unknown node key "reuse"/)
  })

  it('returns the same verdict on a cache hit', () => {
    const m = fresh()
    const doc = { version: 1, root: { type: 'Stack', children: [{ type: 'Carousel' }] } }
    expect(validateBlueprintAgainstManifest(doc, m)).toEqual(validateBlueprintAgainstManifest(doc, m))
  })
})
