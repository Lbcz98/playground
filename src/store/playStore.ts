/**
 * The live prototype player. Edit mode selects elements; Play mode runs the
 * document: a click on an element with a `goTo` link opens the screen it names,
 * moving the focus onto what holds it one level deeper opens that level's page
 * (`focusEntersLevel`), and the trail of screens visited lets Back retrace it — the way a TV remote's
 * Back key steps out one level (3 → 2 → 1). Kept apart from `flowStore`: playing
 * never changes the document, so it is never an undo step.
 */

import { create } from 'zustand'
import { useFlowStore } from '@/store/flowStore'
import { useDesignSystemStore } from '@/store/designSystemStore'
import { focusEntersLevel } from '@/shared/design-system/flow'

export type PlayMode = 'edit' | 'play'

interface PlayState {
  mode: PlayMode
  /** Screen ids visited, oldest first; the last one is on screen. */
  trail: string[]
  /** The element the viewer last moved the TV focus to (a click or an arrow key) — null until they do. */
  focusId: string | null
  /** Which part of that element holds it, when it has several focusable parts (a menu's item). */
  focusItem: string | null
  /**
   * For each screen in `trail` but the last, the focus it had when the viewer
   * left it — Back puts the focus back there (the card you pressed, not the
   * screen's default).
   */
  leftFrom: { focusId: string | null; focusItem: string | null }[]
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
  leftFrom: [],

  play: () => set({ mode: 'play', trail: [useFlowStore.getState().activeId], focusId: null, focusItem: null, leftFrom: [] }),
  edit: () => set({ mode: 'edit', trail: [], focusId: null, focusItem: null, leftFrom: [] }),

  go: (screenId) => {
    if (!useFlowStore.getState().screens.some((entry) => entry.id === screenId)) return
    set((s) => {
      // A link to a screen already behind you returns to it (back, close): the
      // history unwinds to there and its focus comes back, so Esc never steps
      // forward again into what was just closed.
      const at = s.trail.lastIndexOf(screenId)
      if (at >= 0 && at < s.trail.length - 1) {
        const restored = s.leftFrom[at] ?? { focusId: null, focusItem: null }
        return { trail: s.trail.slice(0, at + 1), leftFrom: s.leftFrom.slice(0, at), ...restored }
      }
      return s.trail[s.trail.length - 1] === screenId
        ? s
        : {
            trail: [...s.trail, screenId],
            leftFrom: [...s.leftFrom, { focusId: s.focusId, focusItem: s.focusItem }],
            focusId: null,
            focusItem: null,
          }
    })
  },

  back: () => {
    if (get().trail.length < 2) return false
    set((s) => {
      const restored = s.leftFrom[s.leftFrom.length - 1] ?? { focusId: null, focusItem: null }
      return { trail: s.trail.slice(0, -1), leftFrom: s.leftFrom.slice(0, -1), ...restored }
    })
    return true
  },

  restart: () => set((s) => ({ trail: s.trail.slice(0, 1), focusId: null, focusItem: null, leftFrom: [] })),

  focus: (nodeId, item = null) => {
    // Moving the focus onto what only holds it one level deeper opens that page
    // (an interactivity button on Home is the second level), focused on it there.
    const { screens } = useFlowStore.getState()
    const current = currentPlayScreenId(get().trail, screens.map((entry) => entry.id))
    const entry =
      nodeId && get().mode === 'play'
        ? focusEntersLevel(useDesignSystemStore.getState().active, screens, current, nodeId)
        : null
    if (entry) {
      // Entered by the focus itself: nothing to return to — the page below opens
      // on its own rule (Home on the channel button).
      set((s) => ({
        trail: [...s.trail, entry.screenId],
        leftFrom: [...s.leftFrom, { focusId: null, focusItem: null }],
        focusId: entry.nodeId,
        focusItem: null,
      }))
      return
    }
    set({ focusId: nodeId, focusItem: item })
  },
}))

/** The id of the screen Play is showing, falling back to the first when the document changed under it. */
export function currentPlayScreenId(trail: string[], screenIds: string[]): string {
  const current = trail[trail.length - 1]
  return current && screenIds.includes(current) ? current : screenIds[0]
}
