import { useHydratedRegistry } from '@/design-system/DesignSystemProvider'
import { findNode, findParent, type CanvasNode } from '@/model/nodeTree'
import { canAddChild, slotInsertIndex } from '@/shared/design-system/manifest'
import { useFlowStore } from '@/store/flowStore'

/**
 * Adds a component from the active design system to the tree. It goes into the
 * nearest node — the selection, then outward through its ancestors to the root —
 * that may take it: a container, one whose slots include it (a Content Card and
 * its zones), and, for a part like a card's zone, one of the parents it allows.
 * In a slotted parent it lands in its slot's place, so the order always holds.
 * A component with nowhere to go from the current selection is disabled, with
 * the reason on hover.
 */
export function ComponentPalette(): JSX.Element {
  const tree = useFlowStore((s) => s.tree)
  const selectedId = useFlowStore((s) => s.selectedId)
  const addNode = useFlowStore((s) => s.addNode)
  const registry = useHydratedRegistry()

  function targetFor(type: string): { parentId: string; index: number } | null {
    const child = registry.get(type)?.component
    if (!child) return null
    let node: CanvasNode | null = (selectedId && findNode(tree, selectedId)) || tree
    while (node) {
      const parent = registry.get(node.type)?.component
      const siblings = node.children.map((c) => c.type)
      if (parent && canAddChild(parent, child, siblings)) {
        return { parentId: node.id, index: slotInsertIndex(parent, siblings, type) }
      }
      node = findParent(tree, node.id)
    }
    return null
  }

  function whyNot(type: string): string {
    const parents = registry.get(type)?.component.parents
    return parents
      ? `Select a ${parents.map((p) => registry.get(p)?.label ?? p).join(' or ')} that has no ${registry.get(type)?.label ?? type} yet.`
      : 'Nothing in the selection can hold this.'
  }

  return (
    <section className="flex flex-col gap-2xs">
      <h2 className="text-xs font-semibold text-ink-muted">Components</h2>
      <div className="flex flex-col gap-3xs">
        {registry.types.map((type) => {
          const entry = registry.get(type)!
          const target = targetFor(type)
          return (
            <button
              key={type}
              type="button"
              disabled={!target}
              title={target ? undefined : whyNot(type)}
              onClick={() => target && addNode(target.parentId, type, target.index)}
              className="flex items-center justify-between rounded-md border border-line bg-surface px-sm py-2xs text-sm text-ink hover:bg-subtle disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-medium">{entry.label}</span>
              <span className="text-xs text-ink-muted">{entry.category}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
