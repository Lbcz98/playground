import { createContext, useContext } from 'react'

/**
 * How the nodes under a `NodeRenderer` behave: `edit` selects, `play` runs the
 * prototype's links, `inert` (a thumbnail) does neither.
 */
export type NodeMode = 'edit' | 'play' | 'inert'

export const NodeModeContext = createContext<NodeMode>('edit')

export function useNodeMode(): NodeMode {
  return useContext(NodeModeContext)
}

/**
 * While playing and the viewer has moved the focus, an element that held it goes
 * back to the state its siblings rest in (a rail's cards rest `selected`, not
 * `default`). Keyed by component type; built from the screen's authored props.
 */
export const PlayRestContext = createContext<Record<string, unknown>>({})

/**
 * Feedback for a press on something that links nowhere: the element springs
 * back (`.sfs-press`, the system spring). Restarts if pressed again.
 */
export function pressFeedback(el: Element | null): void {
  if (!el) return
  el.classList.remove('sfs-press')
  void (el as HTMLElement).offsetWidth
  el.classList.add('sfs-press')
  el.addEventListener('animationend', () => el.classList.remove('sfs-press'), { once: true })
}

/** Whether the node with this id, or any node above it, carries a link. */
export function linksFrom(tree: { id: string; goTo?: string; children: unknown[] }, id: string): boolean {
  const walk = (node: { id: string; goTo?: string; children: unknown[] }, linked: boolean): boolean | null => {
    const here = linked || !!node.goTo
    if (node.id === id) return here
    for (const child of node.children as (typeof node)[]) {
      const hit = walk(child, here)
      if (hit !== null) return hit
    }
    return null
  }
  return walk(tree, false) ?? false
}
