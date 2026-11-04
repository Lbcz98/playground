import { createContext, useContext } from 'react'

/**
 * What the player tells the screens about the flow's notice (`notice` in flow.ts):
 * `open` while the message is on screen, `badge` from the moment it arrives until the flow reaches
 * the state that cancels it. Outside a player (a story, a check) the message rests open, so it can be drawn and measured, and there is no badge.
 */
export interface FlowNoticeValue {
  open: boolean
  badge: boolean
}

export const FlowNoticeContext = createContext<FlowNoticeValue>({ open: true, badge: false })

export function useFlowNotice(): FlowNoticeValue {
  return useContext(FlowNoticeContext)
}
