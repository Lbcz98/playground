import { describe, expect, it } from 'vitest'
import { PRICING_CARD_BLUEPRINT } from './pricingCard'
import type { BlueprintNode } from '@/shared/blueprint'
import { SCREENFLOW_MANIFEST } from '@/shared/design-system/screenflow-manifest'
import { compileManifestSchemas } from '@/shared/design-system/manifest-zod'

/**
 * The "dummy LLM" payload must itself obey the rules we enforce on the real
 * model: only components from the active design system, only token-valid props.
 */
const SCHEMAS = compileManifestSchemas(SCREENFLOW_MANIFEST)

function walk(node: BlueprintNode, path = 'root'): void {
  const component = SCREENFLOW_MANIFEST.components[node.type]
  expect(component, `${path}: unknown component "${node.type}"`).toBeDefined()
  if (!component) return

  const result = SCHEMAS[node.type].safeParse(node.props ?? {})
  expect(result.success, `${path} (${node.type}): ${JSON.stringify(result)}`).toBe(true)

  if (node.children) {
    expect(component.acceptsChildren, `${path}: "${node.type}" cannot have children`).toBe(true)
    node.children.forEach((child, i) => walk(child, `${path}.${node.type}[${i}]`))
  }
}

describe('PRICING_CARD_BLUEPRINT fixture', () => {
  it('is version 1', () => {
    expect(PRICING_CARD_BLUEPRINT.version).toBe(1)
  })

  it('uses only registry components with token-valid props', () => {
    walk(PRICING_CARD_BLUEPRINT.root)
  })

  it('has exactly three pricing tiers', () => {
    const row = PRICING_CARD_BLUEPRINT.root.children?.[1]
    expect(row?.children?.length).toBe(3)
  })
})
