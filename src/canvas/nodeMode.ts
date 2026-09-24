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
