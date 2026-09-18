import { useHydratedRegistry } from '@/design-system/DesignSystemProvider'
import { findNode, findParent } from '@/model/nodeTree'
import { useFlowStore, ROOT_ID } from '@/store/flowStore'

/**
 * Adds a component from the active design system to the tree. Target parent:
 *   - the selected node, if it accepts children (a container)
 *   - otherwise the selected node's parent
 *   - otherwise the root
 */
export function ComponentPalette(): JSX.Element {
  const tree = useFlowStore((s) => s.tree)
  const selectedId = useFlowStore((s) => s.selectedId)
  const addNode = useFlowStore((s) => s.addNode)
  const registry = useHydratedRegistry()

  function resolveParentId(): string {
    if (!selectedId) return ROOT_ID
    const selected = findNode(tree, selectedId)
    if (selected && registry.get(selected.type)?.acceptsChildren) return selected.id
    const parent = findParent(tree, selectedId)
    return parent?.id ?? ROOT_ID
  }

  return (
    <section className="flex flex-col gap-2xs">
      <h2 className="text-xs font-semibold text-ink-muted">Components</h2>
      <div className="flex flex-col gap-3xs">
        {registry.types.map((type) => {
          const entry = registry.get(type)!
          return (
            <button
              key={type}
              type="button"
              onClick={() => addNode(resolveParentId(), type)}
              className="flex items-center justify-between rounded-md border border-line bg-surface px-sm py-2xs text-sm text-ink hover:bg-subtle"
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
