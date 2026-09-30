/**
 * The Exploratory vocabulary (phase 9E): the three primitives and `Proposal`.
 *
 * Code, not manifest data — every design system, built-in or imported, gets the
 * same vocabulary, and a Faithful screen never sees it. Not to be confused with
 * `src/design-system/primitives.ts`, which holds the raw token values (and is the
 * one file the token lint allows raw values in); nothing here is a raw value.
 */

import type { DesignSystemManifest, ManifestComponent, ManifestProp, ManifestTokens } from './manifest'
import { assignableTokenNames } from './manifest'

/** The primitive node types: layout and text built only from the active system's tokens. */
export const PRIMITIVE_TYPES = ['primitive:Box', 'primitive:Stack', 'primitive:Text'] as const
export type PrimitiveType = (typeof PRIMITIVE_TYPES)[number]

/** A component the registry lacks, described for the design system to build — never rendered as the real thing. */
export const PROPOSAL_TYPE = 'Proposal'

/**
 * The primitive budget (plan: decided after the first real runs, calibrated in 9G).
 * Checked on the interpreted tree. `primitive:Text` counts like the others.
 */
/** The longest chain of primitives nested in primitives. */
export const PRIMITIVE_MAX_CHAIN = 3
/** The most primitives one screen may use. */
export const PRIMITIVE_MAX_PER_SCREEN = 6

/** Every node type only an Exploratory screen may use. */
export const EXPLORATORY_TYPES: readonly string[] = [...PRIMITIVE_TYPES, PROPOSAL_TYPE]

export const isPrimitive = (type: unknown): type is PrimitiveType =>
  typeof type === 'string' && (PRIMITIVE_TYPES as readonly string[]).includes(type)

// ── The vocabulary as components ────────────────────────────────────────────────────────────────


const prop = (name: string, extra: Partial<ManifestProp> = {}): ManifestProp => ({
  name,
  type: { name: 'string' },
  required: false,
  ...extra,
})

/**
 * A prop drawing from a token group — only when the system has assignable tokens
 * there. With none, the prop is left out: a token prop with no tokens would compile
 * to a free string, and a free string is how a raw value gets in.
 */
function tokenProp(manifest: DesignSystemManifest, name: string, group: keyof ManifestTokens, pick?: RegExp): ManifestProp[] {
  const all = assignableTokenNames(manifest, group)
  const options = pick ? all.filter((n) => pick.test(n)) : undefined
  if (all.length === 0 || (pick && options!.length === 0)) return []
  return [prop(name, { tokenGroup: group, description: `a ${group} token`, ...(options ? { options } : {}) })]
}

const byName = (props: ManifestProp[]): Record<string, ManifestProp> => Object.fromEntries(props.map((p) => [p.name, p]))

/** The three primitives and Proposal, as components of this system — their token props list its own tokens. */
function vocabularyFor(manifest: DesignSystemManifest): Record<string, ManifestComponent> {
  const align = prop('align', { type: { name: 'enum' }, options: ['start', 'center', 'end', 'stretch'] })
  const justify = prop('justify', { type: { name: 'enum' }, options: ['start', 'center', 'end', 'between'] })
  return {
    'primitive:Box': {
      id: 'primitive:Box',
      name: 'Box (primitive)',
      category: 'primitive',
      description: 'A surface: padding, background and radius from the system’s tokens. Exploratory only, with "reuse".',
      acceptsChildren: true,
      props: byName([
        ...tokenProp(manifest, 'padding', 'spacing'),
        ...tokenProp(manifest, 'background', 'colors'),
        ...tokenProp(manifest, 'radius', 'radius'),
      ]),
    },
    'primitive:Stack': {
      id: 'primitive:Stack',
      name: 'Stack (primitive)',
      category: 'primitive',
      description: 'A flex row or column. Exploratory only, with "reuse".',
      acceptsChildren: true,
      props: byName([
        prop('direction', { type: { name: 'enum' }, options: ['vertical', 'horizontal'], defaultValue: 'vertical' }),
        ...tokenProp(manifest, 'gap', 'spacing'),
        align,
        justify,
      ]),
    },
    'primitive:Text': {
      id: 'primitive:Text',
      name: 'Text (primitive)',
      category: 'primitive',
      description: 'A run of text: color, size and weight from the system’s tokens. Exploratory only, with "reuse".',
      acceptsChildren: false,
      props: byName([
        prop('text', { required: true, description: 'the words' }),
        ...tokenProp(manifest, 'color', 'colors'),
        ...tokenProp(manifest, 'size', 'typography', /size/i),
        ...tokenProp(manifest, 'weight', 'typography', /weight/i),
      ]),
    },
    [PROPOSAL_TYPE]: {
      id: PROPOSAL_TYPE,
      name: 'Proposal',
      category: 'proposal',
      description:
        'A component the registry lacks: what it is and the props it would take. A placeholder — never built as the real thing. Exploratory only.',
      acceptsChildren: false,
      props: byName([
        prop('description', { required: true, description: 'what the component is and does' }),
        prop('proposedApi', { type: { name: 'object' }, required: true, description: 'prop name → short type or description' }),
      ]),
    },
  }
}

const views = new WeakMap<DesignSystemManifest, DesignSystemManifest>()

/**
 * The manifest as an Exploratory screen sees it: its own components plus the
 * vocabulary. The manifest itself is never touched; the view is built once per
 * manifest object, so the schema cache (keyed on identity) stays warm. Every law
 * the validator, the frame audit and the interpreter apply to components applies
 * to the primitives through it.
 */
export function withVocabulary(manifest: DesignSystemManifest): DesignSystemManifest {
  let view = views.get(manifest)
  if (!view) {
    view = { ...manifest, components: { ...manifest.components, ...vocabularyFor(manifest) } }
    views.set(manifest, view)
  }
  return view
}
