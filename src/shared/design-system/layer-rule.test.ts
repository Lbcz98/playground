import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { collectTokens, cssVarName } from '../../../scripts/tokens/compile'
import {
  TOKEN_LAYER_RULE,
  assignableTokenNames,
  deriveDefaultProps,
  inferTokenTiers,
  isCoreToken,
  manifestZodSchema,
  semanticEquivalents,
  tokenLayers,
  tokenTier,
  type DesignSystemManifest,
} from './manifest'
import { compileManifestSchemas, compiledDefaultProps, validateBlueprintAgainstManifest } from './manifest-zod'
import { SCREENFLOW_MANIFEST } from './screenflow-manifest'
import { parseStorybookDocgen } from './storybook-adapter'
import { parseDesignTokenTiers, parseDesignTokens } from './token-adapter'
import { W3C_MANIFEST } from './w3c-manifest'

/** A small tiered system: a core palette, the semantic roles over it, and a spacing scale. */
const TIERED: DesignSystemManifest = {
  id: 'tiered',
  name: 'Tiered',
  version: '1.0.0',
  tokens: {
    colors: {
      'core-white': '#EEEEEE',
      'core-blue': '#414FFD',
      'semantic-text-primary': '#EEEEEE',
      'semantic-surface': '#191919',
    },
    spacing: { 'core-none': '0px', 'core-sm': '16px', 'core-md': '20px' },
    typography: {},
  },
  components: {
    Box: {
      id: 'Box',
      name: 'Box',
      description: 'container',
      acceptsChildren: true,
      props: {
        background: { name: 'background', type: { name: 'enum' }, required: false, tokenGroup: 'colors', defaultValue: 'semantic-surface' },
        padding: { name: 'padding', type: { name: 'enum' }, required: false, tokenGroup: 'spacing', defaultValue: 'core-sm' },
      },
    },
    Label: {
      id: 'Label',
      name: 'Label',
      description: 'text',
      acceptsChildren: false,
      props: {
        // Declared with a core default and a core option on purpose.
        color: {
          name: 'color',
          type: { name: 'enum' },
          required: false,
          tokenGroup: 'colors',
          defaultValue: 'core-white',
          options: ['core-white', 'semantic-text-primary', 'semantic-surface'],
        },
      },
    },
  },
}

const node = (type: string, props: Record<string, unknown>, children: unknown[] = []) => ({ type, props, children })
// The frame rule keeps the root free of padding.
const blueprint = (...children: unknown[]) => ({ version: 1, root: node('Box', { padding: 'core-none' }, children) })

describe('the layer rule in the manifest', () => {
  it('infers tiers from core / semantic name segments, and only for groups with a semantic layer', () => {
    const tiers = inferTokenTiers(TIERED.tokens)
    expect(tiers.colors).toEqual({
      'core-white': 'core',
      'core-blue': 'core',
      'semantic-text-primary': 'semantic',
      'semantic-surface': 'semantic',
    })
    // No semantic spacing token, so the spacing scale stays untiered.
    expect(tiers.spacing).toBeUndefined()
    expect(tokenLayers(TIERED).rule).toEqual(TOKEN_LAYER_RULE)
  })

  it('never offers a core token, and finds the semantic twin of one', () => {
    expect(assignableTokenNames(TIERED, 'colors')).toEqual(['semantic-text-primary', 'semantic-surface'])
    expect(isCoreToken(TIERED, 'colors', 'core-white')).toBe(true)
    expect(semanticEquivalents(TIERED, 'colors', 'core-white')).toEqual(['semantic-text-primary'])
    expect(semanticEquivalents(TIERED, 'colors', 'core-blue')).toEqual([])
  })

  it('round-trips through the manifest schema, and rejects an unknown tier', () => {
    const declared: DesignSystemManifest = { ...TIERED, layers: { rule: TOKEN_LAYER_RULE, tiers: inferTokenTiers(TIERED.tokens) } }
    expect(manifestZodSchema.safeParse(declared).success).toBe(true)
    const bad = { ...declared, layers: { rule: TOKEN_LAYER_RULE, tiers: { colors: { 'core-white': 'raw' } } } }
    expect(manifestZodSchema.safeParse(bad).success).toBe(false)
    // Manifests saved before the rule existed still load.
    expect(manifestZodSchema.safeParse(TIERED).success).toBe(true)
  })
})

describe('the layer rule in the validator', () => {
  const schemas = compileManifestSchemas(TIERED)

  it('compiles token enums without the core tier, options included', () => {
    expect(schemas.Box.shape.background.safeParse('core-blue').success).toBe(false)
    expect(schemas.Box.shape.background.safeParse('semantic-surface').success).toBe(true)
    expect(schemas.Label.shape.color.safeParse('core-white').success).toBe(false)
  })

  it('swaps a core default for its semantic twin', () => {
    expect(compiledDefaultProps(TIERED.components.Label, schemas.Label).color).toBe('semantic-text-primary')
    expect(deriveDefaultProps(TIERED.components.Label).color).toBe('core-white')
  })

  it('rejects a screen that names a core token, and says which semantic token to use', () => {
    const v = validateBlueprintAgainstManifest(blueprint(node('Label', { color: 'core-white' })), TIERED)
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.errors.join('\n')).toContain(
      '"color" = "core-white" is a core token. The layer rule forbids core tokens in a screen — use the semantic token "semantic-text-primary" (same value).',
    )
  })

  it('tells the model to pick a role when a core token has no semantic twin', () => {
    const v = validateBlueprintAgainstManifest(blueprint(node('Label', { color: 'core-blue' })), TIERED)
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.errors.join('\n')).toMatch(/"core-blue" is a core token\..*use the semantic colors token that matches the element's role/)
  })

  it('rejects raw values, pointing at the token that holds the same value', () => {
    const v = validateBlueprintAgainstManifest(blueprint(node('Label', { color: '#eeeeee' })), TIERED)
    expect(v.ok).toBe(false)
    if (v.ok) return
    expect(v.errors.join('\n')).toContain('"#eeeeee" is a raw value. The layer rule only allows tokens — use "semantic-text-primary".')
  })

  it('accepts semantic colors and layout steps', () => {
    const v = validateBlueprintAgainstManifest(
      blueprint(node('Label', { color: 'semantic-text-primary' })),
      TIERED,
    )
    expect(v.ok, JSON.stringify(v)).toBe(true)
  })
})

describe('tiers read from a token tree', () => {
  const tree = {
    color: {
      core: { white: { $value: '#EEEEEE', $type: 'color' } },
      opacity: { dark: { 10: { $value: '#0000001A', $type: 'color' } } },
      semantic: { text: { primary: { $value: '{color.core.white}', $type: 'color' } } },
    },
    dimension: {
      spacing: {
        core: { sm: { $value: '16px', $type: 'dimension' } },
        semantic: { inset: { $value: '{dimension.spacing.core.sm}', $type: 'dimension' } },
        // Points into a part of the export that isn't here.
        outline: { $value: '{dimension.border-width.core.thin}', $type: 'dimension' },
      },
    },
    typography: { fontSize: { sm: { $value: '12px', $type: 'dimension' } } },
  }

  it('marks a semantic group, its raw siblings, and raw spacing as a layout scale', () => {
    const tiers = parseDesignTokenTiers(tree)
    expect(tiers.colors).toEqual({
      'core-white': 'core',
      'opacity-dark-10': 'core',
      'semantic-text-primary': 'semantic',
    })
    expect(tiers.spacing).toMatchObject({ 'spacing-core-sm': 'layout', 'spacing-semantic-inset': 'semantic' })
    expect(tiers.typography).toBeUndefined()
  })

  it('drops a token whose reference resolves to nothing, instead of leaking "{…}" as a value', () => {
    const tokens = parseDesignTokens(tree)
    expect(tokens.spacing?.['spacing-semantic-inset']).toBe('16px')
    expect(Object.values(tokens.spacing ?? {}).some((v) => v.includes('{'))).toBe(false)
    expect(tokens.spacing).not.toHaveProperty('spacing-outline')
  })

  it('travels with a Storybook import', () => {
    const m = parseStorybookDocgen({
      name: 'Tiered import',
      components: { Btn: { displayName: 'Btn', props: {} } },
      tokens: tree,
    })
    expect(m.layers?.tiers.colors?.['opacity-dark-10']).toBe('core')
    expect(m.layers?.rule).toEqual(TOKEN_LAYER_RULE)
  })
})

describe('the built-in systems follow the layer rule', () => {
  const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
  const source = collectTokens(JSON.parse(readFileSync(join(ROOT, 'tokens/tokens.json'), 'utf8')))

  it('Global CSS Tokens tiers every color exactly as tokens.json does', () => {
    // tokens.json's own tiering: a path through `semantic` is semantic, anything else is core.
    const expected = new Map(
      source
        .filter((t) => t.path[0] === 'color')
        .map((t) => [cssVarName(t.path).replace(/^--color-/, ''), t.path.includes('semantic') ? 'semantic' : 'core']),
    )
    for (const name of Object.keys(W3C_MANIFEST.tokens.colors)) {
      expect(tokenTier(W3C_MANIFEST, 'colors', name), name).toBe(expected.get(name))
    }
    expect(tokenTier(W3C_MANIFEST, 'colors', 'core-neutral-white')).toBe('core')
    expect(tokenTier(W3C_MANIFEST, 'colors', 'opacity-dark-70')).toBe('core')
    expect(tokenTier(W3C_MANIFEST, 'spacing', 'spacing-core-sm')).toBe('layout')
    expect(tokenTier(W3C_MANIFEST, 'radius', 'radius-semantic-pill')).toBe('semantic')
  })

  it('Global CSS Tokens declares no core default, and white text is text-primary', () => {
    for (const component of Object.values(W3C_MANIFEST.components)) {
      for (const prop of Object.values(component.props)) {
        if (!prop.tokenGroup) continue
        expect(isCoreToken(W3C_MANIFEST, prop.tokenGroup, prop.defaultValue), `${component.id}.${prop.name}`).toBe(false)
      }
    }
    expect(W3C_MANIFEST.components.Button.props.textColor.defaultValue).toBe('semantic-functional-text-primary')
    expect(semanticEquivalents(W3C_MANIFEST, 'colors', 'core-neutral-white')).toContain('semantic-functional-text-primary')
  })

  it('Global CSS Tokens carries no unresolved token value', () => {
    for (const dict of Object.values(W3C_MANIFEST.tokens)) {
      for (const value of Object.values(dict ?? {})) expect(value).not.toMatch(/[{}]/)
    }
  })

  it('ScreenFlow has no core tier, so nothing it offers changes', () => {
    const layers = tokenLayers(SCREENFLOW_MANIFEST)
    expect(Object.values(layers.tiers).flatMap((m) => Object.values(m ?? {}))).not.toContain('core')
    expect(assignableTokenNames(SCREENFLOW_MANIFEST, 'colors')).toEqual(Object.keys(SCREENFLOW_MANIFEST.tokens.colors))
  })
})
