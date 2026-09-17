/**
 * PropertyInspector — the right sidebar (spec §8 Step 2 + 3).
 *
 * Reactive, systems-driven: it subscribes to the selected node, looks that node's
 * `componentType` up in the ACTIVE `DesignSystemManifest`, and maps over the
 * component's `props` to render one `<PropertyControl>` each. Editing a control
 * fires `updateNodeProps(activeNodeId, { [prop]: value })`, which the canvas
 * re-renders from instantly.
 *
 * Spacing controls only offer on-grid steps, token controls never offer a core
 * token (the token tier rule, `shared/design-system/manifest.ts`), and a direct child
 * of the root gets an extra "Anchor to focus zone" toggle (see
 * `shared/layout/frame.ts`).
 */

import { useActiveDesignSystem } from '@/design-system/DesignSystemProvider'
import { findNode } from '@/model/nodeTree'
import type { DesignSystemManifest, ManifestProp } from '@/shared/design-system/manifest'
import { assignableTokenNames, isCoreToken } from '@/shared/design-system/manifest'
import { anchorZone, onGridSpacingNames } from '@/shared/layout/frame'
import { selectActiveNodeId, useFlowStore } from '@/store/flowStore'
import { useFrameStore } from '@/store/frameStore'
import { PropertyControl } from './PropertyControl'

/** The prop as the Inspector should offer it — no core tokens, spacing cut to the 8pt grid. */
function controlProp(manifest: DesignSystemManifest, prop: ManifestProp): ManifestProp {
  const group = prop.tokenGroup
  if (!group || !prop.options) return prop
  const options = prop.options.filter((option) => !isCoreToken(manifest, group, option))
  return { ...prop, options: group === 'spacing' ? onGridSpacingNames(manifest, options) : options }
}

/** The prop's token scale in the active manifest — no core tokens, spacing cut to the 8pt grid. */
function controlTokens(
  manifest: DesignSystemManifest,
  prop: ManifestProp,
): Record<string, string> | undefined {
  if (!prop.tokenGroup) return undefined
  const dict = manifest.tokens[prop.tokenGroup]
  if (!dict) return undefined
  const names = assignableTokenNames(manifest, prop.tokenGroup)
  const allowed = new Set(prop.tokenGroup === 'spacing' ? onGridSpacingNames(manifest, names) : names)
  return Object.fromEntries(Object.entries(dict).filter(([name]) => allowed.has(name)))
}

export function PropertyInspector(): JSX.Element {
  const tree = useFlowStore((s) => s.tree)
  const focusSide = useFrameStore((s) => s.focus.side)
  const activeNodeId = useFlowStore(selectActiveNodeId)
  const updateNodeProps = useFlowStore((s) => s.updateNodeProps)
  const setAnchor = useFlowStore((s) => s.setAnchor)
  const manifest = useActiveDesignSystem()

  const node = activeNodeId ? findNode(tree, activeNodeId) : null
  const component = node ? manifest.components[node.type] : null
  const isRootChild = node ? tree.children.some((child) => child.id === node.id) : false

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

          {isRootChild ? (
            <div className="border-b border-line pb-md">
              <PropertyControl
                propName="anchor"
                propDef={{
                  name: 'anchorToFocusZone',
                  type: { name: 'boolean' },
                  required: false,
                  description: `Pins this group to the bottom corner on the side the TV focus is on — now ${anchorZone(focusSide)}. One group per frame.`,
                }}
                currentValue={Boolean(node.anchor)}
                onChange={(value) => setAnchor(node.id, Boolean(value))}
              />
            </div>
          ) : null}

          {Object.keys(component.props).length === 0 ? (
            <p className="text-sm text-ink-muted">This component has no editable properties.</p>
          ) : (
            <div className="flex flex-col gap-md">
              {Object.entries(component.props).map(([name, propDef]) => (
                <PropertyControl
                  key={name}
                  propName={name}
                  propDef={controlProp(manifest, propDef)}
                  currentValue={(node.props as Record<string, unknown>)[name]}
                  onChange={(value) => updateNodeProps(node.id, { [name]: value })}
                  tokenDict={controlTokens(manifest, propDef)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
