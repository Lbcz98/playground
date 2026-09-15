import type { CanvasNode } from '@/model/nodeTree'
import { useHydratedRegistry } from '@/design-system/DesignSystemProvider'
import { useFlowStore, ROOT_ID } from '@/store/flowStore'
import { cx } from '@/lib/cx'

function LayerRow({ node, depth }: { node: CanvasNode; depth: number }): JSX.Element {
  const selectedId = useFlowStore((s) => s.selectedId)
  const select = useFlowStore((s) => s.select)
  const deleteNode = useFlowStore((s) => s.deleteNode)
  const entry = useHydratedRegistry().get(node.type)
  const isSelected = selectedId === node.id
  const indent = ['pl-sm', 'pl-md', 'pl-lg', 'pl-xl', 'pl-2xl'][Math.min(depth, 4)]

  return (
    <>
      <div
        className={cx(
          'flex items-center justify-between rounded-sm py-xs pr-xs text-sm',
          indent,
          isSelected ? 'bg-brand-subtle text-brand-strong' : 'text-ink hover:bg-subtle',
        )}
        onClick={() => select(node.id)}
      >
        <span className="flex items-center gap-xs">
          <span className="font-medium">{entry?.label ?? node.type}</span>
          {node.anchor ? (
            <span className="rounded-full bg-brand-subtle px-xs text-xs text-brand-strong">anchored</span>
          ) : null}
        </span>
        {node.id !== ROOT_ID ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              deleteNode(node.id)
            }}
            className="rounded-sm px-xs text-xs text-ink-muted hover:text-danger"
          >
            Delete
          </button>
        ) : null}
      </div>
      {node.children.map((child) => (
        <LayerRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  )
}

export function LayersPanel(): JSX.Element {
  const tree = useFlowStore((s) => s.tree)
  return (
    <section className="flex flex-col gap-sm">
      <h2 className="text-xs font-semibold text-ink-muted">Layers</h2>
      <div className="flex flex-col">
        <LayerRow node={tree} depth={0} />
      </div>
    </section>
  )
}
