/**
 * The live prototype player. Edit mode selects elements; Play mode runs the
 * document: a click on an element with a `goTo` link opens the screen it names,
 * and the trail of screens visited lets Back retrace it — the way a TV remote's
 * Back key steps out one level (3 → 2 → 1). Kept apart from `flowStore`: playing
 * never changes the document, so it is never an undo step.
 */

import { create } from 'zustand'
import { useFlowStore } from '@/store/flowStore'

export type PlayMode = 'edit' | 'play'

interface PlayState {
  mode: PlayMode
  /** Screen ids visited, oldest first; the last one is on screen. */
  trail: string[]
  /** The element the viewer last moved the TV focus to (a click or an arrow key) — null until they do. */
  focusId: string | null
  /** Which part of that element holds it, when it has several focusable parts (a menu's item). */
  focusItem: string | null
  /** Enter Play from the screen open in the editor. */
  play: () => void
  edit: () => void
  /** Open a screen of the document, if it exists. */
  go: (screenId: string) => void
  /** Step back one screen; false when already on the first. */
  back: () => boolean
  /** Return to the screen Play started on. */
  restart: () => void
  focus: (nodeId: string | null, item?: string | null) => void
}

export const usePlayStore = create<PlayState>((set, get) => ({
  mode: 'edit',
  trail: [],
  focusId: null,
  focusItem: null,

  play: () => set({ mode: 'play', trail: [useFlowStore.getState().activeId], focusId: null, focusItem: null }),
  edit: () => set({ mode: 'edit', trail: [], focusId: null, focusItem: null }),

  go: (screenId) => {
    if (!useFlowStore.getState().screens.some((entry) => entry.id === screenId)) return
    set((s) => (s.trail[s.trail.length - 1] === screenId ? s : { trail: [...s.trail, screenId], focusId: null, focusItem: null }))
  },

  back: () => {
    if (get().trail.length < 2) return false
    set((s) => ({ trail: s.trail.slice(0, -1), focusId: null, focusItem: null }))
    return true
  },

  restart: () => set((s) => ({ trail: s.trail.slice(0, 1), focusId: null, focusItem: null })),

  focus: (nodeId, item = null) => set({ focusId: nodeId, focusItem: item }),
}))

/** The id of the screen Play is showing, falling back to the first when the document changed under it. */
export function currentPlayScreenId(trail: string[], screenIds: string[]): string {
  const current = trail[trail.length - 1]
  return current && screenIds.includes(current) ? current : screenIds[0]
}
