import { cloneElement, type MouseEvent, type ReactElement } from 'react'
import type { CanvasNode } from '@/model/nodeTree'
import { useHydratedRegistry } from '@/design-system/DesignSystemProvider'
import { useFlowStore } from '@/store/flowStore'
import { usePlayStore } from '@/store/playStore'
import { cx } from '@/lib/cx'
import { useNodeMode } from './nodeMode'

/**
 * A click can bubble through several nodes. The innermost one takes the TV focus
 * (the focus is where the viewer pressed); a `goTo` on it or on any node above
 * it opens its screen. This remembers which clicks already set the focus.
 */
const focusedClicks = new WeakSet<Event>()

/**
 * Recursively turns a `CanvasNode` into React elements using only the
 * ComponentRegistry. Unknown types and prop-validation failures render a visible
 * placeholder instead of throwing, so a bad AI payload can never blank the canvas.
 */
export function NodeRenderer({ node }: { node: CanvasNode }): ReactElement {
  const selectedId = useFlowStore((s) => s.selectedId)
  const select = useFlowStore((s) => s.select)
  const registry = useHydratedRegistry()
  const mode = useNodeMode()
  const focus = usePlayStore((s) => s.focus)
  const go = usePlayStore((s) => s.go)

  const entry = registry.get(node.type)
  if (!entry) {
    return (
      <div className="rounded-sm border border-danger bg-danger-subtle p-2xs text-sm text-danger">
        Unknown component: {node.type}
      </div>
    )
  }

  const parsed = entry.schema.safeParse(node.props)
  const props = parsed.success ? (parsed.data as Record<string, unknown>) : entry.defaultProps

  const children = entry.acceptsChildren
    ? node.children.map((child) => <NodeRenderer key={child.id} node={child} />)
    : null

  const rendered = entry.render(props, children)
  const isSelected = mode === 'edit' && selectedId === node.id

  if (mode === 'inert') {
    return cloneElement(rendered, { 'data-node-id': node.id })
  }

  if (mode === 'play') {
    // Playing: no selection chrome. A linked element is a live hotspot.
    return cloneElement(rendered, {
      'data-node-id': node.id,
      className: cx(rendered.props.className, 'outline-none', node.goTo && 'cursor-pointer'),
      onClick: (event: MouseEvent) => {
        if (!focusedClicks.has(event.nativeEvent)) {
          focusedClicks.add(event.nativeEvent)
          focus(node.id)
        }
        if (node.goTo) {
          event.stopPropagation()
          go(node.goTo)
        }
      },
    })
  }

  // Decorate the component's own root element — no wrapper div, so Stack layout
  // (align / justify / gap) stays exactly as authored. `data-node-id` lets the
  // canvas map what's on screen (e.g. the focused element) back to the tree.
  return cloneElement(rendered, {
    'data-node-id': node.id,
    className: cx(
      rendered.props.className,
      'outline-none',
      isSelected ? 'ring ring-brand' : 'hover:ring hover:ring-brand-subtle',
    ),
    onClick: (event: MouseEvent) => {
      event.stopPropagation()
      select(node.id)
    },
  })
}
