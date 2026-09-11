/**
 * PropertyInspector — the right sidebar (spec §8 Step 2 + 3).
 *
 * Reactive, systems-driven: it subscribes to the selected node, looks that node's
 * `componentType` up in the ACTIVE `DesignSystemManifest`, and maps over the
 * component's `props` to render one `<PropertyControl>` each. Editing a control
 * fires `updateNodeProps(activeNodeId, { [prop]: value })`, which the canvas
 * re-renders from instantly.
 */

import { useActiveDesignSystem } from '@/design-system/DesignSystemProvider'
import { findNode } from '@/model/nodeTree'
import { selectActiveNodeId, useFlowStore } from '@/store/flowStore'
import { PropertyControl } from './PropertyControl'

export function PropertyInspector(): JSX.Element {
  const tree = useFlowStore((s) => s.tree)
  const activeNodeId = useFlowStore(selectActiveNodeId)
  const updateNodeProps = useFlowStore((s) => s.updateNodeProps)
  const manifest = useActiveDesignSystem()

  const node = activeNodeId ? findNode(tree, activeNodeId) : null
  const component = node ? manifest.components[node.type] : null

  return (
    <section className="flex flex-1 flex-col gap-md overflow-auto p-lg">
      <h2 className="text-xs font-semibold text-ink-muted">Properties</h2>

      {!node ? (
        <p className="text-sm text-ink-muted">Select a component on the canvas to edit it.</p>
      ) : !component ? (
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-ink">{node.type}</span> isn&apos;t part of the active
          design system ({manifest.name}).
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">{component.name}</span>
            <span className="text-xs text-ink-muted">{node.id}</span>
          </div>

          {Object.keys(component.props).length === 0 ? (
            <p className="text-sm text-ink-muted">This component has no editable properties.</p>
          ) : (
            <div className="flex flex-col gap-md">
              {Object.entries(component.props).map(([name, propDef]) => (
                <PropertyControl
                  key={name}
                  propName={name}
                  propDef={propDef}
                  currentValue={(node.props as Record<string, unknown>)[name]}
                  onChange={(value) => updateNodeProps(node.id, { [name]: value })}
                  tokenDict={propDef.tokenGroup ? manifest.tokens[propDef.tokenGroup] : undefined}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
