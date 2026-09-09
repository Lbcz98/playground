import { describe, expect, it } from 'vitest'
import { PRICING_CARD_BLUEPRINT } from './pricingCard'
import type { BlueprintNode } from '@/shared/blueprint'
import { getEntry } from '@/design-system/registry'

/**
 * The "dummy LLM" payload must itself obey the rules we will later enforce on the
 * real model: only registry components, only token-valid props.
 */
function walk(node: BlueprintNode, path = 'root'): void {
  const entry = getEntry(node.type)
  expect(entry, `${path}: unknown component "${node.type}"`).not.toBeNull()
  if (!entry) return

  const result = entry.schema.safeParse(node.props ?? {})
  expect(result.success, `${path} (${node.type}): ${JSON.stringify(result)}`).toBe(true)

  if (node.children) {
    expect(entry.acceptsChildren, `${path}: "${node.type}" cannot have children`).toBe(true)
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
