/**
 * The canvas frame: its size — a user setting, persisted to localStorage — and the
 * canvas's live reading of the TV focus and the render audit (overflow, overlap,
 * collapsed text — `renderAudit.ts`), both of which `Canvas.tsx` derives from the
 * rendered screen and nobody sets by hand. The focus side is what places the
 * anchored element group; the render problems are what `chatStore` reads for the
 * one-shot repair round after a generation. Neither is document history, so
 * neither is undoable.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_FOCUS,
  DEFAULT_FRAME_SIZE,
  type FocusSide,
  type FrameSizeId,
  isFrameSizeId,
} from '@/shared/layout/frame'

export interface FocusReading {
  side: FocusSide
  /** A short name for the focused element (its label or text), or null when nothing is focusable. */
  label: string | null
}

interface FrameState {
  size: FrameSizeId
  focus: FocusReading
  /** Problems the last render measurement found (`useRenderAudit`) — empty when clean. */
  renderProblems: string[]
  /** Bumped on every measurement, whether or not the problems changed — the signal chatStore waits on. */
  renderVersion: number
  setSize: (size: FrameSizeId) => void
  setFocusReading: (focus: FocusReading) => void
  setRenderProblems: (problems: string[]) => void
}

export const useFrameStore = create<FrameState>()(
  persist(
    (set, get) => ({
      size: DEFAULT_FRAME_SIZE,
      focus: { side: DEFAULT_FOCUS, label: null },
      renderProblems: [],
      renderVersion: 0,
      setSize: (size) => set({ size: isFrameSizeId(size) ? size : DEFAULT_FRAME_SIZE }),
      setFocusReading: (focus) => {
        const current = get().focus
        if (current.side !== focus.side || current.label !== focus.label) set({ focus })
      },
      setRenderProblems: (problems) => set((s) => ({ renderProblems: problems, renderVersion: s.renderVersion + 1 })),
    }),
    {
      name: 'sfs.frame-settings',
      partialize: (s) => ({ size: s.size }),
      // Guard against a stale persisted size after the preset list changes.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<FrameState>
        return { ...current, size: isFrameSizeId(p.size) ? p.size : current.size }
      },
    },
  ),
)
