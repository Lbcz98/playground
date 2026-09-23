/**
 * The built-in "ScreenFlow" design system, expressed as a `DesignSystemManifest`.
 *
 * It is DERIVED from the existing hardcoded catalog (`src/design-system/catalog.ts`)
 * and the primitive scales (`src/design-system/primitives.ts`) — never re-authored —
 * so the two can't drift. This manifest is the default/fallback everywhere: the AI
 * orchestrator uses it when no active manifest is supplied, and the design-system
 * library always contains it.
 */

import type { z } from 'zod'
import { Catalog, CATALOG_TYPES, getCatalogEntry, type Control } from '@/design-system/catalog'
import { SPACE_TOKENS } from '@/design-system/tokens'
import {
  palette,
  spacingScale,
  radiusScale,
  shadowScale,
  fontSizeScale,
  fontWeightScale,
} from '@/design-system/primitives'
import {
  TOKEN_TIER_RULE,
  type DesignSystemManifest,
  type ManifestComponent,
  type ManifestControlKind,
  type ManifestProp,
  type ManifestTokenTiers,
  type ManifestTokens,
  type TokenTier,
} from './manifest'
import { DTV_SCREEN_LAYERS } from './screen-layers'
import { SCREEN_TEMPLATES } from '@/shared/templates'

export const SCREENFLOW_MANIFEST_ID = 'screenflow'

// ---------------------------------------------------------------------------
// Tokens — the semantic dictionary, mirroring `tailwind.config.ts`
// ---------------------------------------------------------------------------

function screenflowTokens(): ManifestTokens {
  return {
    colors: {
      page: palette.gray[100],
      surface: palette.white,
      subtle: palette.gray[50],
      line: palette.gray[200],
      'line-strong': palette.gray[300],
      ink: palette.gray[900],
      'ink-muted': palette.gray[500],
      'ink-inverse': palette.white,
      brand: palette.blue[500],
      'brand-hover': palette.blue[600],
      'brand-subtle': palette.blue[100],
      'brand-strong': palette.blue[700],
      danger: palette.red[500],
      'danger-hover': palette.red[600],
      'danger-subtle': palette.red[100],
      success: palette.green[500],
      'success-subtle': palette.green[100],
    },
    spacing: { ...spacingScale },
    typography: Object.fromEntries([
      ...Object.entries(fontSizeScale).map(([k, [size]]) => [`size-${k}`, size]),
      ...Object.entries(fontWeightScale).map(([k, w]) => [`weight-${k}`, w]),
    ]),
    radius: { ...radiusScale },
    shadow: { ...shadowScale },
  }
}

/**
 * ScreenFlow's colors are already roles (surface, ink, brand) over `palette`,
 * which never reaches the manifest — so every color is semantic, and the scales
 * are layout steps.
 */
function screenflowTokenTiers(tokens: ManifestTokens): ManifestTokenTiers {
  const all = (dict: Record<string, string> | undefined, tier: TokenTier): Record<string, TokenTier> =>
    Object.fromEntries(Object.keys(dict ?? {}).map((name) => [name, tier]))
  return {
    rule: TOKEN_TIER_RULE,
    tiers: {
      colors: all(tokens.colors, 'semantic'),
      shadow: all(tokens.shadow, 'semantic'),
      spacing: all(tokens.spacing, 'layout'),
      radius: all(tokens.radius, 'layout'),
      typography: all(tokens.typography, 'layout'),
    },
  }
}

// ---------------------------------------------------------------------------
// Components — walked out of the Zod schemas + control metadata in the catalog
// ---------------------------------------------------------------------------

function shapeOf(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
  return (schema as unknown as { shape?: Record<string, z.ZodTypeAny> }).shape ?? {}
}

function propTypeName(control: Control | undefined): { name: string } {
  if (!control) return { name: 'string' }
  switch (control.kind) {
    case 'boolean':
      return { name: 'boolean' }
    case 'select':
      return { name: 'enum' }
    case 'number':
      return { name: 'number' }
    default:
      return { name: 'string' }
  }
}

function controlKind(control: Control | undefined): ManifestControlKind | undefined {
  if (!control) return undefined
  return control.kind
}

function toManifestComponent(type: string): ManifestComponent {
  const entry = getCatalogEntry(type)!
  const shape = shapeOf(entry.schema)

  const props: Record<string, ManifestProp> = {}
  for (const name of Object.keys(shape)) {
    const control = entry.controls[name]
    const options = control?.kind === 'select' ? [...control.options] : undefined
    // Gap / padding draw from the spacing scale — the frame rules key off this.
    const spacing = control?.kind === 'select' && control.options === SPACE_TOKENS
    props[name] = {
      name,
      type: propTypeName(control),
      required: false, // every catalog prop has a schema default
      defaultValue: entry.defaultProps[name],
      ...(options ? { options } : {}),
      ...(spacing ? { tokenGroup: 'spacing' as const } : {}),
      ...(controlKind(control) ? { control: controlKind(control) } : {}),
      ...(control?.kind === 'number' && control.min !== undefined ? { min: control.min } : {}),
      ...(control?.kind === 'number' && control.max !== undefined ? { max: control.max } : {}),
      ...(control?.kind === 'number' && control.step !== undefined ? { step: control.step } : {}),
    }
  }

  return {
    id: entry.type,
    name: entry.label,
    description: entry.summary,
    category: entry.category,
    acceptsChildren: entry.acceptsChildren,
    ...(entry.slots ? { slots: [...entry.slots] } : {}),
    ...(entry.parents ? { parents: [...entry.parents] } : {}),
    props,
  }
}

function screenflowComponents(): Record<string, ManifestComponent> {
  const out: Record<string, ManifestComponent> = {}
  for (const type of CATALOG_TYPES) out[type] = toManifestComponent(type)
  return out
}

// ---------------------------------------------------------------------------

/** Build a manifest from an arbitrary catalog-shaped map (kept generic for tests). */
export function catalogToManifest(): DesignSystemManifest {
  const tokens = screenflowTokens()
  return {
    id: SCREENFLOW_MANIFEST_ID,
    name: 'ScreenFlow',
    version: '1.0.0',
    tokens,
    components: screenflowComponents(),
    tokenTiers: screenflowTokenTiers(tokens),
    // Every screen is a DTV+ TV screen, so the built-in system follows the DTV layer rule.
    screenLayers: DTV_SCREEN_LAYERS,
    templates: SCREEN_TEMPLATES,
  }
}

export const SCREENFLOW_MANIFEST: DesignSystemManifest = catalogToManifest()

// Touch `Catalog` so a future catalog rename fails this file loudly.
void Catalog
