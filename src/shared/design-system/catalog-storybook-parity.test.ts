/**
 * Catalog ↔ Storybook parity — test plan Phase 1 (P1.1–P1.8,
 * docs/test-plan-storybook-sot.md).
 *
 * `catalog.ts` is the manifest the agent is held to; Storybook documents the code
 * that renders it. These tests diff the two through the committed snapshot
 * (tests/storybook/manifest.snapshot.json — refresh with `npm run storybook:manifest`,
 * freshness is gated by `npm run storybook:manifest:check`) and the join in
 * `storybook-map.ts`.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contentCardSpec, frameSpec, spacingScale } from '../../design-system/primitives'
import type { ManifestProp } from './manifest'
import { SCREENFLOW_MANIFEST } from './screenflow-manifest'
import type { DocgenComponent, DocgenProp, StorybookSnapshot } from './storybook-components-manifest'
import { STORYBOOK_MAP, STORYBOOK_ONLY, type StorybookBinding } from './storybook-map'

const SNAPSHOT: StorybookSnapshot = JSON.parse(
  readFileSync(new URL('../../../tests/storybook/manifest.snapshot.json', import.meta.url), 'utf8'),
)
const catalog = SCREENFLOW_MANIFEST.components
const catalogIds = Object.keys(catalog)

type StoryBinding = Extract<StorybookBinding, { kind: 'story' }>
const storyBound = Object.entries(STORYBOOK_MAP).filter(
  (entry): entry is [string, StoryBinding] => entry[1].kind === 'story',
)

/** The docgen block a story binding points at — the component itself or one of its subcomponents. */
function docgenFor(binding: StoryBinding): DocgenComponent | undefined {
  const component = SNAPSHOT.components[binding.component]
  if (!component) return undefined
  return binding.subcomponent ? component.subcomponents[binding.subcomponent] : component
}

/** The catalog's type for a prop, in the docgen kind vocabulary. */
function catalogKind(prop: ManifestProp): DocgenProp['kind'] {
  if (prop.options) return 'enum'
  if (prop.type.name === 'boolean') return 'boolean'
  if (prop.type.name === 'number') return 'number'
  return 'string'
}

const isEventHandler = (name: string, prop: DocgenProp) => /^on[A-Z]/.test(name) && prop.kind === 'function'

describe('P1.1 — every catalog component is accounted for', () => {
  it('each catalog id has a Storybook binding, and the map names no id the catalog lacks', () => {
    expect(Object.keys(STORYBOOK_MAP).sort()).toEqual([...catalogIds].sort())
  })

  it('each Storybook component either documents a catalog component or says why not', () => {
    const referenced = new Set(
      Object.values(STORYBOOK_MAP).flatMap((b) => (b.kind === 'registry-only' ? [] : [b.component])),
    )
    const unaccounted = Object.keys(SNAPSHOT.components).filter((id) => !referenced.has(id) && !(id in STORYBOOK_ONLY))
    expect(unaccounted).toEqual([])
    const stale = Object.keys(STORYBOOK_ONLY).filter((id) => !(id in SNAPSHOT.components))
    expect(stale).toEqual([])
  })

  it('registry-only components are exactly the four hand-written renderers', () => {
    const registryOnly = Object.entries(STORYBOOK_MAP)
      .filter(([, b]) => b.kind === 'registry-only')
      .map(([id]) => id)
      .sort()
    expect(registryOnly).toEqual(['Button', 'Input', 'Stack', 'Text'])
  })
})

describe('P1.2 — every bound component has stories and documents cleanly', () => {
  it.each(Object.entries(STORYBOOK_MAP).filter(([, b]) => b.kind !== 'registry-only'))('%s', (id, binding) => {
    if (binding.kind === 'registry-only') return
    const component = SNAPSHOT.components[binding.component]
    expect(component, `${id} → ${binding.component} is not in the snapshot`).toBeDefined()
    expect(component.stories.length).toBeGreaterThan(0)
    expect(component.error).toBeUndefined()
    if (binding.kind === 'story' && binding.subcomponent) {
      expect(component.subcomponents[binding.subcomponent], `${binding.subcomponent} is not a declared subcomponent`).toBeDefined()
    }
  })

  it('docgen-unreadable entries really are unreadable (upgrade the entry once docgen reads them)', () => {
    for (const binding of Object.values(STORYBOOK_MAP)) {
      if (binding.kind !== 'docgen-unreadable') continue
      expect(Object.keys(SNAPSHOT.components[binding.component].props)).toEqual([])
    }
  })
})

describe.each(storyBound)('%s', (id, binding) => {
  const docgen = docgenFor(binding)!
  const props = catalog[id].props

  it('P1.3 — every catalog prop exists in code, with the same kind of type', () => {
    for (const [name, prop] of Object.entries(props)) {
      const code = docgen.props[name]
      expect(code, `${id}.${name} is in catalog.ts but not in the component's props`).toBeDefined()
      expect(code.kind, `${id}.${name}`).toBe(catalogKind(prop))
    }
  })

  it('P1.4 — every catalog enum offers exactly the values the code accepts', () => {
    for (const [name, prop] of Object.entries(props)) {
      if (!prop.options) continue
      const map = binding.valueMap?.[name] ?? {}
      const catalogValues = prop.options.filter((option) => map[option] !== 'null')
      expect([...catalogValues].sort(), `${id}.${name}`).toEqual([...(docgen.props[name].options ?? [])].sort())
      for (const [value, code] of Object.entries(map)) {
        expect(prop.options, `${id}.${name} maps "${value}" but the catalog does not offer it`).toContain(value)
        if (code === 'null') expect(docgen.props[name].type, `${id}.${name} maps "${value}" to null`).toMatch(/\bnull\b/)
      }
    }
  })

  it('P1.7 — the component and every catalog prop carry a JSDoc description', () => {
    expect(docgen.description, `${id} has no JSDoc on its component`).not.toBe('')
    const bare = Object.keys(props).filter((name) => !docgen.props[name]?.description)
    expect(bare, `${id} props with no JSDoc`).toEqual([])
  })

  it('P1.8 — every prop the code shows is either in the catalog or declared code-only', () => {
    const undeclared = Object.entries(docgen.props)
      .filter(([name, prop]) => !(name in props) && !(name in (binding.codeOnly ?? {})) && !isEventHandler(name, prop))
      .map(([name]) => name)
    expect(undeclared, `${id}: add each to catalog.ts or to its codeOnly list in storybook-map.ts`).toEqual([])

    for (const [name, reason] of Object.entries(binding.codeOnly ?? {})) {
      expect(docgen.props[name], `${id}.${name} is declared code-only but the code has no such prop`).toBeDefined()
      expect(name in props, `${id}.${name} is declared code-only but catalog.ts has it`).toBe(false)
      if (reason === 'deprecated-alias') expect(docgen.props[name].deprecated, `${id}.${name}`).toBe(true)
    }
  })
})

describe('P1.5 — numeric props agree with the grid and the Content Card spec', () => {
  it('ContentCard height: step is the grid, range is the spec, default is the shipped height', () => {
    const height = catalog.ContentCard.props.height
    const minHeight = Math.ceil((2 * parseFloat(spacingScale[contentCardSpec.inset])) / frameSpec.grid) * frameSpec.grid
    expect(height.step).toBe(frameSpec.grid)
    expect(height.min).toBe(minHeight)
    expect(height.max).toBe(contentCardSpec.maxHeight)
    expect(height.defaultValue).toBe(contentCardSpec.height)
    expect(SNAPSHOT.components['ui-kit-content-card'].props.height.defaultValue).toBe(String(contentCardSpec.height))
  })

  it('every catalog number prop has a range and a step', () => {
    for (const component of Object.values(catalog)) {
      for (const [name, prop] of Object.entries(component.props)) {
        if (prop.type.name !== 'number') continue
        expect([prop.min, prop.max, prop.step].every((v) => typeof v === 'number'), `${component.id}.${name}`).toBe(true)
      }
    }
  })
})

describe('P1.6 — the Content Card documents its zones in slot order', () => {
  it('Header, Body and Footer are Storybook subcomponents of the card, and the catalog slots name them in order', () => {
    const card = SNAPSHOT.components['ui-kit-content-card']
    expect(Object.keys(card.subcomponents).sort()).toEqual(['ContentCardBody', 'ContentCardFooter', 'ContentCardHeader'])
    expect(catalog.ContentCard.slots).toEqual(['ContentCardHeader', 'ContentCardBody', 'ContentCardFooter'])
    for (const zone of catalog.ContentCard.slots ?? []) expect(catalog[zone].parents).toEqual(['ContentCard'])
  })
})

describe('P1.8 — no inherited DOM props leak into the documented surface', () => {
  const everyDocgen = Object.entries(SNAPSHOT.components).flatMap(([id, c]) => [
    [id, c] as const,
    ...Object.entries(c.subcomponents).map(([sub, s]) => [`${id}/${sub}`, s] as const),
  ])

  it.each(everyDocgen)('%s', (_id, component) => {
    const leaked = Object.entries(component.props).filter(([, p]) => p.inherited).map(([name]) => name)
    expect(leaked).toEqual([])
    // The primitives rule: appearance only through token-named props, never a raw style.
    expect(Object.keys(component.props)).not.toContain('style')
    expect(Object.keys(component.props)).not.toContain('className')
    expect(Object.keys(component.props).filter((name) => name.startsWith('aria-'))).toEqual([])
  })
})
