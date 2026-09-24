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
