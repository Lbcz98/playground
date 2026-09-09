import { describe, expect, it } from 'vitest'
import type { DesignSystemManifest } from './manifest'
import {
  compileManifestSchemas,
  validateBlueprintAgainstManifest,
} from './manifest-zod'

const MANIFEST: DesignSystemManifest = {
  id: 'test',
  name: 'Test DS',
  version: '1.0.0',
  tokens: { colors: {}, spacing: { sm: '8px', md: '16px' }, typography: {} },
  components: {
    Box: {
      id: 'Box',
      name: 'Box',
      description: 'container',
      acceptsChildren: true,
      props: {
        padding: {
          name: 'padding',
          type: { name: 'enum' },
          required: false,
          defaultValue: 'sm',
          options: ['sm', 'md'],
        },
      },
    },
    Chip: {
      id: 'Chip',
      name: 'Chip',
      description: 'leaf',
      acceptsChildren: false,
      props: {
        size: {
          name: 'size',
          type: { name: 'enum' },
          required: false,
          defaultValue: 'md',
          options: ['sm', 'md', 'lg'],
        },
        selected: {
          name: 'selected',
          type: { name: 'boolean' },
          required: false,
          defaultValue: false,
        },
      },
    },
  },
}

describe('compileManifestSchemas', () => {
  it('turns manifest options into a Zod enum and fills defaults', () => {
    const schemas = compileManifestSchemas(MANIFEST)
    expect(schemas.Chip.parse({})).toEqual({ size: 'md', selected: false })
    expect(schemas.Chip.safeParse({ size: 'xl' }).success).toBe(false)
    expect(schemas.Chip.safeParse({ selected: 'yes' }).success).toBe(false)
  })

  it('is strict about unknown props', () => {
    const schemas = compileManifestSchemas(MANIFEST)
    expect(schemas.Chip.safeParse({ color: 'red' }).success).toBe(false)
  })
})

describe('validateBlueprintAgainstManifest', () => {
  it('accepts a blueprint built only from manifest components', () => {
    const v = validateBlueprintAgainstManifest(
      { version: 1, root: { type: 'Box', props: { padding: 'md' }, children: [{ type: 'Chip' }] } },
      MANIFEST,
    )
    expect(v).toEqual({ ok: true })
  })

  it('rejects an out-of-enum value with the retry-signal message', () => {
    const v = validateBlueprintAgainstManifest(
      { version: 1, root: { type: 'Box', props: { padding: 'huge' } } },
      MANIFEST,
    )
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.errors.some((e) => /"padding" = "huge" is not an allowed value/.test(e))).toBe(true)
  })

  it('rejects components not in the manifest, listing what is allowed', () => {
    const v = validateBlueprintAgainstManifest(
      { version: 1, root: { type: 'Box', children: [{ type: 'Carousel' }] } },
      MANIFEST,
    )
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.errors.join(' ')).toMatch(/<Carousel> is not a real component\. Allowed: Box, Chip/)
  })

  it('rejects children on a leaf and a non-container root', () => {
    const leaf = validateBlueprintAgainstManifest(
      { version: 1, root: { type: 'Box', children: [{ type: 'Chip', children: [{ type: 'Chip' }] }] } },
      MANIFEST,
    )
    expect(leaf.ok).toBe(false)
    if (!leaf.ok) expect(leaf.errors.some((e) => /<Chip>: cannot have children/.test(e))).toBe(true)

    const badRoot = validateBlueprintAgainstManifest({ version: 1, root: { type: 'Chip' } }, MANIFEST)
    expect(badRoot.ok).toBe(false)
    if (!badRoot.ok) expect(badRoot.errors.some((e) => /root node must be a <Box>/.test(e))).toBe(true)
  })
})
