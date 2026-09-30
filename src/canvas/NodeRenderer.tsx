import { cloneElement, type MouseEvent, type ReactElement } from 'react'
import type { CanvasNode } from '@/model/nodeTree'
import { useHydratedRegistry } from '@/design-system/DesignSystemProvider'
import { DecorationHost } from '@/design-system/registry'
import { useFlowStore } from '@/store/flowStore'
import { usePlayStore } from '@/store/playStore'
import { cx } from '@/lib/cx'
import { PROPOSAL_TYPE, isPrimitive } from '@/shared/design-system/primitives'
import { focusPropsFor, unfocusedValue } from '@/shared/layout/frame'
import { PlayRestContext, linksFrom, pressFeedback, useNodeMode } from './nodeMode'
import { useContext } from 'react'

/**
 * A click can bubble through several nodes. The innermost one takes the TV focus
 * (the focus is where the viewer pressed); a `goTo` on it or on any node above
 * it opens its screen. This remembers which clicks already set the focus.
 */
const focusedClicks = new WeakSet<Event>()

/**
 * A declared deviation (phase 9D) shows on the canvas while editing as a dashed
 * outline in the theme's `brand` color — no new token. The dashed shape sets it
 * apart from the selection ring (solid) without relying on color alone. It is
 * edit-only: Play, thumbnails and anything exported never draw it.
 */
export const DEVIATION_OUTLINE = 'outline outline-2 outline-dashed outline-brand outline-offset-2'

/**
 * Whether the edit canvas marks a node as off-pattern: it declares a deviation, or it
 * is a primitive (off-registry by definition). A Proposal keeps its own placeholder
 * look — its dotted box already says it is not a real component.
 */
export function marksOffPattern(node: CanvasNode): boolean {
  return node.type !== PROPOSAL_TYPE && (!!node.deviation || isPrimitive(node.type))
}

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
  const playFocusId = usePlayStore((s) => s.focusId)
  const playFocusItem = usePlayStore((s) => s.focusItem)
  const rest = useContext(PlayRestContext)

  const entry = registry.get(node.type)
  if (!entry) {
    return (
      <div className="rounded-sm border border-danger bg-danger-subtle p-2xs text-sm text-danger">
        Unknown component: {node.type}
      </div>
    )
  }

  const parsed = entry.schema.safeParse(node.props)
  let props = parsed.success ? (parsed.data as Record<string, unknown>) : entry.defaultProps

  // Playing, once the viewer has moved the focus (click or arrow key), the focus
  // props follow it: the target takes the focus, whatever held it rests.
  const focusProp = mode === 'play' && playFocusId !== null ? focusPropsFor(entry.component)[0] : undefined
  if (focusProp) {
    const isTarget = node.id === playFocusId
    const enumFocus = focusProp.options?.includes('focus')
    const current = props[focusProp.name]
    let value: unknown
    if (enumFocus) value = isTarget ? 'focus' : current === 'focus' ? (rest[node.type] ?? unfocusedValue(focusProp)) : current
    else value = isTarget ? (playFocusItem ?? current) : unfocusedValue(focusProp)
    props = { ...props, [focusProp.name]: value }
  }

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
          const { screens } = useFlowStore.getState()
          const { trail, say } = usePlayStore.getState()
          const screen = screens.find((s) => s.id === trail[trail.length - 1]) ?? screens[0]
          if (screen && !linksFrom(screen.tree, node.id)) {
            const target = (event.target as Element).closest('button,[tabindex]')
            pressFeedback(target)
            say(`${target?.getAttribute('aria-label') || target?.textContent?.trim().slice(0, 32) || node.type} doesn't link anywhere in this prototype.`)
          }
          const item = (event.target as Element).closest('[data-focus-item]')?.getAttribute('data-focus-item')
          focus(node.id, item ?? null)
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
    ...(rendered.type === DecorationHost ? { 'data-selected': isSelected, 'data-editable': true } : {}),
    className: cx(
      rendered.props.className,
      // A node that declares a deviation swaps the invisible outline for the dashed one.
      marksOffPattern(node) ? DEVIATION_OUTLINE : 'outline-none',
      isSelected ? 'ring ring-brand' : 'hover:ring hover:ring-brand-subtle',
    ),
    ...(node.deviation ? { 'data-deviation': node.deviation.ruleId } : {}),
    // Editing, a click on this node's own surface only selects it: caught before
    // the component sees it, so a component's own click (a card turning its
    // page) runs in Play, never here. A click on a child node is the child's.
    onClickCapture: (event: MouseEvent) => {
      if ((event.target as Element).closest('[data-node-id]')?.getAttribute('data-node-id') !== node.id) return
      event.stopPropagation()
      select(node.id)
    },
    onClick: (event: MouseEvent) => {
      event.stopPropagation()
      select(node.id)
    },
  })
}
