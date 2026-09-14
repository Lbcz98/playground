import { describe, expect, it } from 'vitest'
import { manifestZodSchema, deriveDefaultProps } from './manifest'
import { compileManifestSchemas } from './manifest-zod'
import { W3C_MANIFEST, W3C_MANIFEST_ID } from './w3c-manifest'
import { hydrateRegistry } from '@/design-system/registry'

describe('W3C_MANIFEST', () => {
  it('is a valid manifest', () => {
    expect(manifestZodSchema.safeParse(W3C_MANIFEST).success).toBe(true)
    expect(W3C_MANIFEST.id).toBe(W3C_MANIFEST_ID)
  })

  it('carries the real global.css token values, not a re-authored copy', () => {
    expect(W3C_MANIFEST.tokens.colors['core-primary-night-dark']).toBe('#414FFD')
    expect(W3C_MANIFEST.tokens.colors['semantic-functional-text-primary']).toBe('#EEEEEE')
    expect(W3C_MANIFEST.tokens.spacing['spacing-core-md']).toBe('20px')
    expect(W3C_MANIFEST.tokens.radius?.['radius-core-md']).toBe('12px')
  })

  it("every component's default props are real token names and validate against its own manifest", () => {
    const schemas = compileManifestSchemas(W3C_MANIFEST)
    for (const component of Object.values(W3C_MANIFEST.components)) {
      const defaults = deriveDefaultProps(component)
      const result = schemas[component.id]!.safeParse(defaults)
      expect(result.success, `${component.id}: ${JSON.stringify(result.success ? null : result.error.issues)}`).toBe(true)
    }
  })

  it('renders every component through the generic, token-driven renderer without throwing', () => {
    const reg = hydrateRegistry(W3C_MANIFEST)
    expect(reg.types.sort()).toEqual(['Button', 'Container', 'Text'])
    for (const type of reg.types) {
      const entry = reg.get(type)!
      expect(entry.generic).toBe(true)
      expect(entry.render(entry.defaultProps, null)).toBeTruthy()
    }
  })
})
