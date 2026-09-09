import { describe, expect, it } from 'vitest'
import { SCREENFLOW_MANIFEST } from './screenflow-manifest'
import { manifestZodSchema } from './manifest'
import { compileManifestSchemas } from './manifest-zod'
import { Catalog, CATALOG_TYPES, getCatalogEntry } from '@/design-system/catalog'

describe('SCREENFLOW_MANIFEST (derived from the catalog)', () => {
  it('is a schema-valid manifest', () => {
    expect(manifestZodSchema.safeParse(SCREENFLOW_MANIFEST).success).toBe(true)
  })

  it('mirrors every catalog component and no others', () => {
    expect(Object.keys(SCREENFLOW_MANIFEST.components).sort()).toEqual([...CATALOG_TYPES].sort())
  })

  it('preserves each component\'s children-acceptance and select options', () => {
    for (const type of CATALOG_TYPES) {
      const entry = getCatalogEntry(type)!
      const component = SCREENFLOW_MANIFEST.components[type]
      expect(component.acceptsChildren).toBe(entry.acceptsChildren)
      for (const [name, control] of Object.entries(entry.controls)) {
        if (control.kind === 'select') {
          expect(component.props[name].options).toEqual([...control.options])
        }
      }
    }
  })

  it('compiles to per-component Zod schemas that accept the catalog defaults', () => {
    const schemas = compileManifestSchemas(SCREENFLOW_MANIFEST)
    for (const type of CATALOG_TYPES) {
      const entry = getCatalogEntry(type)!
      expect(schemas[type].safeParse(entry.defaultProps).success).toBe(true)
    }
  })

  it('exposes the semantic token dictionary', () => {
    expect(SCREENFLOW_MANIFEST.tokens.colors.brand).toBeTypeOf('string')
    expect(SCREENFLOW_MANIFEST.tokens.spacing.md).toBeTypeOf('string')
    expect(Object.keys(SCREENFLOW_MANIFEST.tokens.spacing)).toContain('lg')
  })

  it('keeps the catalog reachable (rename guard)', () => {
    expect(Catalog.Stack.type).toBe('Stack')
  })
})
